import { Pool, Client } from 'pg'
import fs from 'fs'
import path from 'path'

async function restoreStatementsIndividually(pool: Pool, sql: string) {
  // Parse SQL more carefully, handling strings and comments
  const statements: string[] = []
  let currentStatement = ''
  let inString = false
  let stringChar = ''
  let i = 0

  while (i < sql.length) {
    const char = sql[i]
    const nextChar = sql[i + 1]

    if (!inString && char === '-' && nextChar === '-') {
      // Skip line comment
      while (i < sql.length && sql[i] !== '\n') i++
      continue
    }

    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      currentStatement += char
    } else if (inString && char === stringChar && sql[i - 1] !== '\\') {
      inString = false
      stringChar = ''
      currentStatement += char
    } else if (!inString && char === ';') {
      currentStatement += char
      const trimmed = currentStatement.trim()
      if (trimmed.length > 0 && !trimmed.startsWith('--')) {
        statements.push(trimmed)
      }
      currentStatement = ''
    } else {
      currentStatement += char
    }
    i++
  }

  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim())
  }

  // Execute statements one by one
  for (let i = 0; i < statements.length; i++) {
    try {
      await pool.query(statements[i])
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')) {
          // Skip expected errors
          continue
        }
      }
      // Log unexpected errors
      console.warn(`⚠️  Statement ${i + 1} warning:`, error instanceof Error ? error.message : String(error))
    }
  }
}

// Database connection configuration
const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = parseInt(process.env.DB_PORT || '5432')
const DB_NAME = process.env.DB_NAME || 'sustainable_ai_db'
const DB_USER = process.env.DB_USER || 'postgres'
const DB_PASSWORD = process.env.DB_PASSWORD || 'password'

async function restoreDatabase(backupFile?: string) {
  try {
    const backupsDir = path.join(process.cwd(), 'backups')

    // If no backup file specified, use the latest one
    let backupPath: string
    if (backupFile) {
      // Use specified backup file (can be relative or absolute)
      if (path.isAbsolute(backupFile)) {
        backupPath = backupFile
      } else {
        backupPath = path.join(backupsDir, backupFile)
      }
    } else {
      // Find the latest backup file
      if (!fs.existsSync(backupsDir)) {
        throw new Error('Backups directory does not exist. No backups found.')
      }

      const files = fs.readdirSync(backupsDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => ({
          name: file,
          path: path.join(backupsDir, file),
          time: fs.statSync(path.join(backupsDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)

      if (files.length === 0) {
        throw new Error('No backup files found in backups directory.')
      }

      backupPath = files[0].path
      console.log(`Using latest backup: ${files[0].name}`)
    }

    // Verify backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`)
    }

    console.log(`Restoring database from backup...`)
    console.log(`Database: ${DB_NAME}`)
    console.log(`Backup file: ${backupPath}`)

    // Connect to postgres database to drop/create the target database
    const adminPool = new Pool({
      host: DB_HOST,
      port: DB_PORT,
      database: 'postgres',
      user: DB_USER,
      password: DB_PASSWORD,
    })

    try {
      // Drop the database if it exists
      console.log('Dropping existing database...')
      try {
        // Terminate all connections to the database first
        await adminPool.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = $1 AND pid <> pg_backend_pid();
        `, [DB_NAME])
        
        await adminPool.query(`DROP DATABASE IF EXISTS ${DB_NAME};`)
        console.log('✅ Database dropped successfully')
      } catch (error) {
        // Ignore errors if database doesn't exist
        console.log('⚠️  Database may not exist (continuing...)')
      }

      // Create the database
      console.log('Creating new database...')
      await adminPool.query(`CREATE DATABASE ${DB_NAME};`)
      console.log('✅ Database created successfully')
    } finally {
      await adminPool.end()
    }

    // Connect to the target database to restore data
    const pool = new Pool({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
    })

    try {
      // Read and execute backup file
      console.log('Restoring data from backup...')
      const backupSQL = fs.readFileSync(backupPath, 'utf8')

      // Parse and execute SQL statements individually
      // This handles complex SQL with strings and comments properly
      await restoreStatementsIndividually(pool, backupSQL)

      console.log('✅ Database restored successfully')
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('❌ Database restore failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    throw error
  }
}

// Run restore if this file is executed directly
if (require.main === module) {
  const backupFile = process.argv[2]
  restoreDatabase(backupFile)
    .then(() => {
      console.log('Database restore completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database restore failed:', error)
      process.exit(1)
    })
}

export { restoreDatabase }
