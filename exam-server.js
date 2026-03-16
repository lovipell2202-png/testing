const sql = require('mssql');
const fs = require('fs');
const path = require('path');

let pool;

function setPool(dbPool) {
  pool = dbPool;
}

// Helper function to save base64 image to disk
function saveBase64Image(base64String) {
  if (!base64String || !base64String.startsWith('data:image')) {
    return null;
  }
  
  try {
    // Extract the base64 data and format
    const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;
    
    const format = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    
    // Create filename with timestamp
    const filename = `identification_${Date.now()}.${format}`;
    const filepath = path.join(__dirname, 'public', 'uploads', 'images', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filepath, buffer);
    
    // Return the URL path
    return `/uploads/images/${filename}`;
  } catch (err) {
    console.error('Error saving image:', err);
    return null;
  }
}

async function getExams(req, res) {
  try {
    const result = await pool.request()
      .query(`SELECT c.id, c.course_title as title, c.description, 
                     COUNT(eq.id) as total_questions, 70 as passing_score,
                     c.created_at
              FROM Courses c
              LEFT JOIN ExamQuestions eq ON c.id = eq.course_id
              GROUP BY c.id, c.course_title, c.description, c.created_at
              ORDER BY c.created_at DESC`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error fetching exams:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getExamById(req, res) {
  try {
    const courseResult = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`SELECT id, course_title as title, description, created_at
              FROM Courses WHERE id = @id`);
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const exam = courseResult.recordset[0];
    const questionsResult = await pool.request()
      .input('course_id', sql.BigInt, exam.id)
      .query(`SELECT id, course_id, question_number, question_type, question_text, 
                     option_a, option_b, option_c, option_d, correct_answer, points,
                     procedure_title, procedure_content, procedure_instructions, procedure_answer,
                     enumeration_title, enumeration_instruction, enumeration_items, enumeration_answer,
                     enumeration_items_json, procedure_items_json,
                     identification_title, identification_instruction, identification_image_url, identification_answer, identification_items_json
              FROM ExamQuestions 
              WHERE course_id = @course_id 
              ORDER BY question_type, question_number`);
    
    res.json({ success: true, exam, questions: questionsResult.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createExam(req, res) {
  try {
    const { title, course_title, questions } = req.body;
    
    if (!title || !course_title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const courseResult = await pool.request()
      .input('course_title', sql.VarChar(sql.MAX), course_title)
      .query(`SELECT TOP 1 id FROM Courses WHERE course_title = @course_title`);
    
    if (courseResult.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'Course not found: ' + course_title });
    }
    
    const courseId = courseResult.recordset[0].id;

    if (questions && questions.length > 0) {
      let mcNum = 1, enumNum = 1, procNum = 1, idNum = 1;
      
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        console.log(`[DEBUG] Processing question ${i + 1}:`, JSON.stringify(q, null, 2));
        let questionNum;
        
        if (q.type === 'multiple_choice') {
          questionNum = mcNum++;
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'multiple_choice')
            .input('question_text', sql.VarChar(sql.MAX), q.question || '')
            .input('option_a', sql.VarChar(sql.MAX), q.options[0] || '')
            .input('option_b', sql.VarChar(sql.MAX), q.options[1] || '')
            .input('option_c', sql.VarChar(sql.MAX), q.options[2] || '')
            .input('option_d', sql.VarChar(sql.MAX), q.options[3] || '')
            .input('correct_answer', sql.Char(1), q.correctAnswer || '')
            .input('points', sql.Int, 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @option_a, @option_b, @option_c, @option_d, @correct_answer, @points, GETDATE())`);
        } else if (q.type === 'enumeration') {
          questionNum = enumNum++;
          console.log(`[DEBUG] Enumeration question - items_json:`, q.items_json);
          console.log(`[DEBUG] Enumeration question - question:`, q.question);
          console.log(`[DEBUG] Enumeration question - items array:`, q.items);
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'enumeration')
            .input('question_text', sql.VarChar(sql.MAX), q.question || '')
            .input('enumeration_title', sql.VarChar(sql.MAX), q.title || '')
            .input('enumeration_instruction', sql.VarChar(sql.MAX), q.instruction || '')
            .input('enumeration_items', sql.VarChar(sql.MAX), q.count?.toString() || '')
            .input('enumeration_answer', sql.VarChar(sql.MAX), q.answer || '')
            .input('enumeration_items_json', sql.VarChar(sql.MAX), q.items_json || '')
            .input('points', sql.Int, 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, enumeration_title, enumeration_instruction, enumeration_items, enumeration_answer, enumeration_items_json, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @enumeration_title, @enumeration_instruction, @enumeration_items, @enumeration_answer, @enumeration_items_json, @points, GETDATE())`);
          console.log(`[DEBUG] Enumeration question inserted successfully`);
        } else if (q.type === 'procedure') {
          questionNum = procNum++;
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'procedure')
            .input('question_text', sql.VarChar(sql.MAX), q.question || '')
            .input('procedure_title', sql.VarChar(sql.MAX), q.title || '')
            .input('procedure_content', sql.VarChar(sql.MAX), q.content || '')
            .input('procedure_instructions', sql.VarChar(sql.MAX), q.instructions || '')
            .input('procedure_answer', sql.VarChar(sql.MAX), q.answer || '')
            .input('procedure_items_json', sql.VarChar(sql.MAX), q.items_json || '')
            .input('points', sql.Int, 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, procedure_title, procedure_content, procedure_instructions, procedure_answer, procedure_items_json, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @procedure_title, @procedure_content, @procedure_instructions, @procedure_answer, @procedure_items_json, @points, GETDATE())`);
        } else if (q.type === 'identification') {
          questionNum = idNum++;
          // If no new image uploaded but existing image_url provided, preserve the existing image
          let imageUrl = null;
          if (q.image_base64 && q.image_base64.startsWith('data:image')) {
            // New image uploaded - save it
            imageUrl = saveBase64Image(q.image_base64);
          } else if (q.image_url && q.image_url.includes('/uploads/')) {
            // No new image, but existing URL provided - preserve it
            imageUrl = q.image_url;
          }
          
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'identification')
            .input('question_text', sql.VarChar(sql.MAX), q.question_text || '')
            .input('identification_title', sql.VarChar(sql.MAX), q.title || '')
            .input('identification_instruction', sql.VarChar(sql.MAX), q.instruction || '')
            .input('identification_image_url', sql.VarChar(sql.MAX), imageUrl || '')
            .input('identification_answer', sql.VarChar(sql.MAX), q.answer || '')
            .input('identification_items_json', sql.VarChar(sql.MAX), JSON.stringify(q.items || []))
            .input('points', sql.Int, q.count || q.items?.length || 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, identification_title, identification_instruction, identification_image_url, identification_answer, identification_items_json, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @identification_title, @identification_instruction, @identification_image_url, @identification_answer, @identification_items_json, @points, GETDATE())`);
          console.log(`[DEBUG] Identification question inserted successfully with image URL: ${imageUrl}`);
        }
      }
    }

    res.status(201).json({ success: true, id: courseId, message: 'Exam questions saved successfully' });
  } catch (err) {
    console.error('Error creating exam:', err.message);
    res.status(500).json({ success: false, message: 'Error creating exam: ' + err.message });
  }
}

