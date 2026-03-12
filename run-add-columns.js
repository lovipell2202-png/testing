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

async function runMigration() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    // Add columns to ExamResults
    console.log('Adding columns to ExamResults table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExamResults' AND COLUMN_NAME = 'employee_full_name')
      BEGIN
        ALTER TABLE ExamResults ADD employee_full_name NVARCHAR(255);
      END
    `);
    console.log('✅ Added employee_full_name column');

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExamResults' AND COLUMN_NAME = 'course_title')
      BEGIN
        ALTER TABLE ExamResults ADD course_title NVARCHAR(255);
      END
    `);
    console.log('✅ Added course_title column');

    // Create indexes
    console.log('Creating indexes...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ExamResults_employee_id')
      BEGIN
        CREATE INDEX idx_ExamResults_employee_id ON ExamResults(employee_id);
      END
    `);
    console.log('✅ Created index on employee_id');

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ExamResults_exam_id')
      BEGIN
        CREATE INDEX idx_ExamResults_exam_id ON ExamResults(exam_id);
      END
    `);
    console.log('✅ Created index on exam_id');

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ExamResults_submitted_at')
      BEGIN
        CREATE INDEX idx_ExamResults_submitted_at ON ExamResults(submitted_at);
      END
    `);
    console.log('✅ Created index on submitted_at');

    console.log('\n✅ Migration completed successfully!');
    await pool.close();
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

runMigration();
