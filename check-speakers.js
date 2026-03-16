const sql = require('mssql');

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

async function checkData() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('=== RESOURCE SPEAKERS ===');
    const result = await pool.request()
      .query(`SELECT DISTINCT trainer FROM TrainingRecords WHERE trainer IS NOT NULL AND trainer != '' ORDER BY trainer`);
    console.log('Count:', result.recordset.length);
    result.recordset.forEach(r => console.log('-', r.trainer));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

checkData();
