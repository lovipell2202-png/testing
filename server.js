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
const uploadsBaseDir = path.join(__dirname, 'public', 'uploads', 'tests');
const examDir = path.join(uploadsBaseDir, 'EXAM');
const teefDir = path.join(uploadsBaseDir, 'TEEF');

// Create directories if they don't exist
if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}
if (!fs.existsSync(examDir)) {
  fs.mkdirSync(examDir, { recursive: true });
}
if (!fs.existsSync(teefDir)) {
  fs.mkdirSync(teefDir, { recursive: true });
}

const storage = multer.memoryStorage();

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

    const { employee_id, course_title, document_type, file_type } = req.body;
    
    if (!employee_id || !course_title || !document_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Determine folder based on document type
    let folder = 'tests';
    let targetDir = uploadsBaseDir;
    
    // Debug logging
    console.log('=== Upload Debug ===');
    console.log('document_type:', document_type);
    console.log('file_type:', file_type);
    console.log('mimetype:', req.file.mimetype);
    
    if (file_type === 'exam' || document_type === 'W/EXAM') {
      folder = 'tests/EXAM';
      targetDir = examDir;
      console.log('Setting folder to: tests/EXAM');
    } else if (file_type === 'teef' || document_type === 'W/TEEF') {
      folder = 'tests/TEEF';
      targetDir = teefDir;
      console.log('Setting folder to: tests/TEEF');
    } else if (document_type === 'W/EXAM_TEEF') {
      // For W/EXAM_TEEF without explicit file_type, determine based on file mime type
      if (req.file.mimetype === 'application/pdf') {
        folder = 'tests/EXAM';
        targetDir = examDir;
        console.log('Setting folder to: tests/EXAM (PDF detected)');
      } else {
        folder = 'tests/TEEF';
        targetDir = teefDir;
        console.log('Setting folder to: tests/TEEF (image detected)');
      }
    } else {
      console.log('No matching condition, using default folder: tests');
    }
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log('Created directory:', targetDir);
    }
    
    // Generate filename
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const name = path.basename(req.file.originalname, ext);
    const filename = `${name}-${timestamp}${ext}`;
    
    // Save file to the correct directory
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    console.log('File saved to:', filePath);
    
    // Save file path to database with folder structure
    const fileUrl = `/uploads/${folder}/${filename}`;
    
    console.log('Uploading file for:', { employee_id, course_title, document_type, file_type, folder, fileUrl });
    
    // Update the training record with the file based on document type
    let result;
    if (document_type === 'W/EXAM' || file_type === 'exam') {
      // Update exam_form_url for EXAM documents
      result = await pool.request()
        .input('employee_id', sql.BigInt, parseInt(employee_id))
        .input('course_title', sql.VarChar, course_title)
        .input('exam_form_url', sql.VarChar, fileUrl)
        .input('effectiveness_form', sql.VarChar, document_type === 'W/EXAM_TEEF' ? 'W/EXAM_TEEF' : 'W/EXAM')
        .query(`
          UPDATE TrainingRecords 
          SET exam_form_url = @exam_form_url, effectiveness_form = @effectiveness_form
          WHERE employee_id = @employee_id AND course_title = @course_title
        `);
    } else if (document_type === 'W/TEEF' || file_type === 'teef') {
      // Update eff_form_file for TEEF documents
      result = await pool.request()
        .input('employee_id', sql.BigInt, parseInt(employee_id))
        .input('course_title', sql.VarChar, course_title)
        .input('eff_form_file', sql.VarChar, fileUrl)
        .input('effectiveness_form', sql.VarChar, document_type === 'W/EXAM_TEEF' ? 'W/EXAM_TEEF' : 'W/TEEF')
        .query(`
          UPDATE TrainingRecords 
          SET eff_form_file = @eff_form_file, effectiveness_form = @effectiveness_form
          WHERE employee_id = @employee_id AND course_title = @course_title
        `);
    } else if (document_type === 'W/EXAM_TEEF') {
      // For W/EXAM_TEEF without explicit file_type, determine based on file type
      const fileName = req.file.originalname.toLowerCase();
      const isExamFile = fileName.includes('exam') || req.file.mimetype === 'application/pdf';
      
      // First, get the current record to check what's already there
      const currentRecord = await pool.request()
        .input('employee_id', sql.BigInt, parseInt(employee_id))
        .input('course_title', sql.VarChar, course_title)
        .query(`
          SELECT exam_form_url, eff_form_file FROM TrainingRecords
          WHERE employee_id = @employee_id AND course_title = @course_title
        `);
      
      if (currentRecord.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Training record not found' });
      }
      
      const hasExamFile = currentRecord.recordset[0].exam_form_url ? true : false;
      const hasTeefFile = currentRecord.recordset[0].eff_form_file ? true : false;
      
      // Determine which column to update based on what's missing
      let updateQuery = '';
      let request = pool.request()
        .input('employee_id', sql.BigInt, parseInt(employee_id))
        .input('course_title', sql.VarChar, course_title)
        .input('effectiveness_form', sql.VarChar, 'W/EXAM_TEEF');
      
      if (!hasExamFile && !hasTeefFile) {
        // Neither file exists - assume first upload is EXAM
        updateQuery = `
          UPDATE TrainingRecords 
          SET exam_form_url = @exam_form_url, effectiveness_form = @effectiveness_form
          WHERE employee_id = @employee_id AND course_title = @course_title
        `;
        request = request.input('exam_form_url', sql.VarChar, fileUrl);
      } else if (hasExamFile && !hasTeefFile) {
        // EXAM exists, upload TEEF
        updateQuery = `
          UPDATE TrainingRecords 
          SET eff_form_file = @eff_form_file, effectiveness_form = @effectiveness_form
          WHERE employee_id = @employee_id AND course_title = @course_title
        `;
        request = request.input('eff_form_file', sql.VarChar, fileUrl);
      } else if (!hasExamFile && hasTeefFile) {
        // TEEF exists, upload EXAM
        updateQuery = `
          UPDATE TrainingRecords 
          SET exam_form_url = @exam_form_url, effectiveness_form = @effectiveness_form
          WHERE employee_id = @employee_id AND course_title = @course_title
        `;
        request = request.input('exam_form_url', sql.VarChar, fileUrl);
      } else {
        // Both exist - replace based on file type hint or default to EXAM
        if (isExamFile) {
          updateQuery = `
            UPDATE TrainingRecords 
            SET exam_form_url = @exam_form_url, effectiveness_form = @effectiveness_form
            WHERE employee_id = @employee_id AND course_title = @course_title
          `;
          request = request.input('exam_form_url', sql.VarChar, fileUrl);
        } else {
          updateQuery = `
            UPDATE TrainingRecords 
            SET eff_form_file = @eff_form_file, effectiveness_form = @effectiveness_form
            WHERE employee_id = @employee_id AND course_title = @course_title
          `;
          request = request.input('eff_form_file', sql.VarChar, fileUrl);
        }
      }
      
      result = await request.query(updateQuery);
    } else {
      // Default behavior (backwards compatibility)
      result = await pool.request()
        .input('employee_id', sql.BigInt, parseInt(employee_id))
        .input('course_title', sql.VarChar, course_title)
        .input('exam_form_url', sql.VarChar, fileUrl)
        .input('effectiveness_form', sql.VarChar, document_type)
        .query(`
          UPDATE TrainingRecords 
          SET exam_form_url = @exam_form_url, effectiveness_form = @effectiveness_form
          WHERE employee_id = @employee_id AND course_title = @course_title
        `);
    }

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
app.get('/api/exam-results', examServer.getAllExamResults);
app.get('/api/exam-results/employee/:employee_id', examServer.getEmployeeExamResults);
app.get('/api/exam-results/:id', examServer.getExamResultById);
app.put('/api/exam-results/:id/override', examServer.overrideExamResult);

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
        tr.exam_form_url,
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

