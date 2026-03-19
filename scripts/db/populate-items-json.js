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

async function populateItemsJson() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database');

    // Get all enumeration questions
    console.log('\n📝 Fetching enumeration questions...');
    const enumQuestions = await pool.request().query(`
      SELECT id, enumeration_answer, enumeration_items_json
      FROM ExamQuestions
      WHERE question_type = 'enumeration' 
        AND (enumeration_items_json IS NULL OR enumeration_items_json = '')
        AND enumeration_answer IS NOT NULL;
    `);

    console.log(`Found ${enumQuestions.recordset.length} enumeration questions to update`);

    // Update each enumeration question
    for (const q of enumQuestions.recordset) {
      const answers = q.enumeration_answer.split(',').map(a => a.trim()).filter(a => a);
      const items = answers.map((answer, idx) => ({
        id: idx + 1,
        number: idx + 1,
        text: `Item ${idx + 1}`,
        answer: answer
      }));
      
      const itemsJson = JSON.stringify(items);
      
      await pool.request()
        .input('id', sql.BigInt, q.id)
        .input('itemsJson', sql.VarChar(sql.MAX), itemsJson)
        .query(`UPDATE ExamQuestions SET enumeration_items_json = @itemsJson WHERE id = @id`);
      
      console.log(`  ✅ Updated question ${q.id}`);
    }

    // For procedure questions, create empty JSON array if not exists
    console.log('\n📝 Populating procedure_items_json...');
    const procResult = await pool.request().query(`
      UPDATE ExamQuestions
      SET procedure_items_json = '[]'
      WHERE question_type = 'procedure' 
        AND (procedure_items_json IS NULL OR procedure_items_json = '');
    `);
    console.log(`✅ Updated ${procResult.rowsAffected[0]} procedure questions`);

    // Verify the updates
    console.log('\n📊 Verification - Enumeration questions with JSON:');
    const verifyEnum = await pool.request().query(`
      SELECT 
        id,
        question_type,
        enumeration_title,
        enumeration_items_json,
        enumeration_answer
      FROM ExamQuestions
      WHERE question_type = 'enumeration'
      ORDER BY id;
    `);
    
    verifyEnum.recordset.forEach(q => {
      console.log(`  ID: ${q.id}, Title: ${q.enumeration_title}`);
      console.log(`    Answer: ${q.enumeration_answer}`);
      if (q.enumeration_items_json) {
        try {
          const items = JSON.parse(q.enumeration_items_json);
          console.log(`    Items: ${items.length} items loaded`);
        } catch (e) {
          console.log(`    JSON: ${q.enumeration_items_json.substring(0, 100)}`);
        }
      }
    });

    console.log('\n✅ Population complete!');
    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

populateItemsJson();
