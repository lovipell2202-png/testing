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
    
    console.log('Adding missing columns to ExamQuestions...');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'procedure_title')
      ALTER TABLE ExamQuestions ADD procedure_title VARCHAR(200) NULL
    `);
    console.log('✅ Added procedure_title');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'procedure_content')
      ALTER TABLE ExamQuestions ADD procedure_content VARCHAR(MAX) NULL
    `);
    console.log('✅ Added procedure_content');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'procedure_instructions')
      ALTER TABLE ExamQuestions ADD procedure_instructions VARCHAR(MAX) NULL
    `);
    console.log('✅ Added procedure_instructions');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'enumeration_title')
      ALTER TABLE ExamQuestions ADD enumeration_title VARCHAR(200) NULL
    `);
    console.log('✅ Added enumeration_title');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'enumeration_instruction')
      ALTER TABLE ExamQuestions ADD enumeration_instruction VARCHAR(MAX) NULL
    `);
    console.log('✅ Added enumeration_instruction');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExamQuestions') AND name = 'enumeration_items')
      ALTER TABLE ExamQuestions ADD enumeration_items VARCHAR(MAX) NULL
    `);
    console.log('✅ Added enumeration_items');
    
    await pool.close();
    console.log('\n✅ All columns added successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addColumns();
