#!/usr/bin/env node

const sql = require('mssql');

// Database configuration
const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',
  server: 'localhost',
  port: 1433,
  database: 'NSB_Training',
  options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

// All 47 course titles
const courses = [
  "5S FOD EXAMINATION SET A",
  "7 QC Tools Exam A",
  "AS9100 Orientaton Examination Set A",
  "Benchworking_Exam",
  "Business Process Map Examination",
  "CNC EDM Examination_Final",
  "CNC Lathe Exam_Final",
  "CNC MILLING Exam SET A",
  "company intro exam",
  "Coordinate Measuring Machine (CMM) Exam A",
  "COUNTERFEIT PARTS EXAMINATION SET A",
  "Cybersecurity Awareness Exam Rev. 1",
  "Cybersecurity Awareness Module 2 (Examination)",
  "Dimensional Metrology Training Exam Rev. 1",
  "Document Control and Management Training Exam",
  "Drawing Interpretation Examination SET A",
  "emergency preparedness exam (SET B)",
  "F-HRD62_1 Training Examination - Cutting Machine Exam Rev.O",
  "FAIR Pratical Exam-Final",
  "FAIR Written Exam_Final",
  "Faro Arm (FA) Exam A",
  "Grinding Exam_Final",
  "IA Exam",
  "INSPECTION STANDARD CRITERIA AIRBUS",
  "M2831 EXAM CONFIDENTIAL SET A",
  "Laser Marking Machine Examination Rev. O",
  "MANUAL LATHE Examination_Final",
  "MANUAL MILLING Examination_Final",
  "Material Identification Exam",
  "Preventive & Corrective Maintenance Exam Set A",
  "PRODUCT SAFETY EXAMINATION SET A",
  "Profile Projector User Training Exam A",
  "QCQA Procedure Traning Exam (1)",
  "Quick Vision (QV) Exam A.doc",
  "Safety training exam (SET C)",
  "Sharpening Machine (Endmill) Rev. O",
  "SHEET METAL FABRICATION POLISHING SET A",
  "Technical Specification Exam Rev. 1",
  "TRE-23-005_0 INCOMING INSPECTION INSTRUCTION-VERIFICATION OF MILL TEST",
  "TRE-23-006_0 Outgoing Inspection Instruction Training Exam",
  "TRE-23-007_0 IN-PROCESS INSPECTION INSTRUCTION",
  "TRE-23-008_0 Packaging Requirements for Aerospace Parts Training Exam",
  "TRE-23-009_0 INSPECTION DISPOSITION AND CONTROL OF NON-CONFORMING PRODUCTS",
  "TRE-23-011_0 Final Inspection Instruction Training Exam",
  "Vanta XRF Exam A",
  "Waste management exam (SET A)",
  "Wire Cut Examination_Final"
];

async function insertCourses() {
  let pool;
  try {
    // Connect to database
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to NSB_Training database');

    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Insert each course
    for (const course of courses) {
      try {
        // Check if course already exists
        const checkResult = await pool.request()
          .input('course_title', sql.VarChar(200), course)
          .query('SELECT id FROM CourseExamForms WHERE course_title = @course_title');

        if (checkResult.recordset.length > 0) {
          console.log(`⏭️  Skipped (already exists): ${course}`);
          skippedCount++;
          continue;
        }

        // Insert course
        await pool.request()
          .input('course_title', sql.VarChar(200), course)
          .input('has_exam', sql.Bit, 1)
          .input('has_teef', sql.Bit, 0)
          .query('INSERT INTO CourseExamForms (course_title, has_exam, has_teef) VALUES (@course_title, @has_exam, @has_teef)');

        console.log(`✅ Inserted: ${course}`);
        insertedCount++;
      } catch (err) {
        console.error(`❌ Error inserting ${course}:`, err.message);
        errorCount++;
      }
    }

    // Get total count
    const totalResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM CourseExamForms');
    const totalCourses = totalResult.recordset[0].total;

    console.log(`\n📊 Summary:`);
    console.log(`✅ Inserted: ${insertedCount} courses`);
    console.log(`⏭️  Skipped: ${skippedCount} courses (already exist)`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Total courses in database: ${totalCourses}`);

    // List all courses
    console.log(`\n📋 All courses in database:`);
    const allCourses = await pool.request()
      .query('SELECT course_title FROM CourseExamForms ORDER BY course_title');
    
    allCourses.recordset.forEach((row, index) => {
      console.log(`${index + 1}. ${row.course_title}`);
    });

  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the script
insertCourses();
