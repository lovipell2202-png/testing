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
        enumeration_items_json
      FROM ExamQuestions
      WHERE question_type = 'enumeration'
      ORDER BY id DESC;
    `);
    
    console.log(`Found ${result.recordset.length} enumeration questions:\n`);
    result.recordset.forEach(q => {
      console.log(`ID: ${q.id}, Course: ${q.course_id}`);
      console.log(`  question_text: ${q.question_text || '(NULL)'}`);
      console.log(`  enumeration_title: ${q.enumeration_title}`);
      console.log(`  enumeration_items_json: ${q.enumeration_items_json || '(NULL)'}`);
      console.log('');
    });

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
