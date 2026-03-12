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

async function addColumns() {
  try {
    const pool = await sql.connect(dbConfig);
    
    console.log('Adding answer columns...');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'enumeration_answer')
      ALTER TABLE ExamQuestions ADD enumeration_answer VARCHAR(MAX) NULL
    `);
    console.log('✅ Added enumeration_answer');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'procedure_answer')
      ALTER TABLE ExamQuestions ADD procedure_answer VARCHAR(MAX) NULL
    `);
    console.log('✅ Added procedure_answer');
    
    await pool.close();
    console.log('\n✅ All columns added!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addColumns();
