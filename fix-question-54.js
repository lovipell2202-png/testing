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

    // Update question 54 with question_text and items_json
    const itemsJson = JSON.stringify([
      { id: 1, number: 1, text: 'Sort', answer: 'SORT' },
      { id: 2, number: 2, text: 'Seiri', answer: 'SEIRI' }
    ]);

    const result = await pool.request()
      .input('id', sql.BigInt, 54)
      .input('question_text', sql.VarChar(sql.MAX), 'List the 5S steps')
      .input('items_json', sql.VarChar(sql.MAX), itemsJson)
      .query(`
        UPDATE ExamQuestions
        SET question_text = @question_text,
            enumeration_items_json = @items_json
        WHERE id = @id
      `);

    console.log(`✅ Updated question 54`);
    console.log(`   question_text: "List the 5S steps"`);
    console.log(`   items_json: ${itemsJson}`);

    // Verify
    const verify = await pool.request()
      .input('id', sql.BigInt, 54)
      .query(`SELECT id, question_text, enumeration_items_json FROM ExamQuestions WHERE id = @id`);

    if (verify.recordset.length > 0) {
      const q = verify.recordset[0];
      console.log(`\n✅ Verification:`);
      console.log(`   question_text: ${q.question_text}`);
      console.log(`   items_json: ${q.enumeration_items_json}`);
    }

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fix();
