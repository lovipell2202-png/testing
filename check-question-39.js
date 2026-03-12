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
        question_type,
        question_text,
        enumeration_title,
        enumeration_instruction,
        enumeration_items,
        enumeration_answer,
        enumeration_items_json
      FROM ExamQuestions
      WHERE id = 39;
    `);
    
    if (result.recordset.length > 0) {
      const q = result.recordset[0];
      console.log('Question 39 Data:');
      console.log(JSON.stringify(q, null, 2));
    } else {
      console.log('Question 39 not found');
    }

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
