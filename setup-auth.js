const sql = require('mssql');
const crypto = require('crypto');

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

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function setupAuth() {
  let pool;
  try {
    console.log('🔄 Connecting to NSB_Training database...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to NSB_Training database\n');

    // Create Users table
    console.log('🔄 Creating Users table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
          CREATE TABLE Users (
              id BIGINT PRIMARY KEY IDENTITY(1,1),
              employee_id BIGINT NOT NULL,
              username NVARCHAR(100) UNIQUE NOT NULL,
              password_hash NVARCHAR(255) NOT NULL,
              role NVARCHAR(50) NOT NULL DEFAULT 'employee',
              is_active BIT DEFAULT 1,
              created_at DATETIME DEFAULT GETDATE(),
              updated_at DATETIME DEFAULT GETDATE(),
              FOREIGN KEY (employee_id) REFERENCES Employees(id)
          );
          CREATE INDEX idx_users_username ON Users(username);
          CREATE INDEX idx_users_employee_id ON Users(employee_id);
          CREATE INDEX idx_users_role ON Users(role);
      END
    `);
    console.log('✅ Users table ready');

    // Create Sessions table
    console.log('🔄 Creating Sessions table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions')
      BEGIN
          CREATE TABLE Sessions (
              id BIGINT PRIMARY KEY IDENTITY(1,1),
              user_id BIGINT NOT NULL,
              session_token NVARCHAR(255) UNIQUE NOT NULL,
              ip_address NVARCHAR(50),
              user_agent NVARCHAR(500),
              created_at DATETIME DEFAULT GETDATE(),
              expires_at DATETIME,
              FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
          );
          CREATE INDEX idx_sessions_user_id ON Sessions(user_id);
          CREATE INDEX idx_sessions_token ON Sessions(session_token);
          CREATE INDEX idx_sessions_expires_at ON Sessions(expires_at);
      END
    `);
    console.log('✅ Sessions table ready');

    // Get first employee for admin account
    console.log('🔄 Setting up admin account...');
    const empResult = await pool.request()
      .query('SELECT TOP 1 id, employee_no, full_name FROM Employees ORDER BY id');
    
    if (empResult.recordset.length === 0) {
      console.error('❌ No employees found in database');
      process.exit(1);
    }

    const firstEmployee = empResult.recordset[0];
    const adminPasswordHash = hashPassword('ADMIN123');
    
    // Check if admin already exists
    const adminExists = await pool.request()
      .query('SELECT id FROM Users WHERE username = \'admin\'');
    
    if (adminExists.recordset.length === 0) {
      await pool.request()
        .input('employee_id', sql.BigInt, firstEmployee.id)
        .input('username', sql.NVarChar, 'admin')
        .input('password_hash', sql.NVarChar, adminPasswordHash)
        .input('role', sql.NVarChar, 'admin')
        .query(`
          INSERT INTO Users (employee_id, username, password_hash, role, is_active)
          VALUES (@employee_id, @username, @password_hash, @role, 1)
        `);
      console.log(`✅ Admin account created for Employee #${firstEmployee.employee_no} (${firstEmployee.full_name})`);
    } else {
      console.log('✅ Admin account already exists');
    }

    console.log('\n✅ Authentication setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Users table created');
    console.log('   - Sessions table created');
    console.log(`   - Admin account configured for Employee #${firstEmployee.employee_no}`);
    console.log('\n🔐 Test Credentials:');
    console.log('   - Username: admin');
    console.log('   - Password: ADMIN123');
    console.log('   - Role: admin');
    console.log(`   - Employee: ${firstEmployee.full_name}`);

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

setupAuth();
