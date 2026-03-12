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
    
    console.log('Checking Exam 3 (7 QC Tools Exam):');
    const result = await pool.request().query(`
      SELECT * FROM ExamQuestions WHERE exam_id = 3 ORDER BY question_number
    `);
    
    console.log('Total questions for exam 3:', result.recordset.length);
    result.recordset.forEach((q, idx) => {
      console.log(`Q${idx + 1}: ${q.question_type} - ${q.question_text || q.enumeration_title || q.procedure_title}`);
    });
    
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
