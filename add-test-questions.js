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

async function addTestQuestions() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database\n');

    // Find the course ID for "5S FOD EXAMINATION SET A"
    console.log('🔍 Finding course: 5S FOD EXAMINATION SET A...');
    const courseResult = await pool.request()
      .query(`SELECT id FROM Courses WHERE course_title LIKE '%5S FOD%'`);
    
    if (courseResult.recordset.length === 0) {
      console.error('❌ Course not found');
      return;
    }

    const courseId = courseResult.recordset[0].id;
    console.log(`✅ Found course ID: ${courseId}\n`);

    // Multiple Choice Questions (2)
    console.log('📝 Adding Multiple Choice Questions...');
    
    // MC Question 1
    await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .input('question_number', sql.Int, 1)
      .input('question_type', sql.VarChar(50), 'multiple_choice')
      .input('question_text', sql.VarChar(sql.MAX), 'What does 5S stand for?')
      .input('option_a', sql.VarChar(sql.MAX), 'Sort, Set, Shine, Standardize, Sustain')
      .input('option_b', sql.VarChar(sql.MAX), 'Safety, Security, Service, Support, System')
      .input('option_c', sql.VarChar(sql.MAX), 'Speed, Strength, Skill, Strategy, Success')
      .input('option_d', sql.VarChar(sql.MAX), 'Source, Supply, Schedule, Scope, Scale')
      .input('correct_answer', sql.Char(1), 'A')
      .input('points', sql.Int, 1)
      .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, points, created_at)
              VALUES (@course_id, @question_number, @question_type, @question_text, @option_a, @option_b, @option_c, @option_d, @correct_answer, @points, GETDATE())`);
    console.log('  ✅ MC Question 1 added');

    // MC Question 2
    await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .input('question_number', sql.Int, 2)
      .input('question_type', sql.VarChar(50), 'multiple_choice')
      .input('question_text', sql.VarChar(sql.MAX), 'Which step involves removing unnecessary items?')
      .input('option_a', sql.VarChar(sql.MAX), 'Set in Order')
      .input('option_b', sql.VarChar(sql.MAX), 'Sort')
      .input('option_c', sql.VarChar(sql.MAX), 'Shine')
      .input('option_d', sql.VarChar(sql.MAX), 'Sustain')
      .input('correct_answer', sql.Char(1), 'B')
      .input('points', sql.Int, 1)
      .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, points, created_at)
              VALUES (@course_id, @question_number, @question_type, @question_text, @option_a, @option_b, @option_c, @option_d, @correct_answer, @points, GETDATE())`);
    console.log('  ✅ MC Question 2 added\n');

    // Enumeration Questions (2)
    console.log('📝 Adding Enumeration Questions...');
    
    // Enumeration Question 1
    await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .input('question_number', sql.Int, 1)
      .input('question_type', sql.VarChar(50), 'enumeration')
      .input('enumeration_title', sql.VarChar(sql.MAX), 'Order the 5S Steps')
      .input('enumeration_instruction', sql.VarChar(sql.MAX), 'Arrange the 5S steps in correct order')
      .input('enumeration_items', sql.VarChar(sql.MAX), '5')
      .input('enumeration_answer', sql.VarChar(sql.MAX), 'A, B, C, D, E')
      .input('points', sql.Int, 1)
      .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, enumeration_title, enumeration_instruction, enumeration_items, enumeration_answer, points, created_at)
              VALUES (@course_id, @question_number, @question_type, @enumeration_title, @enumeration_instruction, @enumeration_items, @enumeration_answer, @points, GETDATE())`);
    console.log('  ✅ Enumeration Question 1 added');

    // Enumeration Question 2
    await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .input('question_number', sql.Int, 2)
      .input('question_type', sql.VarChar(50), 'enumeration')
      .input('enumeration_title', sql.VarChar(sql.MAX), 'Benefits of 5S Implementation')
      .input('enumeration_instruction', sql.VarChar(sql.MAX), 'List the main benefits in order of importance')
      .input('enumeration_items', sql.VarChar(sql.MAX), '4')
      .input('enumeration_answer', sql.VarChar(sql.MAX), 'A, B, C, D')
      .input('points', sql.Int, 1)
      .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, enumeration_title, enumeration_instruction, enumeration_items, enumeration_answer, points, created_at)
              VALUES (@course_id, @question_number, @question_type, @enumeration_title, @enumeration_instruction, @enumeration_items, @enumeration_answer, @points, GETDATE())`);
    console.log('  ✅ Enumeration Question 2 added\n');

    // Procedure Questions (2)
    console.log('📝 Adding Procedure Questions...');
    
    // Procedure Question 1
    await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .input('question_number', sql.Int, 1)
      .input('question_type', sql.VarChar(50), 'procedure')
      .input('procedure_title', sql.VarChar(sql.MAX), 'Implementing Sort Step')
      .input('procedure_content', sql.VarChar(sql.MAX), 'Step 1: Identify all items in the area\nStep 2: Classify items as needed or not needed\nStep 3: Remove unnecessary items\nStep 4: Document the process')
      .input('procedure_instructions', sql.VarChar(sql.MAX), 'Follow the steps to implement the Sort phase')
      .input('procedure_answer', sql.VarChar(sql.MAX), 'A, B, C, D')
      .input('points', sql.Int, 1)
      .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, procedure_title, procedure_content, procedure_instructions, procedure_answer, points, created_at)
              VALUES (@course_id, @question_number, @question_type, @procedure_title, @procedure_content, @procedure_instructions, @procedure_answer, @points, GETDATE())`);
    console.log('  ✅ Procedure Question 1 added');

    // Procedure Question 2
    await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .input('question_number', sql.Int, 2)
      .input('question_type', sql.VarChar(50), 'procedure')
      .input('procedure_title', sql.VarChar(sql.MAX), 'Maintaining 5S Standards')
      .input('procedure_content', sql.VarChar(sql.MAX), 'Step 1: Conduct daily audits\nStep 2: Review 5S checklist\nStep 3: Address non-compliance issues\nStep 4: Provide team training')
      .input('procedure_instructions', sql.VarChar(sql.MAX), 'Follow the maintenance procedure')
      .input('procedure_answer', sql.VarChar(sql.MAX), 'A, B, C, D')
      .input('points', sql.Int, 1)
      .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, procedure_title, procedure_content, procedure_instructions, procedure_answer, points, created_at)
              VALUES (@course_id, @question_number, @question_type, @procedure_title, @procedure_content, @procedure_instructions, @procedure_answer, @points, GETDATE())`);
    console.log('  ✅ Procedure Question 2 added\n');

    // Verify
    console.log('✅ Verifying questions added...');
    const countResult = await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .query(`SELECT question_type, COUNT(*) as count FROM ExamQuestions WHERE course_id = @course_id GROUP BY question_type`);
    
    console.log('\n📊 Questions by Type:');
    countResult.recordset.forEach(row => {
      console.log(`   ${row.question_type}: ${row.count}`);
    });

    const totalResult = await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .query(`SELECT COUNT(*) as total FROM ExamQuestions WHERE course_id = @course_id`);
    
    console.log(`\n📊 Total Questions: ${totalResult.recordset[0].total}`);
    console.log('\n🎉 All test questions added successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart backend server (Ctrl+C then node server.js)');
    console.log('   2. Refresh browser (Ctrl+Shift+R)');
    console.log('   3. Go to Exam Management and view the exam');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

addTestQuestions();
