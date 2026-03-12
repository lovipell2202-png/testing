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

async function check() {
  try {
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ExamQuestions' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('ExamQuestions columns:');
    result.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
