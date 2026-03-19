/**
 * NSB Training Database Setup Script
 * 
 * This script automatically creates all database tables needed for the NSB Training application.
 * Run with: node database.js
 * 
 * Configuration:
 * - Edit dbConfig below to match your SQL Server credentials
 * - Or set environment variables: DB_USER, DB_PASSWORD, DB_SERVER, DB_PORT, DB_NAME
 */

const sql = require('mssql');

// Database configuration - modify these values to match your setup
const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'NSB_Training',
  options: {
    encrypt: process.env.NODE_ENV === 'production' ? true : false,
    trustServerCertificate: process.env.NODE_ENV === 'production' ? false : true,
    enableArithAbort: true,
    database: process.env.DB_NAME || 'NSB_Training'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function createDatabase(pool) {
  log('\n📦 Creating database if not exists...', 'yellow');
  
  try {
    // First connect to master to create database if needed
    const masterConfig = { ...dbConfig, database: 'master' };
    const masterPool = await sql.connect(masterConfig);
    
    await masterPool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbConfig.database}')
      BEGIN
        CREATE DATABASE ${dbConfig.database};
        PRINT 'Database ${dbConfig.database} created successfully';
      END
      ELSE
      BEGIN
        PRINT 'Database ${dbConfig.database} already exists';
      END
    `);
    
    await masterPool.close();
    log('✅ Database ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating database: ${err.message}`, 'red');
    return false;
  }
}

async function createEmployeesTable(pool) {
  log('\n📋 Creating Employees table...', 'yellow');
  
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employees')
    BEGIN
      CREATE TABLE Employees (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        employee_no NVARCHAR(50) UNIQUE,
        first_name NVARCHAR(100),
        last_name NVARCHAR(100),
        full_name NVARCHAR(255),
        department NVARCHAR(255),
        position NVARCHAR(255),
        date_hired DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      );
      
      CREATE INDEX idx_employees_employee_no ON Employees(employee_no);
      CREATE INDEX idx_employees_full_name ON Employees(full_name);
      CREATE INDEX idx_employees_department ON Employees(department);
      
      PRINT 'Employees table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'Employees table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ Employees table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating Employees table: ${err.message}`, 'red');
    return false;
  }
}

async function createCoursesTable(pool) {
  log('\n📚 Creating Courses table...', 'yellow');
  
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Courses')
    BEGIN
      CREATE TABLE Courses (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        course_title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        category NVARCHAR(255),
        duration_hours INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      );
      
      CREATE UNIQUE INDEX idx_courses_title ON Courses(course_title);
      CREATE INDEX idx_courses_category ON Courses(category);
      
      PRINT 'Courses table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'Courses table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ Courses table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating Courses table: ${err.message}`, 'red');
    return false;
  }
}

async function createTrainingRecordsTable(pool) {
  log('\n📝 Creating TrainingRecords table...', 'yellow');
  
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingRecords')
    BEGIN
      CREATE TABLE TrainingRecords (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        employee_id BIGINT NOT NULL,
        date_from DATETIME,
        date_to DATETIME,
        duration NVARCHAR(100),
        course_title NVARCHAR(255),
        training_provider NVARCHAR(255),
        venue NVARCHAR(255),
        trainer NVARCHAR(255),
        type_tb NVARCHAR(50),
        effectiveness_form NVARCHAR(50),
        exam_form_url NVARCHAR(500),
        eff_form_file NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (employee_id) REFERENCES Employees(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_training_employee ON TrainingRecords(employee_id);
      CREATE INDEX idx_training_course ON TrainingRecords(course_title);
      CREATE INDEX idx_training_date ON TrainingRecords(date_from);
      CREATE INDEX idx_training_trainer ON TrainingRecords(trainer);
      CREATE INDEX idx_training_venue ON TrainingRecords(venue);
      
      PRINT 'TrainingRecords table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'TrainingRecords table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ TrainingRecords table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating TrainingRecords table: ${err.message}`, 'red');
    return false;
  }
}

async function createExamQuestionsTable(pool) {
  log('\n❓ Creating ExamQuestions table...', 'yellow');
  
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExamQuestions')
    BEGIN
      CREATE TABLE ExamQuestions (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        course_id BIGINT NOT NULL,
        question_number INT,
        question_type NVARCHAR(50),
        question_text NVARCHAR(MAX),
        
        -- Multiple Choice options
        option_a NVARCHAR(MAX),
        option_b NVARCHAR(MAX),
        option_c NVARCHAR(MAX),
        option_d NVARCHAR(MAX),
        correct_answer NVARCHAR(10),
        
        -- Enumeration type
        enumeration_title NVARCHAR(MAX),
        enumeration_instruction NVARCHAR(MAX),
        enumeration_items NVARCHAR(MAX),
        enumeration_answer NVARCHAR(MAX),
        enumeration_items_json NVARCHAR(MAX),
        
        -- Procedure type
        procedure_title NVARCHAR(MAX),
        procedure_content NVARCHAR(MAX),
        procedure_instructions NVARCHAR(MAX),
        procedure_answer NVARCHAR(MAX),
        procedure_items_json NVARCHAR(MAX),
        
        -- Identification type
        identification_title NVARCHAR(200),
        identification_instruction NVARCHAR(MAX),
        identification_image_url NVARCHAR(MAX),
        identification_answer NVARCHAR(MAX),
        identification_items_json NVARCHAR(MAX),
        
        -- Common fields
        points INT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_examquestions_course_id ON ExamQuestions(course_id);
      CREATE INDEX idx_examquestions_type ON ExamQuestions(question_type);
      CREATE INDEX idx_examquestions_number ON ExamQuestions(question_number);
      
      PRINT 'ExamQuestions table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'ExamQuestions table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ ExamQuestions table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating ExamQuestions table: ${err.message}`, 'red');
    return false;
  }
}

