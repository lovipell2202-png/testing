const sql = require('mssql');

const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',
  server: 'localhost',
  port: 1433,
  database: 'NSB_Training',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function checkSchema() {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Get all tables
    const tables = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 TABLES IN DATABASE:');
    console.log('='.repeat(50));
    for (const table of tables.recordset) {
      const name = table.TABLE_NAME;
      
      // Get row count
      const count = await pool.request().query(`SELECT COUNT(*) as cnt FROM [${name}]`);
      const rowCount = count.recordset[0].cnt;
      
      // Get columns
      const cols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${name}' 
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`\n✓ ${name} (${rowCount} rows)`);
      cols.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
      });
    }
    
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSchema();