async function updateExam(req, res) {
  try {
    const { title, course_title, description, questions } = req.body;
    const courseId = req.params.id;

    if (!title || !course_title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const courseResult = await pool.request()
      .input('id', sql.BigInt, courseId)
      .query(`SELECT id FROM Courses WHERE id = @id`);
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    await pool.request()
      .input('course_id', sql.BigInt, courseId)
      .query('DELETE FROM ExamQuestions WHERE course_id = @course_id');

    if (questions && questions.length > 0) {
      let mcNum = 1, enumNum = 1, procNum = 1, idNum = 1;
      
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let questionNum;
        
        if (q.type === 'multiple_choice') {
          questionNum = mcNum++;
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'multiple_choice')
            .input('question_text', sql.VarChar(sql.MAX), q.question || '')
            .input('option_a', sql.VarChar(sql.MAX), q.options[0] || '')
            .input('option_b', sql.VarChar(sql.MAX), q.options[1] || '')
            .input('option_c', sql.VarChar(sql.MAX), q.options[2] || '')
            .input('option_d', sql.VarChar(sql.MAX), q.options[3] || '')
            .input('correct_answer', sql.Char(1), q.correctAnswer || '')
            .input('points', sql.Int, 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @option_a, @option_b, @option_c, @option_d, @correct_answer, @points, GETDATE())`);
        } else if (q.type === 'enumeration') {
          questionNum = enumNum++;
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'enumeration')
            .input('question_text', sql.VarChar(sql.MAX), q.question || '')
            .input('enumeration_title', sql.VarChar(sql.MAX), q.title || '')
            .input('enumeration_instruction', sql.VarChar(sql.MAX), q.instruction || '')
            .input('enumeration_items', sql.VarChar(sql.MAX), q.count?.toString() || '')
            .input('enumeration_answer', sql.VarChar(sql.MAX), q.answer || '')
            .input('enumeration_items_json', sql.VarChar(sql.MAX), q.items_json || '')
            .input('points', sql.Int, 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, enumeration_title, enumeration_instruction, enumeration_items, enumeration_answer, enumeration_items_json, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @enumeration_title, @enumeration_instruction, @enumeration_items, @enumeration_answer, @enumeration_items_json, @points, GETDATE())`);
        } else if (q.type === 'procedure') {
          questionNum = procNum++;
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'procedure')
            .input('question_text', sql.VarChar(sql.MAX), q.question || '')
            .input('procedure_title', sql.VarChar(sql.MAX), q.title || '')
            .input('procedure_content', sql.VarChar(sql.MAX), q.content || '')
            .input('procedure_instructions', sql.VarChar(sql.MAX), q.instructions || '')
            .input('procedure_answer', sql.VarChar(sql.MAX), q.answer || '')
            .input('procedure_items_json', sql.VarChar(sql.MAX), q.items_json || '')
            .input('points', sql.Int, 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, procedure_title, procedure_content, procedure_instructions, procedure_answer, procedure_items_json, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @procedure_title, @procedure_content, @procedure_instructions, @procedure_answer, @procedure_items_json, @points, GETDATE())`);
        } else if (q.type === 'identification') {
          questionNum = idNum++;
          // If no new image uploaded but existing image_url provided, preserve the existing image
          let imageUrl = null;
          if (q.image_base64 && q.image_base64.startsWith('data:image')) {
            // New image uploaded - save it
            imageUrl = saveBase64Image(q.image_base64);
          } else if (q.image_url && q.image_url.includes('/uploads/')) {
            // No new image, but existing URL provided - preserve it
            imageUrl = q.image_url;
          }
          
          await pool.request()
            .input('course_id', sql.BigInt, courseId)
            .input('question_number', sql.Int, questionNum)
            .input('question_type', sql.VarChar(50), 'identification')
            .input('question_text', sql.VarChar(sql.MAX), q.question_text || '')
            .input('identification_title', sql.VarChar(sql.MAX), q.title || '')
            .input('identification_instruction', sql.VarChar(sql.MAX), q.instruction || '')
            .input('identification_image_url', sql.VarChar(sql.MAX), imageUrl || '')
            .input('identification_answer', sql.VarChar(sql.MAX), q.answer || '')
            .input('identification_items_json', sql.VarChar(sql.MAX), JSON.stringify(q.items || []))
            .input('points', sql.Int, q.count || q.items?.length || 1)
            .query(`INSERT INTO ExamQuestions (course_id, question_number, question_type, question_text, identification_title, identification_instruction, identification_image_url, identification_answer, identification_items_json, points, created_at)
                    VALUES (@course_id, @question_number, @question_type, @question_text, @identification_title, @identification_instruction, @identification_image_url, @identification_answer, @identification_items_json, @points, GETDATE())`);
        }
      }
    }

    res.json({ success: true, message: 'Exam questions updated successfully' });
  } catch (err) {
    console.error('Error updating exam:', err.message);
    res.status(500).json({ success: false, message: 'Error updating exam: ' + err.message });
  }
}

async function deleteExam(req, res) {
  try {
    await pool.request()
      .input('course_id', sql.BigInt, req.params.id)
      .query('DELETE FROM ExamQuestions WHERE course_id = @course_id');
    
    res.json({ success: true, message: 'Exam questions deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function saveExamResult(req, res) {
  try {
    const { employee_id, exam_id, score, total_points, percentage, passed, answers } = req.body;
    
    if (!employee_id || !exam_id) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Fetch employee full name
    let employeeFullName = '';
    try {
      const empResult = await pool.request()
        .input('employee_id', sql.BigInt, employee_id)
        .query('SELECT full_name FROM Employees WHERE id = @employee_id');
      
      if (empResult.recordset.length > 0) {
        employeeFullName = empResult.recordset[0].full_name || '';
      }
    } catch (empErr) {
      console.error('Error fetching employee name:', empErr.message);
    }

    // Fetch course title from exam (exam_id refers to course_id)
    let courseTitle = '';
    try {
      const courseResult = await pool.request()
        .input('exam_id', sql.BigInt, exam_id)
        .query('SELECT course_title FROM Courses WHERE id = @exam_id');
      
      if (courseResult.recordset.length > 0) {
        courseTitle = courseResult.recordset[0].course_title || '';
      }
    } catch (courseErr) {
      console.error('Error fetching course title:', courseErr.message);
    }

    // Insert exam result with employee name and course title
    const result = await pool.request()
      .input('employee_id', sql.BigInt, employee_id)
      .input('exam_id', sql.BigInt, exam_id)
      .input('score', sql.Int, score || 0)
      .input('total_points', sql.Int, total_points || 0)
      .input('percentage', sql.Decimal(5, 2), percentage || 0)
      .input('passed', sql.Bit, passed || 0)
      .input('answers', sql.NVarChar(sql.MAX), JSON.stringify(answers) || null)
      .input('employee_full_name', sql.NVarChar(255), employeeFullName)
      .input('course_title', sql.NVarChar(255), courseTitle)
      .query(`INSERT INTO ExamResults (employee_id, exam_id, score, total_points, percentage, passed, answers, employee_full_name, course_title, submitted_at)
              VALUES (@employee_id, @exam_id, @score, @total_points, @percentage, @passed, @answers, @employee_full_name, @course_title, GETDATE());
              SELECT SCOPE_IDENTITY() as id`);
    
    res.status(201).json({ success: true, id: result.recordset[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getEmployeeExamResults(req, res) {
  try {
    const result = await pool.request()
      .input('employee_id', sql.BigInt, req.params.employee_id)
      .query(`SELECT er.id, er.employee_id, er.exam_id, er.score, er.total_points, er.percentage, 
                     er.passed, er.submitted_at, c.course_title as title
              FROM ExamResults er
              JOIN Courses c ON er.exam_id = c.id
              WHERE er.employee_id = @employee_id
              ORDER BY er.submitted_at DESC`);
    
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  setPool,
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  saveExamResult,
  getEmployeeExamResults
};
