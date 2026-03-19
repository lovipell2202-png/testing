const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'NSB_Training',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function run() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    const sqlFile = fs.readFileSync(
      path.join(__dirname, '../../sql/create-evaluation-form-table.sql'),
      'utf8'
    );

    await pool.request().query(sqlFile);
    console.log('✅ TrainingEvaluationForms table created (or already exists)');

    // Verify
    const check = await pool.request().query(
      `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TrainingEvaluationForms'`
    );
    if (check.recordset[0].count > 0) {
      console.log('✅ Verified: TrainingEvaluationForms table exists');
    }

    // Show columns
    const cols = await pool.request().query(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TrainingEvaluationForms' ORDER BY ORDINAL_POSITION`
    );
    console.log('\n📋 Columns:');
    cols.recordset.forEach(c => console.log(`   ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

    console.log('\n🎉 Done! Restart the server and the evaluation form save should work.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

run();
