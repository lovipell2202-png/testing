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

async function checkJson() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    const result = await pool.request().query(`
      SELECT 
        id,
        enumeration_title,
        enumeration_items_json,
        enumeration_answer
      FROM ExamQuestions
      WHERE question_type = 'enumeration'
      ORDER BY id;
    `);
    
    result.recordset.forEach(q => {
      console.log(`\n📋 Question ${q.id}: ${q.enumeration_title}`);
      console.log(`Answer: ${q.enumeration_answer}`);
      if (q.enumeration_items_json) {
        try {
          const items = JSON.parse(q.enumeration_items_json);
          console.log(`Items JSON:`);
          console.log(JSON.stringify(items, null, 2));
        } catch (e) {
          console.log(`JSON Parse Error: ${e.message}`);
        }
      } else {
        console.log('No JSON data');
      }
    });

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkJson();
