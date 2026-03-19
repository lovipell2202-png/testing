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

async function populateQuestionText() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database');

    // For enumeration questions, populate question_text from title if empty
    console.log('\n📝 Populating question_text for enumeration questions...');
    const enumResult = await pool.request().query(`
      UPDATE ExamQuestions
      SET question_text = enumeration_title
      WHERE question_type = 'enumeration' 
        AND (question_text IS NULL OR question_text = '');
    `);
    console.log(`✅ Updated ${enumResult.rowsAffected[0]} enumeration questions`);

    // For procedure questions, populate question_text from title if empty
    console.log('\n📝 Populating question_text for procedure questions...');
    const procResult = await pool.request().query(`
      UPDATE ExamQuestions
      SET question_text = procedure_title
      WHERE question_type = 'procedure' 
        AND (question_text IS NULL OR question_text = '');
    `);
    console.log(`✅ Updated ${procResult.rowsAffected[0]} procedure questions`);

    // Verify the updates
    console.log('\n📊 Verification - Questions with question_text:');
    const verify = await pool.request().query(`
      SELECT 
        id,
        question_type,
        question_text,
        enumeration_title,
        procedure_title
      FROM ExamQuestions
      WHERE question_type IN ('enumeration', 'procedure')
      ORDER BY id;
    `);
    
    verify.recordset.forEach(q => {
      console.log(`  ID: ${q.id}, Type: ${q.question_type}`);
      console.log(`    Question Text: ${q.question_text}`);
    });

    console.log('\n✅ Population complete!');
    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

populateQuestionText();
