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

    const result = await pool.request().query(`
      SELECT 
        id,
        course_id,
        question_type,
        question_text,
        enumeration_title,
        enumeration_instruction,
        enumeration_items,
        enumeration_answer,
        enumeration_items_json
      FROM ExamQuestions
      WHERE question_type = 'enumeration'
      ORDER BY id;
    `);
    
    console.log(`Found ${result.recordset.length} enumeration questions:\n`);
    result.recordset.forEach(q => {
      console.log(`ID: ${q.id}, Course: ${q.course_id}`);
      console.log(`  Title: ${q.enumeration_title}`);
      console.log(`  Question Text: ${q.question_text || '(NULL)'}`);
      console.log(`  Answer: ${q.enumeration_answer}`);
      console.log(`  Items JSON: ${q.enumeration_items_json ? 'YES' : 'NO'}`);
      console.log('');
    });

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
