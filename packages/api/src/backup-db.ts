import { Pool, Client } from 'pg'
import fs from 'fs'
import path from 'path'

// Database connection configuration
const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = parseInt(process.env.DB_PORT || '5432')
const DB_NAME = process.env.DB_NAME || 'sustainable_ai_db'
const DB_USER = process.env.DB_USER || 'postgres'
const DB_PASSWORD = process.env.DB_PASSWORD || 'password'

async function backupDatabase() {
  const pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
  })

  try {
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')
    const backupFileName = `backup_${timestamp}.sql`
    const backupPath = path.join(backupsDir, backupFileName)

    console.log(`Creating database backup...`)
    console.log(`Database: ${DB_NAME}`)
    console.log(`Backup file: ${backupPath}`)

    let sqlContent = `-- Database Backup
-- Generated: ${new Date().toISOString()}
-- Database: ${DB_NAME}

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

`

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)

    const tables = tablesResult.rows.map(row => row.table_name)

    // Backup extensions
    const extensionsResult = await pool.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `)

    if (extensionsResult.rows.length > 0) {
      sqlContent += '-- Extensions\n'
      for (const ext of extensionsResult.rows) {
        sqlContent += `CREATE EXTENSION IF NOT EXISTS "${ext.extname}";\n`
      }
      sqlContent += '\n'
    }

    // Backup table schemas
    for (const table of tables) {
      // Get table structure
      const createTableResult = await pool.query(`
        SELECT 
          'CREATE TABLE IF NOT EXISTS ' || quote_ident(table_name) || ' (' ||
          string_agg(
            quote_ident(column_name) || ' ' || 
            CASE 
              WHEN data_type = 'USER-DEFINED' THEN udt_name
              WHEN data_type = 'ARRAY' THEN udt_name || '[]'
              ELSE 
                CASE data_type
                  WHEN 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
                  WHEN 'character' THEN 'CHAR(' || character_maximum_length || ')'
                  WHEN 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
                  WHEN 'timestamp with time zone' THEN 'TIMESTAMP WITH TIME ZONE'
                  WHEN 'timestamp without time zone' THEN 'TIMESTAMP'
                  ELSE UPPER(data_type)
                END
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', '
          ) ||
          ');' as create_statement
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        GROUP BY table_name;
      `, [table])

      if (createTableResult.rows.length > 0) {
        sqlContent += `-- Table: ${table}\n`
        sqlContent += createTableResult.rows[0].create_statement + '\n\n'

        // Get primary keys
        const pkResult = await pool.query(`
          SELECT a.attname
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass AND i.indisprimary;
        `, [`public.${table}`])

        if (pkResult.rows.length > 0) {
          const pkColumns = pkResult.rows.map(r => `"${r.attname}"`).join(', ')
          sqlContent += `ALTER TABLE "${table}" ADD PRIMARY KEY (${pkColumns});\n\n`
        }

        // Get foreign keys
        const fkResult = await pool.query(`
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = $1;
        `, [table])

        for (const fk of fkResult.rows) {
          sqlContent += `ALTER TABLE "${table}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}");\n`
        }

        if (fkResult.rows.length > 0) {
          sqlContent += '\n'
        }

        // Get indexes
        const indexResult = await pool.query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = $1
          AND indexname NOT LIKE '%_pkey';
        `, [table])

        for (const idx of indexResult.rows) {
          sqlContent += `${idx.indexdef};\n`
        }

        if (indexResult.rows.length > 0) {
          sqlContent += '\n'
        }

        // Backup table data using COPY format for better compatibility
        const dataResult = await pool.query(`SELECT * FROM "${table}"`)
        
        if (dataResult.rows.length > 0) {
          sqlContent += `-- Data for table: ${table}\n`
          
          for (const row of dataResult.rows) {
            const columns = Object.keys(row)
            const values = columns.map(col => {
              const val = row[col]
              if (val === null) return 'NULL'
              if (val instanceof Date) return `'${val.toISOString()}'`
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
              if (typeof val === 'string') {
                // Escape single quotes and backslashes
                const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "''")
                return `'${escaped}'`
              }
              if (typeof val === 'object') {
                // For JSONB and other object types
                const jsonStr = JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "''")
                return `'${jsonStr}'::jsonb`
              }
              if (typeof val === 'number') {
                return String(val)
              }
              // For UUIDs and other types, convert to string and escape
              const strVal = String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")
              return `'${strVal}'`
            })
            
            const columnsStr = columns.map(c => `"${c}"`).join(', ')
            const valuesStr = values.join(', ')
            sqlContent += `INSERT INTO "${table}" (${columnsStr}) VALUES (${valuesStr});\n`
          }
          sqlContent += '\n'
        }
      }
    }

    sqlContent += `-- Re-enable foreign key checks
SET session_replication_role = 'origin';
`

    // Write backup file
    fs.writeFileSync(backupPath, sqlContent, 'utf8')

    // Verify backup file was created
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath)
      console.log(`✅ Backup created successfully`)
      console.log(`   File: ${backupPath}`)
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`)
      console.log(`   Tables: ${tables.length}`)
    } else {
      throw new Error('Backup file was not created')
    }
  } catch (error) {
    console.error('❌ Database backup failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    throw error
  } finally {
    await pool.end()
  }
}

// Run backup if this file is executed directly
if (require.main === module) {
  backupDatabase()
    .then(() => {
      console.log('Database backup completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database backup failed:', error)
      process.exit(1)
    })
}

export { backupDatabase }
