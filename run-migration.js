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
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    // Step 1: Check current state
    console.log('\n📋 Checking current ExamQuestions columns...');
    const checkResult = await pool.request()
      .query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'ExamQuestions'
              ORDER BY ORDINAL_POSITION`);
    console.log('Current columns:', checkResult.recordset.map(r => r.COLUMN_NAME).join(', '));

    // Step 2: Drop old table
    console.log('\n🗑️  Dropping old ExamQuestions table...');
    await pool.request().query('DROP TABLE IF EXISTS ExamQuestions');
    console.log('✅ Old table dropped');

    // Step 3: Create new table with course_id
    console.log('\n🔨 Creating new ExamQuestions table with course_id...');
    await pool.request().query(`
      CREATE TABLE ExamQuestions (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        course_id BIGINT NOT NULL,
        question_number INT,
        question_type VARCHAR(50),
        question_text VARCHAR(MAX),
        option_a VARCHAR(MAX),
        option_b VARCHAR(MAX),
        option_c VARCHAR(MAX),
        option_d VARCHAR(MAX),
        correct_answer CHAR(1),
        enumeration_title VARCHAR(MAX),
        enumeration_instruction VARCHAR(MAX),
        enumeration_items VARCHAR(MAX),
        enumeration_answer VARCHAR(MAX),
        procedure_title VARCHAR(MAX),
        procedure_content VARCHAR(MAX),
        procedure_instructions VARCHAR(MAX),
        procedure_answer VARCHAR(MAX),
        points INT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ New table created');

    // Step 4: Create indexes
    console.log('\n📊 Creating indexes...');
    await pool.request().query('CREATE INDEX idx_examquestions_course_id ON ExamQuestions(course_id)');
    await pool.request().query('CREATE INDEX idx_examquestions_type ON ExamQuestions(question_type)');
    console.log('✅ Indexes created');

    // Step 5: Verify
    console.log('\n✅ Verifying migration...');
    const coursesCount = await pool.request().query('SELECT COUNT(*) AS count FROM Courses');
    const questionsCount = await pool.request().query('SELECT COUNT(*) AS count FROM ExamQuestions');
    
    console.log(`\n📊 Database Status:`);
    console.log(`   Courses: ${coursesCount.recordset[0].count}`);
    console.log(`   ExamQuestions: ${questionsCount.recordset[0].count}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart backend server (Ctrl+C then node server.js)');
    console.log('   2. Refresh browser (Ctrl+Shift+R)');
    console.log('   3. Courses should now appear in Exam Management');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runMigration();
