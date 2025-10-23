import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sustainable_ai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

async function setupDatabase() {
  try {
    console.log('Setting up database...')
    
    // Read and execute migration files
    const migrationsDir = path.join(__dirname, 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir).sort()
    
    for (const file of migrationFiles) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`)
        const migrationPath = path.join(migrationsDir, file)
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
        
        try {
          await pool.query(migrationSQL)
          console.log(`✅ Migration ${file} completed successfully`)
        } catch (error) {
          console.log(`⚠️  Migration ${file} failed (might already exist):`, error instanceof Error ? error.message : String(error))
        }
      }
    }
    
    console.log('✅ Database setup completed')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Database setup completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database setup failed:', error)
      process.exit(1)
    })
}

export { setupDatabase }
