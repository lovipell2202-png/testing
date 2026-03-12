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

async function fixExam() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database\n');

    // Update exam 3 to have 0 questions (since it has no questions in database)
    await pool.request()
      .input('id', sql.BigInt, 3)
      .input('total_questions', sql.Int, 0)
      .query(`UPDATE Exams SET total_questions = @total_questions WHERE id = @id`);

    console.log('✅ Updated Exam 3 (7 QC Tools Exam):');
    console.log('   total_questions: 0 (no questions in database)');
    console.log('   You can now add questions by editing the exam\n');

    // Show all exams
    const result = await pool.request().query(`
      SELECT e.id, e.title, e.total_questions, COUNT(eq.id) as actual_questions
      FROM Exams e
      LEFT JOIN ExamQuestions eq ON e.id = eq.exam_id
      GROUP BY e.id, e.title, e.total_questions
      ORDER BY e.id
    `);

    console.log('Updated Exam Summary:');
    console.log('='.repeat(80));
    result.recordset.forEach(e => {
      console.log(`Exam ${e.id}: ${e.title}`);
      console.log(`  total_questions field: ${e.total_questions}`);
      console.log(`  actual questions in DB: ${e.actual_questions}`);
      console.log('');
    });

    await pool.close();
    console.log('✅ Fix complete');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

fixExam();
