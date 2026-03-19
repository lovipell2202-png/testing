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

async function checkCourses() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database\n');

    // Get courses
    console.log('=== COURSES ===');
    const result = await pool.request()
      .query('SELECT id, course_title, description FROM Courses ORDER BY course_title');
    
    console.log('Count:', result.recordset.length);
    result.recordset.forEach(r => {
      console.log(`ID: ${r.id}, Title: ${r.course_title}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

checkCourses();