async function createExamResultsTable(pool) {
  log('\n📊 Creating ExamResults table...', 'yellow');
  
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExamResults')
    BEGIN
      CREATE TABLE ExamResults (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        employee_id BIGINT NOT NULL,
        exam_id BIGINT NOT NULL,
        score INT,
        total_points INT,
        percentage DECIMAL(5,2),
        passed BIT,
        answers NVARCHAR(MAX),
        question_details NVARCHAR(MAX),
        employee_full_name NVARCHAR(255),
        course_title NVARCHAR(255),
        submitted_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (employee_id) REFERENCES Employees(id),
        FOREIGN KEY (exam_id) REFERENCES Courses(id)
      );
      
      CREATE INDEX idx_examresults_employee ON ExamResults(employee_id);
      CREATE INDEX idx_examresults_exam ON ExamResults(exam_id);
      CREATE INDEX idx_examresults_submitted ON ExamResults(submitted_at);
      CREATE INDEX idx_examresults_passed ON ExamResults(passed);
      
      PRINT 'ExamResults table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'ExamResults table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ ExamResults table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating ExamResults table: ${err.message}`, 'red');
    return false;
  }
}

async function createTrainingEvaluationFormsTable(pool) {
  log('\n📋 Creating TrainingEvaluationForms table...', 'yellow');
  
  const query = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingEvaluationForms')
    BEGIN
      CREATE TABLE TrainingEvaluationForms (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        employee_id BIGINT NOT NULL,
        training_id BIGINT NOT NULL,
        course_title NVARCHAR(255),
        resource_speaker NVARCHAR(255),
        participant_name NVARCHAR(255),
        training_date DATETIME,
        position NVARCHAR(255),
        venue NVARCHAR(255),
        
        -- Page 1: Program Contents (5 criteria)
        program_1_rating INT,
        program_2_rating INT,
        program_3_rating INT,
        program_4_rating INT,
        program_5_rating INT,
        
        -- Page 1: Trainer/Speaker (5 criteria)
        trainer_1_rating INT,
        trainer_2_rating INT,
        trainer_3_rating INT,
        trainer_4_rating INT,
        trainer_5_rating INT,
        
        -- Page 1: Transfer Quotient (5 criteria)
        transfer_1_rating INT,
        transfer_2_rating INT,
        transfer_3_rating INT,
        transfer_4_rating INT,
        transfer_5_rating INT,
        
        -- Page 1: Scores
        overall_score INT,
        total_average_score DECIMAL(5,2),
        page1_remarks_1 NVARCHAR(MAX),
        page1_remarks_2 NVARCHAR(MAX),
        overall_remarks NVARCHAR(MAX),
        
        -- Page 2: Applied Skills Before (5 criteria)
        applied_before_1_rating INT,
        applied_before_2_rating INT,
        applied_before_3_rating INT,
        applied_before_4_rating INT,
        applied_before_5_rating INT,
        applied_before_total INT,
        applied_before_avg DECIMAL(5,2),
        
        -- Page 2: Applied Skills After (5 criteria)
        applied_after_1_rating INT,
        applied_after_2_rating INT,
        applied_after_3_rating INT,
        applied_after_4_rating INT,
        applied_after_5_rating INT,
        applied_after_total INT,
        applied_after_avg DECIMAL(5,2),
        
        -- Page 2: Business Results (3 criteria)
        business_1_rating INT,
        business_1_feedback NVARCHAR(MAX),
        business_2_rating INT,
        business_2_feedback NVARCHAR(MAX),
        business_3_rating INT,
        business_3_feedback NVARCHAR(MAX),
        business_total INT,
        business_avg DECIMAL(5,2),
        
        -- Page 2: Remarks
        page2_remarks_1 NVARCHAR(MAX),
        page2_remarks_2 NVARCHAR(MAX),
        
        -- Signatures
        rated_by_name NVARCHAR(255),
        rated_by_date DATETIME,
        received_by_name NVARCHAR(255),
        received_by_date DATETIME,
        
        -- Metadata
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by NVARCHAR(255),
        updated_by NVARCHAR(255),
        
        FOREIGN KEY (employee_id) REFERENCES Employees(id),
        FOREIGN KEY (training_id) REFERENCES TrainingRecords(id)
      );
      
      CREATE INDEX idx_tef_employee ON TrainingEvaluationForms(employee_id);
      CREATE INDEX idx_tef_training ON TrainingEvaluationForms(training_id);
      CREATE INDEX idx_tef_created ON TrainingEvaluationForms(created_at);
      
      PRINT 'TrainingEvaluationForms table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'TrainingEvaluationForms table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ TrainingEvaluationForms table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating TrainingEvaluationForms table: ${err.message}`, 'red');
    return false;
  }
}

