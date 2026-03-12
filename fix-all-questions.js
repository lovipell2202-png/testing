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

async function fixAllQuestions() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database\n');

    // Get all enumeration questions
    console.log('📝 Processing enumeration questions...');
    const enumQuestions = await pool.request().query(`
      SELECT id, enumeration_title, enumeration_answer
      FROM ExamQuestions
      WHERE question_type = 'enumeration'
      ORDER BY id;
    `);

    for (const q of enumQuestions.recordset) {
      // Create items from answer
      const answers = q.enumeration_answer.split(',').map(a => a.trim()).filter(a => a);
      const items = answers.map((answer, idx) => ({
        id: idx + 1,
        number: idx + 1,
        text: answer, // Use answer as text for now
        answer: answer
      }));

      const itemsJson = JSON.stringify(items);
      const questionText = q.enumeration_title; // Use title as question text

      await pool.request()
        .input('id', sql.BigInt, q.id)
        .input('question_text', sql.VarChar(sql.MAX), questionText)
        .input('items_json', sql.VarChar(sql.MAX), itemsJson)
        .query(`
          UPDATE ExamQuestions
          SET question_text = @question_text,
              enumeration_items_json = @items_json
          WHERE id = @id
        `);

      console.log(`  ✅ Question ${q.id}: "${questionText}"`);
      console.log(`     Items: ${items.map(i => i.text).join(', ')}`);
    }

    // Get all procedure questions
    console.log('\n📝 Processing procedure questions...');
    const procQuestions = await pool.request().query(`
      SELECT id, procedure_title
      FROM ExamQuestions
      WHERE question_type = 'procedure'
      ORDER BY id;
    `);

    for (const q of procQuestions.recordset) {
      const questionText = q.procedure_title;

      await pool.request()
        .input('id', sql.BigInt, q.id)
        .input('question_text', sql.VarChar(sql.MAX), questionText)
        .query(`
          UPDATE ExamQuestions
          SET question_text = @question_text
          WHERE id = @id
        `);

      console.log(`  ✅ Question ${q.id}: "${questionText}"`);
    }

    // Verify all questions
    console.log('\n📊 Verification - All enumeration/procedure questions:');
    const verify = await pool.request().query(`
      SELECT 
        id,
        question_type,
        question_text,
        enumeration_title,
        enumeration_items_json,
        procedure_title
      FROM ExamQuestions
      WHERE question_type IN ('enumeration', 'procedure')
      ORDER BY id;
    `);

    verify.recordset.forEach(q => {
      console.log(`\n  ID: ${q.id} (${q.question_type})`);
      console.log(`    Question Text: "${q.question_text || '(NULL)'}"`);
      if (q.question_type === 'enumeration' && q.enumeration_items_json) {
        try {
          const items = JSON.parse(q.enumeration_items_json);
          console.log(`    Items: ${items.map(i => i.text).join(', ')}`);
        } catch (e) {
          console.log(`    Items JSON: ${q.enumeration_items_json}`);
        }
      }
    });

    console.log('\n✅ All questions fixed!');
    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixAllQuestions();
