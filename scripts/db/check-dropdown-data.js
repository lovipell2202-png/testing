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

async function checkData() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database\n');

    // Get unique employee names
    console.log('=== EMPLOYEE NAMES ===');
    const namesResult = await pool.request()
      .query(`SELECT DISTINCT full_name FROM Employees WHERE full_name IS NOT NULL ORDER BY full_name`);
    console.log('Count:', namesResult.recordset.length);
    namesResult.recordset.forEach(r => console.log('-', r.full_name));

    // Get unique positions
    console.log('\n=== POSITIONS ===');
    const positionsResult = await pool.request()
      .query(`SELECT DISTINCT position FROM Employees WHERE position IS NOT NULL ORDER BY position`);
    console.log('Count:', positionsResult.recordset.length);
    positionsResult.recordset.forEach(r => console.log('-', r.position));

    // Get unique venues
    console.log('\n=== VENUES ===');
    const venuesResult = await pool.request()
      .query(`SELECT DISTINCT venue FROM TrainingRecords WHERE venue IS NOT NULL AND venue != '' ORDER BY venue`);
    console.log('Count:', venuesResult.recordset.length);
    venuesResult.recordset.forEach(r => console.log('-', r.venue));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

checkData();