async function createUsersTable(pool) {
  log('\n🔐 Creating Users table...', 'yellow');
  
  const query = `
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
      
      PRINT 'Users table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'Users table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ Users table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating Users table: ${err.message}`, 'red');
    return false;
  }
}

async function createSessionsTable(pool) {
  log('\n🔑 Creating Sessions table...', 'yellow');
  
  const query = `
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
      CREATE INDEX idx_sessions_expires ON Sessions(expires_at);
      
      PRINT 'Sessions table created successfully';
    END
    ELSE
    BEGIN
      PRINT 'Sessions table already exists';
    END
  `;
  
  try {
    await pool.request().query(query);
    log('✅ Sessions table ready', 'green');
    return true;
  } catch (err) {
    log(`❌ Error creating Sessions table: ${err.message}`, 'red');
    return false;
  }
}

async function insertSampleData(pool) {
  log('\n📊 Inserting sample data...', 'yellow');
  
  try {
    // Check if sample employee already exists
    const existingEmp = await pool.request()
      .query("SELECT COUNT(*) as count FROM Employees WHERE employee_no = 'EMP001'");
    
    if (existingEmp.recordset[0].count === 0) {
      // Insert sample employee
      await pool.request().query(`
        INSERT INTO Employees (employee_no, first_name, last_name, full_name, department, position, date_hired)
        VALUES ('EMP001', 'John', 'Doe', 'John Doe', 'Engineering', 'Software Engineer', GETDATE())
      `);
      log('✅ Sample employee added', 'green');
    } else {
      log('✅ Sample employee already exists', 'green');
    }
    
    // Check if sample course already exists
    const existingCourse = await pool.request()
      .query("SELECT COUNT(*) as count FROM Courses WHERE course_title = 'Safety Training'");
    
    if (existingCourse.recordset[0].count === 0) {
      // Insert sample course
      await pool.request().query(`
        INSERT INTO Courses (course_title, description, category, duration_hours)
        VALUES ('Safety Training', 'Basic workplace safety training', 'Safety', 8)
      `);
      log('✅ Sample course added', 'green');
    } else {
      log('✅ Sample course already exists', 'green');
    }
    
    // Create default admin user if not exists
    const existingUser = await pool.request()
      .query("SELECT COUNT(*) as count FROM Users WHERE username = 'admin'");
    
    if (existingUser.recordset[0].count === 0) {
      // Get first employee ID
      const empResult = await pool.request()
        .query('SELECT TOP 1 id FROM Employees ORDER BY id');
      
      if (empResult.recordset.length > 0) {
        const employeeId = empResult.recordset[0].id;
        
        // Simple hash of 'admin123' - in production use bcrypt
        await pool.request().query(`
          INSERT INTO Users (employee_id, username, password_hash, role, is_active)
          VALUES (${employeeId}, 'admin', 'ADMIN123', 'admin', 1)
        `);
        log('✅ Default admin account created (username: admin, password: ADMIN123)', 'green');
      }
    } else {
      log('✅ Admin account already exists', 'green');
    }
    
    return true;
  } catch (err) {
    log(`⚠️  Sample data insertion note: ${err.message}`, 'yellow');
    return false;
  }
}