// Get all training courses for a specific employee
app.get('/api/trainings/employee/:employee_id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('employee_id', sql.BigInt, req.params.employee_id)
      .query(`SELECT DISTINCT course_title FROM TrainingRecords 
              WHERE employee_id = @employee_id 
              ORDER BY course_title ASC`);
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
        tr.exam_form_url,
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

// Check if test form has attachment
app.get('/api/test-form-attachment', async (req, res) => {
  try {
    const title = req.query.title;
    
    if (!title) {
      return res.json({ success: true, hasAttachment: false });
    }
    
    console.log('🔍 Checking attachment for title:', title);
    
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .query(`SELECT TOP 1 exam_form_url, eff_form_file FROM TrainingRecords 
              WHERE course_title = @title`);
    
    console.log('📊 Query result:', result.recordset);
    
    const hasAttachment = result.recordset.length > 0 && ((result.recordset[0].exam_form_url && result.recordset[0].exam_form_url.trim() !== '') || (result.recordset[0].eff_form_file && result.recordset[0].eff_form_file.trim() !== ''));
    
    console.log('✅ Has attachment:', hasAttachment);
    
    res.json({ success: true, hasAttachment: hasAttachment });
  } catch (err) {
    console.error('❌ Error checking test form attachment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new training record
app.post('/api/trainings', async (req, res) => {
  try {
    const { employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form, exam_form_url, eff_form_file } = req.body;
    
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
      .input('exam_form_url', sql.VarChar, exam_form_url || null)
      .input('eff_form_file', sql.VarChar, eff_form_file || null)
      .query(`INSERT INTO TrainingRecords (employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form, exam_form_url, eff_form_file)
              VALUES (@employee_id, @date_from, @date_to, @duration, @course_title, @training_provider, @venue, @trainer, @type_tb, @effectiveness_form, @exam_form_url, @eff_form_file);
              SELECT SCOPE_IDENTITY() as id;`);
    
    res.json({ success: true, id: result.recordset[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update training record
app.put('/api/trainings/:id', async (req, res) => {
  try {
    const { employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form, exam_form_url, eff_form_file } = req.body;
    
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
      .input('exam_form_url', sql.VarChar, exam_form_url || null)
      .input('eff_form_file', sql.VarChar, eff_form_file || null)
      .query(`UPDATE TrainingRecords 
              SET employee_id = @employee_id, date_from = @date_from, date_to = @date_to, duration = @duration,
                  course_title = @course_title, training_provider = @training_provider, venue = @venue,
                  trainer = @trainer, type_tb = @type_tb, effectiveness_form = @effectiveness_form, exam_form_url = @exam_form_url, eff_form_file = @eff_form_file
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
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`📊 Database: NSB_Training`);
    console.log(`🌐 Accessible from other machines at: http://<your-ubuntu-ip>:${PORT}`);
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

    // Remove the file from the training record (clear both exam and teef)
    const result = await pool.request()
      .input('employee_id', sql.BigInt, employee_id)
      .input('course_title', sql.VarChar, course_title)
      .query(`
        UPDATE TrainingRecords 
        SET exam_form_url = NULL, eff_form_file = NULL, effectiveness_form = 'N/A'
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

// Remove specific attachment type (EXAM or TEEF)
app.post('/api/tests/remove-by-type', async (req, res) => {
  try {
    const { employee_id, course_title, attachment_type } = req.body;
    
    if (!employee_id || !course_title || !attachment_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get current record to check what's left
    const currentRecord = await pool.request()
      .input('employee_id', sql.BigInt, employee_id)
      .input('course_title', sql.VarChar, course_title)
      .query(`
        SELECT exam_form_url, eff_form_file, effectiveness_form FROM TrainingRecords
        WHERE employee_id = @employee_id AND course_title = @course_title
      `);

    if (currentRecord.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Training record not found' });
    }

    const record = currentRecord.recordset[0];
    let updateQuery = '';
    let request = pool.request()
      .input('employee_id', sql.BigInt, employee_id)
      .input('course_title', sql.VarChar, course_title);

    if (attachment_type === 'exam') {
      // Remove EXAM file
      const hasTeef = record.eff_form_file ? true : false;
      const newEffectivenessForm = hasTeef ? 'W/TEEF' : 'N/A';
      
      updateQuery = `
        UPDATE TrainingRecords 
        SET exam_form_url = NULL, effectiveness_form = @effectiveness_form
        WHERE employee_id = @employee_id AND course_title = @course_title
      `;
      request = request.input('effectiveness_form', sql.VarChar, newEffectivenessForm);
    } else if (attachment_type === 'teef') {
      // Remove TEEF file
      const hasExam = record.exam_form_url ? true : false;
      const newEffectivenessForm = hasExam ? 'W/EXAM' : 'N/A';
      
      updateQuery = `
        UPDATE TrainingRecords 
        SET eff_form_file = NULL, effectiveness_form = @effectiveness_form
        WHERE employee_id = @employee_id AND course_title = @course_title
      `;
      request = request.input('effectiveness_form', sql.VarChar, newEffectivenessForm);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid attachment type' });
    }

    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Failed to remove attachment' });
    }

    res.json({ 
      success: true, 
      message: `${attachment_type === 'exam' ? 'EXAM' : 'TEEF'} attachment removed successfully`
    });
  } catch (err) {
    console.error('Remove by type error:', err);
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
      .input('training_date', sql.DateTime, training_date ? (() => {
        // Handle MM-DD-YYYY format from the form
        if (/^\d{2}-\d{2}-\d{4}$/.test(training_date)) {
          const [m, d, y] = training_date.split('-');
          return new Date(`${y}-${m}-${d}`);
        }
        return new Date(training_date);
      })() : null)
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
        ); SELECT SCOPE_IDENTITY() AS id;
      `);

    const newId = result.recordset?.[0]?.id || null;

    // Also mark the TrainingRecord as having a TEEF attachment
    await pool.request()
      .input('training_id', sql.BigInt, training_id)
      .query(`UPDATE TrainingRecords SET eff_form_file = 'W/TEEF' WHERE id = @training_id AND (eff_form_file IS NULL OR eff_form_file = '')`);

    res.json({ success: true, message: 'Evaluation form saved successfully', id: newId });
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

// Get all evaluation forms (TEEF Management)
app.get('/api/evaluation-forms', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`SELECT tef.*, e.full_name as employee_name
              FROM TrainingEvaluationForms tef
              LEFT JOIN Employees e ON tef.employee_id = e.id
              ORDER BY tef.created_at DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single evaluation form by TEEF id
app.get('/api/evaluation-form/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('SELECT * FROM TrainingEvaluationForms WHERE id = @id');
    if (!result.recordset.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete evaluation form (TEEF)
app.delete('/api/evaluation-forms/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query('DELETE FROM TrainingEvaluationForms WHERE id = @id');
    res.json({ success: true, message: 'TEEF record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update evaluation form (TEEF edit)
app.put('/api/evaluation-form/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      program_ratings, trainer_ratings, transfer_ratings,
      overall_score, total_average_score, page1_remarks_1, page1_remarks_2, overall_remarks,
      applied_before_ratings, applied_after_ratings, applied_before_total, applied_before_avg,
      applied_after_total, applied_after_avg,
      business_ratings, business_feedbacks, business_total, business_avg,
      page2_remarks_1, page2_remarks_2
    } = req.body;

    await pool.request()
      .input('id', sql.BigInt, id)
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
      .input('total_average_score', sql.Decimal(5,2), total_average_score || null)
      .input('page1_remarks_1', sql.NVarChar, page1_remarks_1 || '')
      .input('page1_remarks_2', sql.NVarChar, page1_remarks_2 || '')
      .input('overall_remarks', sql.NVarChar, overall_remarks || '')
      .input('applied_before_1_rating', sql.Int, applied_before_ratings[0] || null)
      .input('applied_before_2_rating', sql.Int, applied_before_ratings[1] || null)
      .input('applied_before_3_rating', sql.Int, applied_before_ratings[2] || null)
      .input('applied_before_4_rating', sql.Int, applied_before_ratings[3] || null)
      .input('applied_before_5_rating', sql.Int, applied_before_ratings[4] || null)
      .input('applied_before_total', sql.Int, applied_before_total || null)
      .input('applied_before_avg', sql.Decimal(5,2), applied_before_avg || null)
      .input('applied_after_1_rating', sql.Int, applied_after_ratings[0] || null)
      .input('applied_after_2_rating', sql.Int, applied_after_ratings[1] || null)
      .input('applied_after_3_rating', sql.Int, applied_after_ratings[2] || null)
      .input('applied_after_4_rating', sql.Int, applied_after_ratings[3] || null)
      .input('applied_after_5_rating', sql.Int, applied_after_ratings[4] || null)
      .input('applied_after_total', sql.Int, applied_after_total || null)
      .input('applied_after_avg', sql.Decimal(5,2), applied_after_avg || null)
      .input('business_1_rating', sql.Int, business_ratings[0] || null)
      .input('business_1_feedback', sql.NVarChar, business_feedbacks[0] || '')
      .input('business_2_rating', sql.Int, business_ratings[1] || null)
      .input('business_2_feedback', sql.NVarChar, business_feedbacks[1] || '')
      .input('business_3_rating', sql.Int, business_ratings[2] || null)
      .input('business_3_feedback', sql.NVarChar, business_feedbacks[2] || '')
      .input('business_total', sql.Int, business_total || null)
      .input('business_avg', sql.Decimal(5,2), business_avg || null)
      .input('page2_remarks_1', sql.NVarChar, page2_remarks_1 || '')
      .input('page2_remarks_2', sql.NVarChar, page2_remarks_2 || '')
      .query(`UPDATE TrainingEvaluationForms SET
        program_1_rating=@program_1_rating, program_2_rating=@program_2_rating, program_3_rating=@program_3_rating, program_4_rating=@program_4_rating, program_5_rating=@program_5_rating,
        trainer_1_rating=@trainer_1_rating, trainer_2_rating=@trainer_2_rating, trainer_3_rating=@trainer_3_rating, trainer_4_rating=@trainer_4_rating, trainer_5_rating=@trainer_5_rating,
        transfer_1_rating=@transfer_1_rating, transfer_2_rating=@transfer_2_rating, transfer_3_rating=@transfer_3_rating, transfer_4_rating=@transfer_4_rating, transfer_5_rating=@transfer_5_rating,
        overall_score=@overall_score, total_average_score=@total_average_score,
        page1_remarks_1=@page1_remarks_1, page1_remarks_2=@page1_remarks_2, overall_remarks=@overall_remarks,
        applied_before_1_rating=@applied_before_1_rating, applied_before_2_rating=@applied_before_2_rating, applied_before_3_rating=@applied_before_3_rating, applied_before_4_rating=@applied_before_4_rating, applied_before_5_rating=@applied_before_5_rating,
        applied_before_total=@applied_before_total, applied_before_avg=@applied_before_avg,
        applied_after_1_rating=@applied_after_1_rating, applied_after_2_rating=@applied_after_2_rating, applied_after_3_rating=@applied_after_3_rating, applied_after_4_rating=@applied_after_4_rating, applied_after_5_rating=@applied_after_5_rating,
        applied_after_total=@applied_after_total, applied_after_avg=@applied_after_avg,
        business_1_rating=@business_1_rating, business_1_feedback=@business_1_feedback,
        business_2_rating=@business_2_rating, business_2_feedback=@business_2_feedback,
        business_3_rating=@business_3_rating, business_3_feedback=@business_3_feedback,
        business_total=@business_total, business_avg=@business_avg,
        page2_remarks_1=@page2_remarks_1, page2_remarks_2=@page2_remarks_2,
        updated_at=GETDATE()
        WHERE id=@id`);

    res.json({ success: true, message: 'Evaluation form updated successfully' });
  } catch (err) {
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
