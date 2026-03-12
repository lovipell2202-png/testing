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

    const itemsJson = JSON.stringify([
      { id: 1, number: 1, text: 'Sort', answer: 'SORT' },
      { id: 2, number: 2, text: 'Seiri', answer: 'SEIRI' }
    ]);

    await pool.request()
      .input('id', sql.BigInt, 59)
      .input('question_text', sql.VarChar(sql.MAX), 'List the 5S steps')
      .input('items_json', sql.VarChar(sql.MAX), itemsJson)
      .query(`
        UPDATE ExamQuestions
        SET question_text = @question_text,
            enumeration_items_json = @items_json
        WHERE id = @id
      `);

    console.log('✅ Updated question 59');

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fix();