async function verifyTables(pool) {
  log('\n🔍 Verifying tables...', 'yellow');
  
  const tables = [
    'Employees',
    'Courses',
    'TrainingRecords',
    'ExamQuestions',
    'ExamResults',
    'TrainingEvaluationForms',
    'Users',
    'Sessions'
  ];
  
  let allExist = true;
  
  for (const table of tables) {
    try {
      const result = await pool.request()
        .query(`SELECT COUNT(*) as count FROM ${table}`);
      log(`✅ ${table} - OK`, 'green');
    } catch (err) {
      log(`❌ ${table} - FAILED: ${err.message}`, 'red');
      allExist = false;
    }
  }
  
  return allExist;
}

async function showDatabaseSummary(pool) {
  log('\n📊 Database Summary:', 'cyan');
  console.log('-'.repeat(50));
  
  const tables = [
    'Employees',
    'Courses',
    'TrainingRecords',
    'ExamQuestions',
    'ExamResults',
    'TrainingEvaluationForms',
    'Users',
    'Sessions'
  ];
  
  for (const table of tables) {
    try {
      const result = await pool.request()
        .query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.recordset[0].count;
      console.log(`  ${table.padEnd(25)}: ${count} rows`);
    } catch (err) {
      console.log(`  ${table.padEnd(25)}: ERROR`);
    }
  }
  
  console.log('-'.repeat(50));
}

async function main() {
  logSection('NSB Training Database Setup');
  
  log('\n📡 Connecting to SQL Server...', 'blue');
  log(`   Server: ${dbConfig.server}:${dbConfig.port}`, 'blue');
  log(`   Database: ${dbConfig.database}`, 'blue');
  log(`   User: ${dbConfig.user}`, 'blue');
  
  let pool;
  
  try {
    // Connect to database
    pool = await sql.connect(dbConfig);
    log('✅ Connected to SQL Server', 'green');
    
    // Create database
    await createDatabase(pool);
    
    // Reconnect with correct database
    await pool.close();
    pool = await sql.connect(dbConfig);
    
    // Create all tables
    logSection('Creating Tables');
    
    await createEmployeesTable(pool);
    await createCoursesTable(pool);
    await createTrainingRecordsTable(pool);
    await createExamQuestionsTable(pool);
    await createExamResultsTable(pool);
    await createTrainingEvaluationFormsTable(pool);
    await createUsersTable(pool);
    await createSessionsTable(pool);
    
    // Insert sample data
    await insertSampleData(pool);
    
    // Verify tables
    logSection('Verification');
    const verified = await verifyTables(pool);
    
    if (verified) {
      await showDatabaseSummary(pool);
      
      logSection('✅ Setup Complete!');
      log('\n🎉 Database has been successfully created!', 'green');
      log('\n📝 Next Steps:', 'cyan');
      log('   1. Start the server: node server.js', 'blue');
      log('   2. Open browser: http://localhost:3000', 'blue');
      log('   3. Login with:', 'blue');
      log('      - Username: admin', 'blue');
      log('      - Password: ADMIN123', 'blue');
      log('\n⚠️  IMPORTANT: Change the default admin password in production!', 'yellow');
    } else {
      log('\n❌ Some tables could not be verified. Please check errors above.', 'red');
      process.exit(1);
    }
    
  } catch (err) {
    log(`\n❌ Fatal Error: ${err.message}`, 'red');
    log('\n📋 Troubleshooting:', 'yellow');
    log('   1. Verify SQL Server is running', 'blue');
    log('   2. Check username and password in database.js', 'blue');
    log('   3. Check server address and port', 'blue');
    log('   4. Ensure SQL Server allows TCP/IP connections', 'blue');
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run the setup
main();
