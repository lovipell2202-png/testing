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

async function verify() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    console.log('='.repeat(80));
    console.log('FINAL VERIFICATION - Question Text & Items Fetching');
    console.log('='.repeat(80));

    const result = await pool.request().query(`
      SELECT 
        id,
        course_id,
        question_type,
        question_text,
        enumeration_title,
        enumeration_items_json,
        procedure_title,
        procedure_items_json
      FROM ExamQuestions
      WHERE question_type IN ('enumeration', 'procedure')
      ORDER BY id;
    `);
    
    console.log(`\n✅ Found ${result.recordset.length} enumeration/procedure questions\n`);
    
    result.recordset.forEach(q => {
      console.log(`📌 Question ID: ${q.id} (${q.question_type.toUpperCase()})`);
      console.log(`   Question Text: "${q.question_text || '(EMPTY)'}"`);
      
      if (q.question_type === 'enumeration') {
        console.log(`   Title: "${q.enumeration_title}"`);
        if (q.enumeration_items_json) {
          try {
            const items = JSON.parse(q.enumeration_items_json);
            console.log(`   Items (${items.length}):`);
            items.forEach((item, idx) => {
              console.log(`     ${idx + 1}. "${item.text}" → Answer: ${item.answer}`);
            });
          } catch (e) {
            console.log(`   Items JSON: ${q.enumeration_items_json}`);
          }
        } else {
          console.log(`   Items JSON: (NULL)`);
        }
      } else if (q.question_type === 'procedure') {
        console.log(`   Title: "${q.procedure_title}"`);
        if (q.procedure_items_json) {
          console.log(`   Items JSON: ${q.procedure_items_json}`);
        } else {
          console.log(`   Items JSON: (NULL or empty)`);
        }
      }
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

verify();
