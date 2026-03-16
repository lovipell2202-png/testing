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

async function setupExamsTables() {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database');

    // Create Exams table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Exams')
      BEGIN
        CREATE TABLE [dbo].[Exams] (
          [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
          [title] VARCHAR(200) NOT NULL,
          [course_title] VARCHAR(200) NOT NULL,
          [course_code] VARCHAR(50) NULL,
          [description] VARCHAR(MAX) NULL,
          [question_count] INT DEFAULT 0,
          [created_at] DATETIME DEFAULT GETDATE(),
          [updated_at] DATETIME DEFAULT GETDATE(),
          FOREIGN KEY ([course_title]) REFERENCES [CourseExamForms]([course_title]) ON DELETE CASCADE
        );
        PRINT 'Exams table created';
      END
      ELSE
        PRINT 'Exams table already exists';
    `);

    // Create ExamQuestions table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExamQuestions')
      BEGIN
        CREATE TABLE [dbo].[ExamQuestions] (
          [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
          [exam_id] BIGINT NOT NULL,
          [course_id] BIGINT NULL,
          [question_number] INT NOT NULL,
          [question_type] VARCHAR(50) NOT NULL,
          [question_text] VARCHAR(MAX) NOT NULL,
          [option_a] VARCHAR(MAX) NULL,
          [option_b] VARCHAR(MAX) NULL,
          [option_c] VARCHAR(MAX) NULL,
          [option_d] VARCHAR(MAX) NULL,
          [correct_answer] CHAR(1) NULL,
          [points] INT DEFAULT 1,
          [procedure_title] VARCHAR(200) NULL,
          [procedure_content] VARCHAR(MAX) NULL,
          [procedure_instructions] VARCHAR(MAX) NULL,
          [procedure_answer] VARCHAR(MAX) NULL,
          [procedure_items_json] VARCHAR(MAX) NULL,
          [enumeration_title] VARCHAR(200) NULL,
          [enumeration_instruction] VARCHAR(MAX) NULL,
          [enumeration_items] VARCHAR(MAX) NULL,
          [enumeration_answer] VARCHAR(MAX) NULL,
          [enumeration_items_json] VARCHAR(MAX) NULL,
          [identification_title] VARCHAR(200) NULL,
          [identification_instruction] VARCHAR(MAX) NULL,
          [identification_image_url] VARCHAR(MAX) NULL,
          [identification_answer] VARCHAR(MAX) NULL,
          [identification_items_json] VARCHAR(MAX) NULL,
          [created_at] DATETIME DEFAULT GETDATE(),
          FOREIGN KEY ([exam_id]) REFERENCES [Exams]([id]) ON DELETE CASCADE
        );
        PRINT 'ExamQuestions table created';
      END
      ELSE
        PRINT 'ExamQuestions table already exists';
    `);

    // Create indexes
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_exam_course')
        CREATE INDEX [idx_exam_course] ON [Exams]([course_title]);
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_exam_questions')
        CREATE INDEX [idx_exam_questions] ON [ExamQuestions]([exam_id]);
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_question_type')
        CREATE INDEX [idx_question_type] ON [ExamQuestions]([question_type]);
    `);

    console.log('✅ Exams and ExamQuestions tables setup complete!');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up tables:', err.message);
    process.exit(1);
  }
}

setupExamsTables();
