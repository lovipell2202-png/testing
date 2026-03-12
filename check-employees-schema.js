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

async function checkEmployeesTable() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database\n');

    // 1. Get table structure
    console.log('='.repeat(80));
    console.log('1. EMPLOYEES TABLE STRUCTURE');
    console.log('='.repeat(80));
    
    const schemaResult = await pool.request()
      .query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Employees'
        ORDER BY ORDINAL_POSITION
      `);
    
    console.log('\nColumns in Employees table:');
    schemaResult.recordset.forEach((col, index) => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`${index + 1}. ${col.COLUMN_NAME.padEnd(25)} | ${col.DATA_TYPE.padEnd(15)} | ${nullable}`);
    });

    // 2. Check for hire date related columns
    console.log('\n' + '='.repeat(80));
    console.log('2. HIRE DATE RELATED COLUMNS');
    console.log('='.repeat(80));
    
    const hireColumns = schemaResult.recordset.filter(col => 
      col.COLUMN_NAME.toLowerCase().includes('hire') || 
      col.COLUMN_NAME.toLowerCase().includes('date')
    );
    
    if (hireColumns.length > 0) {
      console.log('\nDate-related columns found:');
      hireColumns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
    } else {
      console.log('\nNo date-related columns found');
    }

    // 3. Get sample data
    console.log('\n' + '='.repeat(80));
    console.log('3. SAMPLE DATA FROM EMPLOYEES TABLE');
    console.log('='.repeat(80));
    
    const dataResult = await pool.request()
      .query(`
        SELECT TOP 5
          id,
          employee_no,
          first_name,
          last_name,
          full_name,
          department,
          position,
          date_hired,
          date_resign,
          date_of_birth,
          status,
          created_at
        FROM Employees
        ORDER BY id
      `);
    
    console.log(`\nTotal rows in Employees table: ${dataResult.recordset.length}`);
    console.log('\nSample data (first 5 records):');
    console.log(JSON.stringify(dataResult.recordset, null, 2));

    // 4. Check if date_hired has values
    console.log('\n' + '='.repeat(80));
    console.log('4. DATE_HIRED COLUMN ANALYSIS');
    console.log('='.repeat(80));
    
    const dateHiredAnalysis = await pool.request()
      .query(`
        SELECT 
          COUNT(*) as total_records,
          SUM(CASE WHEN date_hired IS NOT NULL THEN 1 ELSE 0 END) as records_with_date_hired,
          SUM(CASE WHEN date_hired IS NULL THEN 1 ELSE 0 END) as records_without_date_hired,
          MIN(date_hired) as earliest_hire_date,
          MAX(date_hired) as latest_hire_date
        FROM Employees
      `);
    
    const analysis = dateHiredAnalysis.recordset[0];
    console.log(`\nTotal records: ${analysis.total_records}`);
    console.log(`Records with date_hired: ${analysis.records_with_date_hired}`);
    console.log(`Records without date_hired: ${analysis.records_without_date_hired}`);
    console.log(`Earliest hire date: ${analysis.earliest_hire_date}`);
    console.log(`Latest hire date: ${analysis.latest_hire_date}`);

    // 5. Check all columns with their data types
    console.log('\n' + '='.repeat(80));
    console.log('5. COMPLETE COLUMN INFORMATION');
    console.log('='.repeat(80));
    
    console.log('\nAll columns with data types:');
    schemaResult.recordset.forEach((col) => {
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(20)} ${col.IS_NULLABLE}`);
    });

    await pool.close();
    console.log('\n✅ Database check completed successfully');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

checkEmployeesTable();
