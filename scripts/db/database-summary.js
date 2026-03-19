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

async function checkDatabase() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to NSB_Training database\n');

    // Get all tables
    const tablesResult = await pool.request()
      .query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_CATALOG = 'NSB_Training' AND TABLE_TYPE = 'BASE TABLE' 
              ORDER BY TABLE_NAME`);
    
    console.log('📊 DATABASE TABLES SUMMARY:');
    console.log('='.repeat(60));
    
    for (const table of tablesResult.recordset) {
      const tableName = table.TABLE_NAME;
      
      // Get column info
      const columnsResult = await pool.request()
        .query(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tableName}' 
                ORDER BY ORDINAL_POSITION`);
      
      // Get row count
      const countResult = await pool.request()
        .query(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      const rowCount = countResult.recordset[0].count;
      const columnCount = columnsResult.recordset.length;
      
      console.log(`\n📋 ${tableName}`);
      console.log(`   Rows: ${rowCount} | Columns: ${columnCount}`);
      console.log('   Columns:');
      
      columnsResult.recordset.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`     • ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${nullable})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Database check complete!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkDatabase();
