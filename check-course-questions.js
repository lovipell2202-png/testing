const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'NSB_Training',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'YourPassword123!'
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableKeepAlive: true
  }
};

async function check() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Find the course
    const courseResult = await pool.request().query(`
      SELECT id, course_title FROM Courses 
      WHERE course_title LIKE '%5S FOD%'
      ORDER BY id;
    `);

    console.log('Courses found:');
    courseResult.recordset.forEach(c => {
      console.log(`  ID: ${c.id}, Title: ${c.course_title}`);
    });

    if (courseResult.recordset.length > 0) {
      const courseId = courseResult.recordset[0].id;
      
      // Get questions for this course
      const questionsResult = await pool.request()
        .input('course_id', sql.BigInt, courseId)
        .query(`
          SELECT 
            id,
            question_type,
            question_text,
            enumeration_title,
            enumeration_items_json,
            procedure_title,
            option_a,
            option_b
          FROM ExamQuestions
          WHERE course_id = @course_id
          ORDER BY question_type, id;
        `);

      console.log(`\nQuestions for course ${courseId}:`);
      console.log(`Total: ${questionsResult.recordset.length}\n`);

      questionsResult.recordset.forEach(q => {
        console.log(`ID: ${q.id}, Type: ${q.question_type}`);
        console.log(`  question_text: ${q.question_text || '(NULL)'}`);
        if (q.question_type === 'enumeration') {
          console.log(`  enumeration_title: ${q.enumeration_title}`);
          console.log(`  enumeration_items_json: ${q.enumeration_items_json ? 'YES' : 'NO'}`);
        } else if (q.question_type === 'multiple_choice') {
          console.log(`  option_a: ${q.option_a}`);
          console.log(`  option_b: ${q.option_b}`);
        } else if (q.question_type === 'procedure') {
          console.log(`  procedure_title: ${q.procedure_title}`);
        }
        console.log('');
      });
    }

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
