const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',
  server: 'localhost',
  port: 1433,
  database: 'NSB_Training',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function runMigration() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    // Read and execute the SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'create-evaluation-form-table.sql'), 'utf8');
    await pool.request().query(sqlFile);
    
    console.log('✅ TrainingEvaluationForms table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

runMigration();
