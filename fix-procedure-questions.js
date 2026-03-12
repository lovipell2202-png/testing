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

async function fix() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    console.log('Fixing procedure questions...\n');

    // Fix question 67
    await pool.request()
      .input('id', sql.BigInt, 67)
      .input('question_text', sql.VarChar(sql.MAX), 'Implementing Sort Step')
      .query(`UPDATE ExamQuestions SET question_text = @question_text WHERE id = @id`);
    console.log('✅ Question 67: question_text set to "Implementing Sort Step"');

    // Fix question 68
    await pool.request()
      .input('id', sql.BigInt, 68)
      .input('question_text', sql.VarChar(sql.MAX), 'Maintaining 5S Standards')
      .query(`UPDATE ExamQuestions SET question_text = @question_text WHERE id = @id`);
    console.log('✅ Question 68: question_text set to "Maintaining 5S Standards"');

    // Verify
    console.log('\nVerification:');
    const result = await pool.request().query(`
      SELECT id, question_type, question_text, procedure_title
      FROM ExamQuestions
      WHERE id IN (67, 68)
      ORDER BY id;
    `);

    result.recordset.forEach(q => {
      console.log(`ID: ${q.id}`);
      console.log(`  question_text: ${q.question_text}`);
      console.log(`  procedure_title: ${q.procedure_title}`);
    });

    console.log('\n✅ All procedure questions fixed!');
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fix();
