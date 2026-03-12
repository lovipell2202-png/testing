// Exam API Endpoints
app.post('/api/exams', async (req, res) => {
  try {
    const { title, course_title, course_code, description, question_count, questions } = req.body;
    
    if (!title || !course_title || !questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const examResult = await pool.request()
      .input('title', sql.VarChar(200), title)
      .input('course_title', sql.VarChar(200), course_title)
      .input('course_code', sql.VarChar(50), course_code || '')
      .input('description', sql.VarChar(sql.MAX), description || '')
      .input('question_count', sql.Int, question_count || questions.length)
      .query(`INSERT INTO Exams (title, course_title, course_code, description, question_count, created_at)
              VALUES (@title, @course_title, @course_code, @description, @question_count, GETDATE());
              SELECT SCOPE_IDENTITY() as id`);
    
    const examId = examResult.recordset[0].id;

    for (const q of questions) {
      if (q.type === 'multiple_choice') {
        await pool.request()
          .input('exam_id', sql.Int, examId)
          .input('question_type', sql.VarChar(50), 'multiple_choice')
          .input('question_text', sql.VarChar(sql.MAX), q.question)
          .input('option_a', sql.VarChar(sql.MAX), q.options[0] || '')
          .input('option_b', sql.VarChar(sql.MAX), q.options[1] || '')
          .input('option_c', sql.VarChar(sql.MAX), q.options[2] || '')
          .input('option_d', sql.VarChar(sql.MAX), q.options[3] || '')
          .input('correct_answer', sql.VarChar(50), q.correctAnswer)
          .query(`INSERT INTO ExamQuestions (exam_id, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer)
                  VALUES (@exam_id, @question_type, @question_text, @option_a, @option_b, @option_c, @option_d, @correct_answer)`);
      } else if (q.type === 'procedure') {
        await pool.request()
          .input('exam_id', sql.Int, examId)
          .input('question_type', sql.VarChar(50), 'procedure')
          .input('procedure_title', sql.VarChar(sql.MAX), q.title)
          .input('procedure_content', sql.VarChar(sql.MAX), q.content)
          .input('procedure_instructions', sql.VarChar(sql.MAX), q.instructions || '')
          .query(`INSERT INTO ExamQuestions (exam_id, question_type, procedure_title, procedure_content, procedure_instructions)
                  VALUES (@exam_id, @question_type, @procedure_title, @procedure_content, @procedure_instructions)`);
      } else if (q.type === 'enumeration') {
        await pool.request()
          .input('exam_id', sql.Int, examId)
          .input('question_type', sql.VarChar(50), 'enumeration')
          .input('enumeration_title', sql.VarChar(sql.MAX), q.title)
          .input('enumeration_instruction', sql.VarChar(sql.MAX), q.instruction)
          .input('enumeration_items', sql.VarChar(sql.MAX), JSON.stringify(q.items))
          .query(`INSERT INTO ExamQuestions (exam_id, question_type, enumeration_title, enumeration_instruction, enumeration_items)
                  VALUES (@exam_id, @question_type, @enumeration_title, @enumeration_instruction, @enumeration_items)`);
      }
    }

    res.status(201).json({ success: true, id: examId, message: 'Exam saved successfully' });
  } catch (err) {
    console.error('Error saving exam:', err.message);
    res.status(500).json({ success: false, message: 'Error saving exam: ' + err.message });
  }
});

app.get('/api/exams', async (req, res) => {
  try {
    const courseTitle = req.query.course_title;
    let query = 'SELECT * FROM Exams';
    let request = pool.request();

    if (courseTitle) {
      query += ' WHERE course_title = @course_title';
      request = request.input('course_title', sql.VarChar(200), courseTitle);
    }

    query += ' ORDER BY created_at DESC';
    const result = await request.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error fetching exams:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching exams' });
  }
});

app.get('/api/exams/:examId', async (req, res) => {
  try {
    const result = await pool.request()
      .input('exam_id', sql.Int, req.params.examId)
      .query('SELECT * FROM ExamQuestions WHERE exam_id = @exam_id ORDER BY id');
    res.json({ success: true, questions: result.recordset });
  } catch (err) {
    console.error('Error fetching exam questions:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching exam questions' });
  }
});

app.delete('/api/exams/:examId', async (req, res) => {
  try {
    await pool.request()
      .input('exam_id', sql.Int, req.params.examId)
      .query('DELETE FROM ExamQuestions WHERE exam_id = @exam_id');
    
    const result = await pool.request()
      .input('exam_id', sql.Int, req.params.examId)
      .query('DELETE FROM Exams WHERE id = @exam_id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (err) {
    console.error('Error deleting exam:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting exam' });
  }
});
