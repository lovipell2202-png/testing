#!/usr/bin/env node

const sql = require('mssql');

const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',
  server: 'localhost',
  port: 1433,
  database: 'NSB_Training',
  options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

async function addCuttingMachine() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to NSB_Training database');

    // Check if CUTTING MACHINE already exists
    const checkResult = await pool.request()
      .input('course_title', sql.VarChar(200), 'CUTTING MACHINE')
      .query('SELECT id FROM CourseExamForms WHERE course_title = @course_title');

    if (checkResult.recordset.length > 0) {
      console.log('⏭️  CUTTING MACHINE already exists in database');
    } else {
      // Insert CUTTING MACHINE
      await pool.request()
        .input('course_title', sql.VarChar(200), 'CUTTING MACHINE')
        .input('has_exam', sql.Bit, 1)
        .input('has_teef', sql.Bit, 0)
        .query('INSERT INTO CourseExamForms (course_title, has_exam, has_teef) VALUES (@course_title, @has_exam, @has_teef)');

      console.log('✅ CUTTING MACHINE inserted into database');
    }

    // Get total count
    const totalResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM CourseExamForms');
    const totalCourses = totalResult.recordset[0].total;

    console.log(`📁 Total courses in database: ${totalCourses}`);

    // Verify CUTTING MACHINE exists
    const verifyResult = await pool.request()
      .input('course_title', sql.VarChar(200), 'CUTTING MACHINE')
      .query('SELECT * FROM CourseExamForms WHERE course_title = @course_title');

    if (verifyResult.recordset.length > 0) {
      console.log('\n✅ CUTTING MACHINE verified in database:');
      console.log(`   Course Title: ${verifyResult.recordset[0].course_title}`);
      console.log(`   Has Exam: ${verifyResult.recordset[0].has_exam}`);
      console.log(`   Has TEEF: ${verifyResult.recordset[0].has_teef}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✅ Database connection closed');
    }
  }
}

addCuttingMachine();
