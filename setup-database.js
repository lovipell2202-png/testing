const sql = require('mssql');
const fs = require('fs');
const path = require('path');
// Database configuration
const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',  // Change this to your SQL Server password
  server: 'localhost',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function setupDatabase() {
  let pool;
  try {
    console.log('🔄 Connecting to SQL Server...');
    
    // Connect without database first to create it
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    pool = await sql.connect(tempConfig);
    console.log('✅ Connected to SQL Server');

    // Read the setup script
    const setupScript = fs.readFileSync(path.join(__dirname, 'database-setup.sql'), 'utf8');
    
    // Split by GO statements and execute each batch
    const batches = setupScript.split(/\nGO\n/i).filter(batch => batch.trim());
    
    console.log(`🔄 Running ${batches.length} SQL batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch.length === 0) continue;
      
      try {
        await pool.request().batch(batch);
        console.log(`✅ Batch ${i + 1}/${batches.length} completed`);
      } catch (err) {
        console.error(`❌ Batch ${i + 1} failed:`, err.message);
        // Continue with next batch
      }
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📊 Database Summary:');
    
    // Connect to the new database to verify
    const verifyPool = await sql.connect(dbConfig);
    
    const empCount = await verifyPool.request().query('SELECT COUNT(*) as count FROM Employees');
    const trainCount = await verifyPool.request().query('SELECT COUNT(*) as count FROM TrainingRecords');
    
    console.log(`   - Employees: ${empCount.recordset[0].count}`);
    console.log(`   - Training Records: ${trainCount.recordset[0].count}`);
    
    const employees = await verifyPool.request().query('SELECT id, employee_no, employee_name FROM Employees ORDER BY id');
    console.log('\n👥 Employees:');
    employees.recordset.forEach(emp => {
      console.log(`   - ${emp.employee_no}: ${emp.employee_name}`);
    });
    
    await verifyPool.close();
    
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    console.error('\n⚠️  Troubleshooting:');
    console.error('1. Make sure SQL Server is running');
    console.error('2. Check your username and password in setup-database.js');
    console.error('3. Verify the server name (localhost or your server name)');
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run setup
setupDatabase();
