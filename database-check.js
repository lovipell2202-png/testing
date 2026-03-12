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
    
    console.log('📊 TABLES IN DATABASE:');
    console.log('='.repeat(50));
    
    for (const table of tablesResult.recordset) {
      const tableName = table.TABLE_NAME;
      
      // Get column info
      const columnsResult = await pool.request()
        .query(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tableName}' 
                ORDER BY ORDINAL_POSITION`);
      
      // Get row count
      const countResult = await pool.request()
        .query(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      const rowCount = countResult.recordset[0].count;
      
      console.log(`\n📋 TABLE: ${tableName} (${rowCount} rows)`);
      console.log('-'.repeat(50));
      console.log('Columns:');
      
      columnsResult.recordset.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`  • ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${nullable})`);
      });
      
      // Show sample data if table has rows
      if (rowCount > 0 && rowCount <= 5) {
        console.log('\nSample Data:');
        const dataResult = await pool.request()
          .query(`SELECT TOP 5 * FROM ${tableName}`);
        
        if (dataResult.recordset.length > 0) {
          console.log(JSON.stringify(dataResult.recordset, null, 2));
        }
      } else if (rowCount > 5) {
        console.log(`\n(Showing first 5 of ${rowCount} rows)`);
        const dataResult = await pool.request()
          .query(`SELECT TOP 5 * FROM ${tableName}`);
        
        if (dataResult.recordset.length > 0) {
          console.log(JSON.stringify(dataResult.recordset, null, 2));
        }
      }
    }

    console.log('\n' + '='.repeat(50));
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
