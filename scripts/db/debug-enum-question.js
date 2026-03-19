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

async function debug() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Get all enumeration questions
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
    
    console.log('All Enumeration Questions:\n');
    result.recordset.forEach(q => {
      console.log(`ID: ${q.id}`);
      console.log(`  question_text: ${q.question_text || '(NULL)'}`);
      console.log(`  enumeration_title: ${q.enumeration_title}`);
      console.log(`  enumeration_instruction: ${q.enumeration_instruction}`);
      console.log(`  enumeration_items: ${q.enumeration_items}`);
      console.log(`  enumeration_answer: ${q.enumeration_answer}`);
      console.log(`  enumeration_items_json: ${q.enumeration_items_json || '(NULL)'}`);
      console.log('');
    });

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

debug();
