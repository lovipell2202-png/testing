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
    
    const exams = await pool.request().query(`
      SELECT e.id, e.title, e.total_questions, COUNT(eq.id) as actual_questions
      FROM Exams e
      LEFT JOIN ExamQuestions eq ON e.id = eq.exam_id
      GROUP BY e.id, e.title, e.total_questions
      ORDER BY e.id
    `);
    
    console.log('Exam Questions Summary:');
    console.log('='.repeat(80));
    exams.recordset.forEach(e => {
      console.log(`Exam ${e.id}: ${e.title}`);
      console.log(`  total_questions field: ${e.total_questions}`);
      console.log(`  actual questions in DB: ${e.actual_questions}`);
      console.log('');
    });
    
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
