#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of all course titles
const courses = [
  "5S FOD EXAMINATION SET A",
  "7 QC Tools Exam A",
  "Benchworking_Exam",
  "AS9100 Orientaton Examination Set A",
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

// Function to convert course title to slug
function courseToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Function to generate HTML filename
function courseToFilename(title) {
  const slug = courseToSlug(title);
  return `${slug}.html`;
}

// Read template
const templatePath = path.join(__dirname, 'public', 'exams', 'course-exam-template.html');
let template = fs.readFileSync(templatePath, 'utf8');

// Create exams directory if it doesn't exist
const examsDir = path.join(__dirname, 'public', 'exams');
if (!fs.existsSync(examsDir)) {
  fs.mkdirSync(examsDir, { recursive: true });
}

// Generate HTML files for each course
let generatedCount = 0;
let errorCount = 0;

courses.forEach(course => {
  try {
    const slug = courseToSlug(course);
    const filename = courseToFilename(course);
    const filepath = path.join(examsDir, filename);

    // Replace placeholders
    let html = template
      .replace(/{{COURSE_TITLE}}/g, course)
      .replace(/{{COURSE_SLUG}}/g, slug);

    // Write file
    fs.writeFileSync(filepath, html, 'utf8');
    console.log(`✅ Generated: ${filename}`);
    generatedCount++;
  } catch (err) {
    console.error(`❌ Error generating ${course}:`, err.message);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Generated: ${generatedCount} files`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📁 Location: public/exams/`);

// Generate index file
const indexPath = path.join(examsDir, 'index.html');
let indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Course Exams - NSB Engineering</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="../css/styles.css"/>
  <style>
    .exam-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .exam-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s;
    }
    .exam-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .exam-card h3 {
      margin: 0 0 10px 0;
      color: var(--navy);
    }
  </style>
</head>
<body>
  <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">
    <h1>Available Course Exams</h1>
    <p>Select a course to take the exam:</p>
    <div class="exam-list">
`;

courses.forEach(course => {
  const filename = courseToFilename(course);
  indexHtml += `
      <a href="${filename}" class="exam-card">
        <h3>${course}</h3>
        <p>Click to take this exam</p>
      </a>
  `;
});

indexHtml += `
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log(`✅ Generated: index.html`);
