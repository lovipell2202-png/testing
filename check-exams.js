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

async function checkExams() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database\n');

    // Check Exams table
    const examsResult = await pool.request().query(`
      SELECT e.id, e.course_id, e.title, e.description, e.total_questions, e.passing_score, e.created_at, c.course_title
      FROM Exams e
      LEFT JOIN Courses c ON e.course_id = c.id
      ORDER BY e.created_at DESC
    `);

    console.log('📊 EXAMS IN DATABASE:');
    console.log('='.repeat(80));
    if (examsResult.recordset.length === 0) {
      console.log('No exams found in database');
    } else {
      examsResult.recordset.forEach((exam, idx) => {
        console.log(`\n${idx + 1}. ${exam.title}`);
        console.log(`   Course: ${exam.course_title}`);
        console.log(`   Questions: ${exam.total_questions}`);
        console.log(`   Passing Score: ${exam.passing_score}%`);
        console.log(`   Created: ${exam.created_at}`);
      });
    }

    // Check ExamQuestions table
    const questionsResult = await pool.request().query(`
      SELECT eq.exam_id, eq.question_type, COUNT(*) as count
      FROM ExamQuestions eq
      GROUP BY eq.exam_id, eq.question_type
      ORDER BY eq.exam_id
    `);

    console.log('\n\n❓ QUESTIONS BY EXAM:');
    console.log('='.repeat(80));
    if (questionsResult.recordset.length === 0) {
      console.log('No questions found in database');
    } else {
      questionsResult.recordset.forEach(row => {
        console.log(`Exam ID ${row.exam_id}: ${row.count} ${row.question_type} questions`);
      });
    }

    await pool.close();
    console.log('\n✅ Check complete');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkExams();
