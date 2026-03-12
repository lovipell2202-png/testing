const express = require('express');
const cors = require('cors');
const path = require('path');
const sql = require('mssql');
const multer = require('multer');
const fs = require('fs');
const examServer = require('./exam-server');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Setup multer for file uploads
const uploadDir = path.join(__dirname, 'public', 'uploads', 'tests');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}${ext}`);
  }
});

const upload = multer({ storage });

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

async function initializeDatabase() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database');
    examServer.setPool(pool);
    return true;
  } catch (err) {
    console.error('❌ Database error:', err.message);
    return false;
  }
}

app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT id, course_title, description, created_at FROM Courses ORDER BY course_title');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload test file endpoint
app.post('/api/tests/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { employee_id, course_title, document_type } = req.body;
    
    if (!employee_id || !course_title || !document_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Save file path to database
    const fileUrl = `/uploads/tests/${req.file.filename}`;
    
    console.log('Uploading file for:', { employee_id, course_title, document_type, fileUrl });
    
    // Update the training record with the file
    const result = await pool.request()
      .input('employee_id', sql.BigInt, parseInt(employee_id))
      .input('course_title', sql.VarChar, course_title)
      .input('eff_form_file', sql.VarChar, fileUrl)
      .input('effectiveness_form', sql.VarChar, document_type)
      .query(`
        UPDATE TrainingRecords 
        SET eff_form_file = @eff_form_file, effectiveness_form = @effectiveness_form
        WHERE employee_id = @employee_id AND course_title = @course_title
      `);

    console.log('Update result:', result.rowsAffected);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Training record not found for this employee and course' });
    }

    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      file_url: fileUrl,
      file_name: req.file.originalname,
      rows_updated: result.rowsAffected[0]
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/exams', examServer.getExams);
app.get('/api/exams/:id', examServer.getExamById);
app.post('/api/exams', examServer.createExam);
app.put('/api/exams/:id', examServer.updateExam);
app.delete('/api/exams/:id', examServer.deleteExam);

app.post('/api/exam-results', examServer.saveExamResult);
app.get('/api/exam-results/employee/:employee_id', examServer.getEmployeeExamResults);

app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT id, employee_no, first_name, last_name, full_name, department, position, date_hired FROM Employees ORDER BY id');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/trainings', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`SELECT 
        tr.id, 
        tr.employee_id, 
        tr.date_from, 
        tr.date_to, 
        tr.duration, 
        tr.course_title, 
        tr.training_provider, 
        tr.venue, 
        tr.trainer, 
        tr.type_tb,
        tr.effectiveness_form,
        tr.eff_form_file,
        e.full_name 
      FROM TrainingRecords tr
      LEFT JOIN Employees e ON tr.employee_id = e.id
      ORDER BY tr.date_from DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get training records by employee and course
app.get('/api/trainings/employee/:employee_id/course/:course_title', async (req, res) => {
  try {
    const result = await pool.request()
      .input('employee_id', sql.BigInt, req.params.employee_id)
      .input('course_title', sql.VarChar, req.params.course_title)
      .query(`SELECT * FROM TrainingRecords 
              WHERE employee_id = @employee_id AND course_title = @course_title`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single training record by ID
app.get('/api/trainings/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`SELECT 
        tr.id, 
        tr.employee_id, 
        tr.date_from, 
        tr.date_to, 
        tr.duration, 
        tr.course_title, 
        tr.training_provider, 
        tr.venue, 
        tr.trainer, 
        tr.type_tb,
        tr.effectiveness_form,
        tr.eff_form_file,
        e.full_name 
      FROM TrainingRecords tr
      LEFT JOIN Employees e ON tr.employee_id = e.id
      WHERE tr.id = @id`);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Training record not found' });
    }
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new training record
app.post('/api/trainings', async (req, res) => {
  try {
    const { employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form, eff_form_file } = req.body;
    
    const result = await pool.request()
      .input('employee_id', sql.BigInt, employee_id)
      .input('date_from', sql.DateTime, date_from)
      .input('date_to', sql.DateTime, date_to)
      .input('duration', sql.VarChar, duration)
      .input('course_title', sql.VarChar, course_title)
      .input('training_provider', sql.VarChar, training_provider)
      .input('venue', sql.VarChar, venue)
      .input('trainer', sql.VarChar, trainer)
      .input('type_tb', sql.VarChar, type_tb)
      .input('effectiveness_form', sql.VarChar, effectiveness_form)
      .input('eff_form_file', sql.VarChar, eff_form_file)
      .query(`INSERT INTO TrainingRecords (employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form, eff_form_file)
              VALUES (@employee_id, @date_from, @date_to, @duration, @course_title, @training_provider, @venue, @trainer, @type_tb, @effectiveness_form, @eff_form_file);
              SELECT SCOPE_IDENTITY() as id;`);
    
    res.json({ success: true, id: result.recordset[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update training record
app.put('/api/trainings/:id', async (req, res) => {
  try {
    const { employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form, eff_form_file } = req.body;
    
    await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('employee_id', sql.BigInt, employee_id)
      .input('date_from', sql.DateTime, date_from)
      .input('date_to', sql.DateTime, date_to)
      .input('duration', sql.VarChar, duration)
      .input('course_title', sql.VarChar, course_title)
      .input('training_provider', sql.VarChar, training_provider)
      .input('venue', sql.VarChar, venue)
      .input('trainer', sql.VarChar, trainer)
      .input('type_tb', sql.VarChar, type_tb)
      .input('effectiveness_form', sql.VarChar, effectiveness_form)
      .input('eff_form_file', sql.VarChar, eff_form_file)
      .query(`UPDATE TrainingRecords 
              SET employee_id = @employee_id, date_from = @date_from, date_to = @date_to, duration = @duration,
                  course_title = @course_title, training_provider = @training_provider, venue = @venue,
                  trainer = @trainer, type_tb = @type_tb, effectiveness_form = @effectiveness_form, eff_form_file = @eff_form_file
              WHERE id = @id`);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete training record
app.delete('/api/trainings/:id', async (req, res) => {
  try {
    await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('DELETE FROM TrainingRecords WHERE id = @id');
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  const connected = await initializeDatabase();
  if (!connected) {
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Database: NSB_Training`);
  });
}

startServer();

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});


// Remove test file endpoint
app.post('/api/tests/remove', async (req, res) => {
  try {
    const { employee_id, course_title } = req.body;
    
    if (!employee_id || !course_title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Remove the file from the training record
    const result = await pool.request()
      .input('employee_id', sql.BigInt, employee_id)
      .input('course_title', sql.VarChar, course_title)
      .query(`
        UPDATE TrainingRecords 
        SET eff_form_file = NULL, effectiveness_form = 'N/A'
        WHERE employee_id = @employee_id AND course_title = @course_title
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Training record not found' });
    }

    res.json({ 
      success: true, 
      message: 'Attachment removed successfully'
    });
  } catch (err) {
    console.error('Remove error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
