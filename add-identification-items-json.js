const sql = require('mssql');

const config = {
  server: 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'YourPassword123!'
    }
  },
  options: {
    database: 'NSB_Training',
    trustServerCertificate: true,
    encrypt: true
  }
};

async function addIdentificationItemsJsonColumn() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database');

    // Check if column exists
    const checkResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ExamQuestions' 
      AND COLUMN_NAME = 'identification_items_json'
    `);

    if (checkResult.recordset.length > 0) {
      console.log('✅ Column identification_items_json already exists');
      await pool.close();
      process.exit(0);
    }

    // Add the column
    console.log('📝 Adding identification_items_json column...');
    await pool.request().query(`
      ALTER TABLE ExamQuestions
      ADD identification_items_json VARCHAR(MAX) NULL;
    `);
    console.log('✅ Column identification_items_json added successfully');

    // Check if identification_image_url column exists
    const imageUrlResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ExamQuestions' 
      AND COLUMN_NAME = 'identification_image_url'
    `);

    if (imageUrlResult.recordset.length === 0) {
      console.log('📝 Adding identification_image_url column...');
      await pool.request().query(`
        ALTER TABLE ExamQuestions
        ADD identification_image_url VARCHAR(MAX) NULL;
      `);
      console.log('✅ Column identification_image_url added successfully');
    } else {
      console.log('✅ Column identification_image_url already exists');
    }

    // Verify all identification columns exist
    console.log('\n📋 Verifying all identification columns...');
    const verifyResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ExamQuestions' 
      AND COLUMN_NAME LIKE 'identification%'
      ORDER BY COLUMN_NAME
    `);

    console.log('\n✅ Identification columns in database:');
    verifyResult.recordset.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    console.log('\n✅ Database migration completed successfully!');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addIdentificationItemsJsonColumn();
