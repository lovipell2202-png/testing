const express = require('express');
const cors = require('cors');
const path = require('path');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Configuration
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

let pool;

// Initialize database connection
async function initializeDatabase() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to MS SQL Server database');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

// GET all employees
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT id, employee_no, first_name, last_name, full_name, department, position, contact_no, email_address, date_hired, date_of_birth, status FROM Employees ORDER BY id');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error fetching employees:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching employees' });
  }
});

// GET employee by ID with training records
app.get('/api/employees/:id', async (req, res) => {
  try {
    const empResult = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT id, employee_no, first_name, last_name, full_name, department, position, contact_no, email_address, date_hired, date_of_birth, status FROM Employees WHERE id = @id');
    
    if (empResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const emp = empResult.recordset[0];
    const trainResult = await pool.request()
      .input('employee_id', sql.BigInt, emp.id)
      .query('SELECT id, employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form FROM TrainingRecords WHERE employee_id = @employee_id ORDER BY date_from DESC');
    
    res.json({ success: true, employee: emp, trainings: trainResult.recordset });
  } catch (err) {
    console.error('Error fetching employee:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching employee' });
  }
});

// GET employee by employee_no
app.get('/api/employees/search/:employee_no', async (req, res) => {
  try {
    const empResult = await pool.request()
      .input('employee_no', sql.VarChar, req.params.employee_no)
      .query('SELECT id, employee_no, first_name, last_name, full_name, department, position, contact_no, email_address, date_hired, date_of_birth, status FROM Employees WHERE employee_no = @employee_no');
    
    if (empResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const emp = empResult.recordset[0];
    const trainResult = await pool.request()
      .input('employee_id', sql.BigInt, emp.id)
      .query('SELECT id, employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form FROM TrainingRecords WHERE employee_id = @employee_id ORDER BY date_from DESC');
    
    res.json({ success: true, employee: emp, trainings: trainResult.recordset });
  } catch (err) {
    console.error('Error searching employee:', err.message);
    res.status(500).json({ success: false, message: 'Error searching employee' });
  }
});

// POST create employee
app.post('/api/employees', async (req, res) => {
  try {
    const { first_name, last_name, full_name, department, position, contact_no, email_address, date_hired, date_of_birth, status } = req.body;
    
    if (!first_name || !last_name || !full_name || !department || !position || !date_hired) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const result = await pool.request()
      .input('first_name', sql.VarChar, first_name)
      .input('last_name', sql.VarChar, last_name)
      .input('full_name', sql.VarChar, full_name)
      .input('department', sql.VarChar, department)
      .input('position', sql.VarChar, position)
      .input('contact_no', sql.VarChar, contact_no || null)
      .input('email_address', sql.VarChar, email_address || null)
      .input('date_hired', sql.DateTime, date_hired)
      .input('date_of_birth', sql.DateTime, date_of_birth || null)
      .input('status', sql.Char, status || '1')
      .query(`INSERT INTO Employees (first_name, last_name, full_name, department, position, contact_no, email_address, date_hired, date_of_birth, status) 
              VALUES (@first_name, @last_name, @full_name, @department, @position, @contact_no, @email_address, @date_hired, @date_of_birth, @status);
              SELECT SCOPE_IDENTITY() as id`);
    
    res.status(201).json({ success: true, id: result.recordset[0].id });
  } catch (err) {
    console.error('Error creating employee:', err.message);
    res.status(500).json({ success: false, message: 'Error creating employee' });
  }
});

// PUT update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { first_name, last_name, full_name, department, position, contact_no, email_address, date_hired, date_of_birth, status } = req.body;
    
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('first_name', sql.VarChar, first_name)
      .input('last_name', sql.VarChar, last_name)
      .input('full_name', sql.VarChar, full_name)
      .input('department', sql.VarChar, department)
      .input('position', sql.VarChar, position)
      .input('contact_no', sql.VarChar, contact_no || null)
      .input('email_address', sql.VarChar, email_address || null)
      .input('date_hired', sql.DateTime, date_hired)
      .input('date_of_birth', sql.DateTime, date_of_birth || null)
      .input('status', sql.Char, status || '1')
      .query(`UPDATE Employees SET first_name = @first_name, last_name = @last_name, full_name = @full_name, 
              department = @department, position = @position, contact_no = @contact_no, email_address = @email_address,
              date_hired = @date_hired, date_of_birth = @date_of_birth, status = @status WHERE id = @id`);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating employee:', err.message);
    res.status(500).json({ success: false, message: 'Error updating employee' });
  }
});

// DELETE employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('DELETE FROM Employees WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting employee:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting employee' });
  }
});

// POST add training record
app.post('/api/trainings', async (req, res) => {
  try {
    const { employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form } = req.body;
    
    if (!employee_id || !date_from || !date_to || !duration || !course_title || !training_provider || !venue || !trainer || !type_tb) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const result = await pool.request()
      .input('employee_id', sql.BigInt, employee_id)
      .input('date_from', sql.Date, date_from)
      .input('date_to', sql.Date, date_to)
      .input('duration', sql.VarChar, duration)
      .input('course_title', sql.VarChar, course_title)
      .input('training_provider', sql.VarChar, training_provider)
      .input('venue', sql.VarChar, venue)
      .input('trainer', sql.VarChar, trainer)
      .input('type_tb', sql.Char, type_tb)
      .input('effectiveness_form', sql.VarChar, effectiveness_form || 'N/A')
      .query(`INSERT INTO TrainingRecords (employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form)
              VALUES (@employee_id, @date_from, @date_to, @duration, @course_title, @training_provider, @venue, @trainer, @type_tb, @effectiveness_form);
              SELECT SCOPE_IDENTITY() as id`);
    
    res.status(201).json({ success: true, id: result.recordset[0].id });
  } catch (err) {
    console.error('Error creating training record:', err.message);
    res.status(500).json({ success: false, message: 'Error creating training record' });
  }
});

// PUT update training record
app.put('/api/trainings/:id', async (req, res) => {
  try {
    const { date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form } = req.body;
    
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('date_from', sql.Date, date_from)
      .input('date_to', sql.Date, date_to)
      .input('duration', sql.VarChar, duration)
      .input('course_title', sql.VarChar, course_title)
      .input('training_provider', sql.VarChar, training_provider)
      .input('venue', sql.VarChar, venue)
      .input('trainer', sql.VarChar, trainer)
      .input('type_tb', sql.Char, type_tb)
      .input('effectiveness_form', sql.VarChar, effectiveness_form || 'N/A')
      .query(`UPDATE TrainingRecords SET date_from = @date_from, date_to = @date_to, duration = @duration,
              course_title = @course_title, training_provider = @training_provider, venue = @venue,
              trainer = @trainer, type_tb = @type_tb, effectiveness_form = @effectiveness_form WHERE id = @id`);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Training record not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating training record:', err.message);
    res.status(500).json({ success: false, message: 'Error updating training record' });
  }
});

// DELETE training record
app.delete('/api/trainings/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('DELETE FROM TrainingRecords WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Training record not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting training record:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting training record' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3001;

async function startServer() {
  const connected = await initializeDatabase();
  if (!connected) {
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Database: NSB_Training`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});
