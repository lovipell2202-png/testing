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

async function test() {
  try {
    console.log('Attempting connection...');
    const pool = await sql.connect(dbConfig);
    console.log('✅ Connected!');
    const result = await pool.request().query('SELECT COUNT(*) as count FROM Employees');
    console.log('Employees:', result.recordset[0].count);
    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
