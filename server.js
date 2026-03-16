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
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  port: process.env.DB_PORT || 1433,
  database: process.env.DB_NAME || 'NSB_Training',
  options: {
    encrypt: process.env.NODE_ENV === 'production' ? true : false,
    trustServerCertificate: process.env.NODE_ENV === 'production' ? false : true,
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

// Training Evaluation Form Endpoints

// Save evaluation form
app.post('/api/evaluation-forms', async (req, res) => {
  try {
    const {
      training_id,
      employee_id,
      course_title,
      resource_speaker,
      participant_name,
      training_date,
      position,
      venue,
      program_ratings,
      trainer_ratings,
      transfer_ratings,
      overall_score,
      total_average_score,
      page1_remarks_1,
      page1_remarks_2,
      overall_remarks,
      applied_before_ratings,
      applied_after_ratings,
      applied_before_total,
      applied_before_avg,
      applied_after_total,
      applied_after_avg,
      business_ratings,
      business_feedbacks,
      business_total,
      business_avg,
      page2_remarks_1,
      page2_remarks_2
    } = req.body;

    const result = await pool.request()
      .input('training_id', sql.BigInt, training_id)
      .input('employee_id', sql.BigInt, employee_id)
      .input('course_title', sql.VarChar, course_title)
      .input('resource_speaker', sql.VarChar, resource_speaker)
      .input('participant_name', sql.VarChar, participant_name)
      .input('training_date', sql.DateTime, training_date ? new Date(training_date) : null)
      .input('position', sql.VarChar, position)
      .input('venue', sql.VarChar, venue)
      .input('program_1_rating', sql.Int, program_ratings[0] || null)
      .input('program_2_rating', sql.Int, program_ratings[1] || null)
      .input('program_3_rating', sql.Int, program_ratings[2] || null)
      .input('program_4_rating', sql.Int, program_ratings[3] || null)
      .input('program_5_rating', sql.Int, program_ratings[4] || null)
      .input('trainer_1_rating', sql.Int, trainer_ratings[0] || null)
      .input('trainer_2_rating', sql.Int, trainer_ratings[1] || null)
      .input('trainer_3_rating', sql.Int, trainer_ratings[2] || null)
      .input('trainer_4_rating', sql.Int, trainer_ratings[3] || null)
      .input('trainer_5_rating', sql.Int, trainer_ratings[4] || null)
      .input('transfer_1_rating', sql.Int, transfer_ratings[0] || null)
      .input('transfer_2_rating', sql.Int, transfer_ratings[1] || null)
      .input('transfer_3_rating', sql.Int, transfer_ratings[2] || null)
      .input('transfer_4_rating', sql.Int, transfer_ratings[3] || null)
      .input('transfer_5_rating', sql.Int, transfer_ratings[4] || null)
      .input('overall_score', sql.Int, overall_score || null)
      .input('total_average_score', sql.Decimal(5, 2), total_average_score || null)
      .input('page1_remarks_1', sql.NVarChar, page1_remarks_1)
      .input('page1_remarks_2', sql.NVarChar, page1_remarks_2)
      .input('overall_remarks', sql.NVarChar, overall_remarks)
      .input('applied_before_1_rating', sql.Int, applied_before_ratings[0] || null)
      .input('applied_before_2_rating', sql.Int, applied_before_ratings[1] || null)
      .input('applied_before_3_rating', sql.Int, applied_before_ratings[2] || null)
      .input('applied_before_4_rating', sql.Int, applied_before_ratings[3] || null)
      .input('applied_before_5_rating', sql.Int, applied_before_ratings[4] || null)
      .input('applied_before_total', sql.Int, applied_before_total || null)
      .input('applied_before_avg', sql.Decimal(5, 2), applied_before_avg || null)
      .input('applied_after_1_rating', sql.Int, applied_after_ratings[0] || null)
      .input('applied_after_2_rating', sql.Int, applied_after_ratings[1] || null)
      .input('applied_after_3_rating', sql.Int, applied_after_ratings[2] || null)
      .input('applied_after_4_rating', sql.Int, applied_after_ratings[3] || null)
      .input('applied_after_5_rating', sql.Int, applied_after_ratings[4] || null)
      .input('applied_after_total', sql.Int, applied_after_total || null)
      .input('applied_after_avg', sql.Decimal(5, 2), applied_after_avg || null)
      .input('business_1_rating', sql.Int, business_ratings[0] || null)
      .input('business_1_feedback', sql.NVarChar, business_feedbacks[0] || '')
      .input('business_2_rating', sql.Int, business_ratings[1] || null)
      .input('business_2_feedback', sql.NVarChar, business_feedbacks[1] || '')
      .input('business_3_rating', sql.Int, business_ratings[2] || null)
      .input('business_3_feedback', sql.NVarChar, business_feedbacks[2] || '')
      .input('business_total', sql.Int, business_total || null)
      .input('business_avg', sql.Decimal(5, 2), business_avg || null)
      .input('page2_remarks_1', sql.NVarChar, page2_remarks_1)
      .input('page2_remarks_2', sql.NVarChar, page2_remarks_2)
      .query(`
        INSERT INTO TrainingEvaluationForms (
          training_id, employee_id, course_title, resource_speaker, participant_name,
          training_date, position, venue,
          program_1_rating, program_2_rating, program_3_rating, program_4_rating, program_5_rating,
          trainer_1_rating, trainer_2_rating, trainer_3_rating, trainer_4_rating, trainer_5_rating,
          transfer_1_rating, transfer_2_rating, transfer_3_rating, transfer_4_rating, transfer_5_rating,
          overall_score, total_average_score, page1_remarks_1, page1_remarks_2, overall_remarks,
          applied_before_1_rating, applied_before_2_rating, applied_before_3_rating, applied_before_4_rating, applied_before_5_rating,
          applied_before_total, applied_before_avg,
          applied_after_1_rating, applied_after_2_rating, applied_after_3_rating, applied_after_4_rating, applied_after_5_rating,
          applied_after_total, applied_after_avg,
          business_1_rating, business_1_feedback, business_2_rating, business_2_feedback, business_3_rating, business_3_feedback,
          business_total, business_avg, page2_remarks_1, page2_remarks_2
        ) VALUES (
          @training_id, @employee_id, @course_title, @resource_speaker, @participant_name,
          @training_date, @position, @venue,
          @program_1_rating, @program_2_rating, @program_3_rating, @program_4_rating, @program_5_rating,
          @trainer_1_rating, @trainer_2_rating, @trainer_3_rating, @trainer_4_rating, @trainer_5_rating,
          @transfer_1_rating, @transfer_2_rating, @transfer_3_rating, @transfer_4_rating, @transfer_5_rating,
          @overall_score, @total_average_score, @page1_remarks_1, @page1_remarks_2, @overall_remarks,
          @applied_before_1_rating, @applied_before_2_rating, @applied_before_3_rating, @applied_before_4_rating, @applied_before_5_rating,
          @applied_before_total, @applied_before_avg,
          @applied_after_1_rating, @applied_after_2_rating, @applied_after_3_rating, @applied_after_4_rating, @applied_after_5_rating,
          @applied_after_total, @applied_after_avg,
          @business_1_rating, @business_1_feedback, @business_2_rating, @business_2_feedback, @business_3_rating, @business_3_feedback,
          @business_total, @business_avg, @page2_remarks_1, @page2_remarks_2
        )
      `);

    res.json({ success: true, message: 'Evaluation form saved successfully', id: result.recordset?.[0]?.id });
  } catch (err) {
    console.error('Error saving evaluation form:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get evaluation forms for a training
app.get('/api/evaluation-forms/:trainingId', async (req, res) => {
  try {
    const { trainingId } = req.params;
    
    const result = await pool.request()
      .input('training_id', sql.BigInt, trainingId)
      .query('SELECT * FROM TrainingEvaluationForms WHERE training_id = @training_id ORDER BY created_at DESC');
    
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error fetching evaluation forms:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all venues for dropdown
app.get('/api/venues', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT DISTINCT venue FROM TrainingRecords 
        WHERE venue IS NOT NULL AND venue != ''
        ORDER BY venue
      `);
    
    const venues = result.recordset.map(r => r.venue);
    res.json({ success: true, data: venues });
  } catch (err) {
    console.error('Error fetching venues:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new employee endpoint
app.post('/api/employees/add', async (req, res) => {
  try {
    const { full_name } = req.body;
    
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Employee name is required' });
    }
    
    // Check if employee already exists
    const checkResult = await pool.request()
      .input('full_name', sql.VarChar, full_name)
      .query('SELECT id FROM Employees WHERE full_name = @full_name');
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Employee already exists' });
    }
    
    // Add new employee
    const result = await pool.request()
      .input('full_name', sql.VarChar, full_name)
      .input('employee_no', sql.VarChar, `EMP-${Date.now()}`)
      .query(`
        INSERT INTO Employees (employee_no, full_name, date_hired)
        VALUES (@employee_no, @full_name, GETDATE())
      `);
    
    res.json({ success: true, message: 'Employee added successfully' });
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new position endpoint
app.post('/api/positions/add', async (req, res) => {
  try {
    const { position } = req.body;
    
    if (!position || !position.trim()) {
      return res.status(400).json({ success: false, message: 'Position is required' });
    }
    
    // Check if position already exists
    const checkResult = await pool.request()
      .input('position', sql.VarChar, position)
      .query('SELECT id FROM Employees WHERE position = @position LIMIT 1');
    
    if (checkResult.recordset.length > 0) {
      return res.json({ success: true, message: 'Position already exists' });
    }
    
    // Position will be saved when used in evaluation form
    res.json({ success: true, message: 'Position ready to save' });
  } catch (err) {
    console.error('Error adding position:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new venue endpoint
app.post('/api/venues/add', async (req, res) => {
  try {
    const { venue } = req.body;
    
    if (!venue || !venue.trim()) {
      return res.status(400).json({ success: false, message: 'Venue is required' });
    }
    
    // Check if venue already exists
    const checkResult = await pool.request()
      .input('venue', sql.VarChar, venue)
      .query('SELECT id FROM TrainingRecords WHERE venue = @venue LIMIT 1');
    
    if (checkResult.recordset.length > 0) {
      return res.json({ success: true, message: 'Venue already exists' });
    }
    
    // Venue will be saved when used in evaluation form
    res.json({ success: true, message: 'Venue ready to save' });
  } catch (err) {
    console.error('Error adding venue:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all speakers for datalist
app.get('/api/speakers', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT DISTINCT trainer FROM TrainingRecords 
        WHERE trainer IS NOT NULL AND trainer != ''
        ORDER BY trainer
      `);
    
    const speakers = result.recordset.map(r => r.trainer);
    res.json({ success: true, data: speakers });
  } catch (err) {
    console.error('Error fetching speakers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new speaker endpoint
app.post('/api/speakers/add', async (req, res) => {
  try {
    const { speaker_name } = req.body;
    
    if (!speaker_name || !speaker_name.trim()) {
      return res.status(400).json({ success: false, message: 'Speaker name is required' });
    }
    
    // Speaker will be saved when evaluation form is submitted
    res.json({ success: true, message: 'Speaker ready to save' });
  } catch (err) {
    console.error('Error adding speaker:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update venue endpoint to save new venues to TrainingRecords
app.post('/api/venues/add', async (req, res) => {
  try {
    const { venue } = req.body;
    
    if (!venue || !venue.trim()) {
      return res.status(400).json({ success: false, message: 'Venue is required' });
    }
    
    // Check if venue already exists
    const checkResult = await pool.request()
      .input('venue', sql.VarChar, venue)
      .query('SELECT TOP 1 id FROM TrainingRecords WHERE venue = @venue');
    
    if (checkResult.recordset.length > 0) {
      return res.json({ success: true, message: 'Venue already exists' });
    }
    
    // Add venue to a default training record or create a reference
    // For now, just confirm it will be saved when form is submitted
    res.json({ success: true, message: 'Venue ready to save' });
  } catch (err) {
    console.error('Error adding venue:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new course endpoint
app.post('/api/courses/add', async (req, res) => {
  try {
    const { course_title } = req.body;
    
    if (!course_title || !course_title.trim()) {
      return res.status(400).json({ success: false, message: 'Course title is required' });
    }
    
    // Check if course already exists
    const checkResult = await pool.request()
      .input('course_title', sql.VarChar, course_title)
      .query('SELECT TOP 1 id FROM Courses WHERE course_title = @course_title');
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Course already exists' });
    }
    
    // Add new course
    const result = await pool.request()
      .input('course_title', sql.VarChar, course_title)
      .query(`
        INSERT INTO Courses (course_title, created_at)
        VALUES (@course_title, GETDATE())
      `);
    
    res.json({ success: true, message: 'Course added successfully' });
  } catch (err) {
    console.error('Error adding course:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
