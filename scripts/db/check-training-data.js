const sql = require('mssql');

const config = {
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
    pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Check Employees
    console.log('📋 EMPLOYEES:');
    const employees = await pool.request().query('SELECT TOP 5 id, full_name, position FROM Employees');
    console.log(employees.recordset);

    // Check TrainingRecords
    console.log('\n📋 TRAINING RECORDS:');
    const trainings = await pool.request().query('SELECT TOP 10 id, employee_id, course_title, date_from FROM TrainingRecords');
    console.log(trainings.recordset);

    // Check if there are trainings for employee 1
    console.log('\n📋 TRAININGS FOR EMPLOYEE ID 1:');
    const emp1Trainings = await pool.request()
      .input('employee_id', sql.BigInt, 1)
      .query('SELECT DISTINCT course_title FROM TrainingRecords WHERE employee_id = @employee_id');
    console.log(emp1Trainings.recordset);

    // Check total counts
    console.log('\n📊 TOTALS:');
    const empCount = await pool.request().query('SELECT COUNT(*) as count FROM Employees');
    const trainingCount = await pool.request().query('SELECT COUNT(*) as count FROM TrainingRecords');
    console.log(`Employees: ${empCount.recordset[0].count}`);
    console.log(`Training Records: ${trainingCount.recordset[0].count}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkData();
