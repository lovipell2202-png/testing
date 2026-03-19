const API = '';
let currentEmployees = [];
let currentQuestions = [];
let currentAnswers = {};
let currentQuestion = 0;
let examStarted = false;
let selectedEmployeeId = null;
let selectedEmployeeName = null;
let selectedEmployeeLastName = null;
let examId = null;
let examTitle = null;
let sectionScores = { multiple_choice: 0, enumeration: 0, procedure: 0, identification: 0 };
let sectionTotals = { multiple_choice: 0, enumeration: 0, procedure: 0, identification: 0 };

// HTML escape function to prevent XSS
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Load logo as base64 data URL for PDF embedding
async function getLogoAsBase64() {
  try {
    const response = await fetch('/images/NSB-LOGO.png');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('❌ Error loading logo:', err);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 take-exam.js DOMContentLoaded event fired');
  console.log('🔗 Current URL:', window.location.href);
  console.log('🔍 Search params:', window.location.search);
  
  const urlParams = new URLSearchParams(window.location.search);
  console.log('📋 URLSearchParams object:', urlParams);
  
  // Try to get exam ID first, then fall back to course name
  examId = urlParams.get('id');
  courseName = urlParams.get('course');
  
  console.log('✅ Extracted examId:', examId, 'type:', typeof examId);
  console.log('✅ Extracted courseName:', courseName, 'type:', typeof courseName);
  
  if (!examId && !courseName) {
    console.error('❌ No exam ID or course name found in URL');
    alert('No exam ID or course provided');
    window.location.href = '/pages/all-exams.html';
    return;
  }
  
  console.log('✅ Exam parameters are valid, proceeding with loading');
  loadEmployees();
  
  if (examId) {
    loadExamDetails();
  } else if (courseName) {
    loadExamByCourse();
  }
});

async function loadEmployees() {
  try {
    const response = await fetch(API + '/api/employees');
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      currentEmployees = data.data;
      populateEmployeeSelect();
    }
  } catch (err) {
    console.error('Error loading employees:', err);
  }
}

function populateEmployeeSelect() {
  const select = document.getElementById('employeeSelect');
  if (!select) return;
  select.innerHTML = '<option value="">-- Select an employee --</option>';
  currentEmployees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = emp.full_name || (emp.first_name + ' ' + emp.last_name);
    select.appendChild(option);
  });
}

async function loadExamDetails() {
  try {
    const response = await fetch(API + '/api/exams/' + examId);
    const data = await response.json();
    if (data.success && data.exam) {
      document.getElementById('examTitle').textContent = data.exam.title || 'Exam';
      document.getElementById('examDescription').textContent = data.exam.description || '';
      examTitle = data.exam.title || 'Exam';
    }
  } catch (err) {
    console.error('Error loading exam details:', err);
  }
}

async function loadExamByCourse() {
  try {
    console.log('📚 Loading exam by course name:', courseName);
    // Fetch all exams and find the one matching the course name
    const response = await fetch(API + '/api/exams');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      // Find exam by course title
      const exam = data.data.find(e => e.title === courseName || e.title === decodeURIComponent(courseName));
      
      if (exam) {
        console.log('✅ Found exam:', exam);
        examId = exam.id;
        document.getElementById('examTitle').textContent = exam.title || 'Exam';
        document.getElementById('examDescription').textContent = exam.description || '';
        examTitle = exam.title || 'Exam';
        // Now load the questions
        loadExamQuestions();
      } else {
        console.error('❌ No exam found for course:', courseName);
        alert('No exam found for course: ' + courseName);
        window.location.href = '/pages/all-exams.html';
      }
    } else {
      console.error('❌ Failed to load exams');
      alert('Failed to load exams');
      window.location.href = '/pages/all-exams.html';
    }
  } catch (err) {
    console.error('❌ Error loading exam by course:', err);
    alert('Error loading exam: ' + err.message);
    window.location.href = '/pages/all-exams.html';
  }
}

function startExamWithEmployee() {
  const employeeSelect = document.getElementById('employeeSelect');
  selectedEmployeeId = employeeSelect.value;
  if (!selectedEmployeeId) {
    alert('Please select an employee');
    return;
  }
  const employee = currentEmployees.find(e => e.id == selectedEmployeeId);
  if (employee) {
    selectedEmployeeName = employee.full_name || (employee.first_name + ' ' + employee.last_name);
    // Extract last name for PDF filename
    if (employee.last_name) {
      selectedEmployeeLastName = employee.last_name;
    } else if (employee.full_name) {
      const nameParts = employee.full_name.split(' ');
      selectedEmployeeLastName = nameParts[nameParts.length - 1];
    } else {
      selectedEmployeeLastName = 'Employee';
    }
  }
  document.getElementById('employeeSelectionModal').style.display = 'none';
  loadExamQuestions();
}

async function loadExamQuestions() {
  try {
    const response = await fetch(API + '/api/exams/' + examId);
    const data = await response.json();
    if (data.success && data.questions && Array.isArray(data.questions)) {
      const typeOrder = { 'multiple_choice': 1, 'enumeration': 2, 'procedure': 3, 'identification': 4 };
      currentQuestions = data.questions.sort((a, b) => {
        return (typeOrder[a.question_type] || 999) - (typeOrder[b.question_type] || 999);
      });
      
      currentQuestions.forEach(q => {
        currentAnswers[q.id] = null;
        const points = q.points || 1;
        if (q.question_type === 'enumeration') {
          try {
            let items = [];
            if (q.enumeration_items_json) {
              items = JSON.parse(q.enumeration_items_json);
            }
            let total = 0;
            items.forEach(item => { total += item.points || 1; });
            sectionTotals[q.question_type] = (sectionTotals[q.question_type] || 0) + total;
          } catch (e) {
            sectionTotals[q.question_type] = (sectionTotals[q.question_type] || 0) + points;
          }
        } else if (q.question_type === 'identification') {
          try {
            let items = [];
            if (q.identification_items_json) {
              items = JSON.parse(q.identification_items_json);
            }
            let total = 0;
            items.forEach(item => { total += item.points || 1; });
            sectionTotals[q.question_type] = (sectionTotals[q.question_type] || 0) + total;
          } catch (e) {
            sectionTotals[q.question_type] = (sectionTotals[q.question_type] || 0) + points;
          }
        } else if (q.question_type === 'procedure') {
          try {
            let items = [];
            if (q.procedure_items_json) {
              items = JSON.parse(q.procedure_items_json);
            }
            let total = 0;
            items.forEach(item => { total += 1; });
            sectionTotals[q.question_type] = (sectionTotals[q.question_type] || 0) + total;
          } catch (e) {
            sectionTotals[q.question_type] = (sectionTotals[q.question_type] || 0) + points;
          }
        } else {
          sectionTotals[q.question_type] = (sectionTotals[q.question_type] || 0) + points;
        }
      });
      
      examStarted = true;
      currentQuestion = 0;
      document.getElementById('totalQuestions').textContent = currentQuestions.length;
      displayQuestion();
    }
  } catch (err) {
    console.error('Error loading questions:', err);
    alert('Failed to load exam questions');
  }
}

function displayQuestion() {
  if (currentQuestion >= currentQuestions.length) {
    submitExam();
    return;
  }
  const question = currentQuestions[currentQuestion];
  const container = document.getElementById('questionsContainer');
  document.getElementById('currentQuestion').textContent = currentQuestion + 1;
  document.getElementById('progressFill').style.width = ((currentQuestion + 1) / currentQuestions.length * 100) + '%';
  
  let html = '<div class="question-container" style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
  html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">';
  html += '<div style="background: #2196f3; color: white; padding: 10px 18px; border-radius: 20px; font-size: 12px; font-weight: 700;">Question ' + (currentQuestion + 1) + ' of ' + currentQuestions.length + '</div>';
  html += '<div style="font-size: 12px; color: #999; background: #f5f5f5; padding: 8px 14px; border-radius: 6px; font-weight: 600;">' + question.question_type.toUpperCase().replace(/_/g, ' ') + '</div>';
  html += '</div>';
  html += '<div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 30px; line-height: 1.7;">' + (question.question_text || '') + '</div>';
  
  if (question.question_type === 'multiple_choice') {
    html += '<div style="margin-bottom: 20px;"><div style="display: flex; flex-direction: column; gap: 12px;">';
    ['A', 'B', 'C', 'D'].forEach(opt => {
      const value = question['option_' + opt.toLowerCase()];
      if (value) {
        const isSelected = currentAnswers[question.id] === opt;
        html += '<label style="display: flex; align-items: center; padding: 16px; background: ' + (isSelected ? '#e3f2fd' : '#f8f9fa') + '; border: 2px solid ' + (isSelected ? '#2196f3' : '#e0e0e0') + '; border-radius: 8px; cursor: pointer;">';
        html += '<input type="radio" name="answer" value="' + opt + '" ' + (isSelected ? 'checked' : '') + ' onchange="selectAnswer(' + question.id + ', \'' + opt + '\')" style="width: 20px; height: 20px; margin-right: 15px; cursor: pointer;">';
        html += '<span style="display: flex; align-items: center; gap: 14px; width: 100%;"><span style="background: #2196f3; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">' + opt + '</span>';
        html += '<span style="font-size: 14px; color: #333;">' + value + '</span></span></label>';
      }
    });
    html += '</div></div>';
  } else if (question.question_type === 'enumeration') {
    let items = [];
    try { if (question.enumeration_items_json) items = JSON.parse(question.enumeration_items_json); } catch (e) {}
    html += '<div style="margin-bottom: 20px;"><div style="display: flex; flex-direction: column; gap: 14px;">';
    items.forEach((item, idx) => {
      html += '<div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2196f3;">';
      html += '<label style="display: block; margin-bottom: 12px; font-weight: 600; color: #333; font-size: 14px;">';
      html += '<span style="background: #2196f3; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px;">' + (idx + 1) + '</span>';
      html += (item.text || item) + '</label>';
      html += '<input type="text" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; text-transform: uppercase; font-weight: 600; font-family: \'Courier New\', monospace;" placeholder="Type answer (CAPITAL LETTERS)" value="' + ((currentAnswers[question.id] && currentAnswers[question.id][idx]) || '') + '" onchange="updateEnumerationAnswer(' + question.id + ', ' + idx + ', this.value)" oninput="this.value = this.value.toUpperCase()">';
      html += '<small style="display: block; margin-top: 10px; color: #2196f3; font-size: 12px; font-weight: 700;">Correct Answer: <strong style="color: #1565c0;">' + (item.answer || 'N/A') + '</strong></small>';
      html += '</div>';
    });
    html += '</div></div>';
  } else if (question.question_type === 'procedure') {
    let items = [];
    try { if (question.procedure_items_json) items = JSON.parse(question.procedure_items_json); } catch (e) {}
    html += '<div style="margin-bottom: 20px;">';
    html += '<div style="display: flex; flex-direction: column; gap: 14px;">';
    items.forEach((item, idx) => {
      html += '<div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ff9800;">';
      html += '<label style="display: block; margin-bottom: 12px; font-weight: 600; color: #333; font-size: 14px;">';
      html += '<span style="background: #ff9800; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px;">' + (idx + 1) + '</span>';
      html += (item.text || item) + '</label>';
      html += '<input type="text" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; text-transform: uppercase; font-weight: 600; font-family: \"Courier New\", monospace;" placeholder="Type answer (UPPERCASE LETTERS AND NUMBERS)" value="' + ((currentAnswers[question.id] && currentAnswers[question.id][idx]) || '') + '" onchange="updateProcedureAnswer(' + question.id + ', ' + idx + ', this.value)" oninput="this.value = this.value.toUpperCase()">';
      html += '<small style="display: block; margin-top: 10px; color: #ff9800; font-size: 12px; font-weight: 700;">Correct Answer: <strong style="color: #e65100;">' + (item.answer || 'N/A') + '</strong></small>';
      html += '</div>';
    });
    html += '</div></div>';
  } else if (question.question_type === 'identification') {
    let items = [];
    try { if (question.identification_items_json) items = JSON.parse(question.identification_items_json); } catch (e) {}
    html += '<div style="margin-bottom: 20px;">';
    if (question.identification_image_url) {
      html += '<div style="background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 22px; text-align: center;">';
      html += '<img src="' + question.identification_image_url + '" style="max-width: 100%; max-height: 400px; border-radius: 6px;" alt="Reference image">';
      html += '</div>';
    }
    html += '<div style="display: flex; flex-direction: column; gap: 14px;">';
    items.forEach((item, idx) => {
      html += '<div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4caf50;">';
      html += '<label style="display: block; margin-bottom: 12px; font-weight: 600; color: #333; font-size: 14px;">';
      html += '<span style="background: #4caf50; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px;">' + (idx + 1) + '</span>';
      html += (item.text || item) + '</label>';
      html += '<input type="text" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; text-transform: uppercase; font-weight: 600; font-family: \'Courier New\', monospace;" placeholder="Type answer (UPPERCASE LETTERS AND NUMBERS)" value="' + ((currentAnswers[question.id] && currentAnswers[question.id][idx]) || '') + '" onchange="updateIdentificationAnswer(' + question.id + ', ' + idx + ', this.value)" oninput="this.value = this.value.toUpperCase()">';
      html += '<small style="display: block; margin-top: 10px; color: #4caf50; font-size: 12px; font-weight: 700;">Correct Answer: <strong style="color: #2e7d32;">' + (item.answer || 'N/A') + '</strong></small>';
      html += '</div>';
    });
    html += '</div></div>';
  }
  
  html += '</div>';
  container.innerHTML = html;
  document.getElementById('prevBtn').style.display = currentQuestion > 0 ? 'block' : 'none';
  document.getElementById('nextBtn').style.display = currentQuestion < currentQuestions.length - 1 ? 'block' : 'none';
  document.getElementById('submitBtn').style.display = currentQuestion === currentQuestions.length - 1 ? 'block' : 'none';
}

function selectAnswer(questionId, answer) {
  currentAnswers[questionId] = answer;
}

function updateEnumerationAnswer(questionId, itemIndex, answer) {
  if (!currentAnswers[questionId]) currentAnswers[questionId] = [];
  if (!Array.isArray(currentAnswers[questionId])) currentAnswers[questionId] = [];
  currentAnswers[questionId][itemIndex] = answer.toUpperCase();
}

function updateIdentificationAnswer(questionId, itemIndex, answer) {
  if (!currentAnswers[questionId]) currentAnswers[questionId] = [];
  if (!Array.isArray(currentAnswers[questionId])) currentAnswers[questionId] = [];
  currentAnswers[questionId][itemIndex] = answer.toUpperCase();
}

function updateProcedureAnswer(questionId, itemIndex, answer) {
  if (!currentAnswers[questionId]) currentAnswers[questionId] = [];
  if (!Array.isArray(currentAnswers[questionId])) currentAnswers[questionId] = [];
  currentAnswers[questionId][itemIndex] = answer.toUpperCase();
}

function nextQuestion() {
  if (currentQuestion < currentQuestions.length - 1) {
    currentQuestion++;
    displayQuestion();
  }
}

function previousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    displayQuestion();
  }
}

async function submitExam() {
  let totalScore = 0, totalPoints = 0;
  sectionScores = { multiple_choice: 0, enumeration: 0, procedure: 0, identification: 0 };
  
  currentQuestions.forEach(question => {
    const points = question.points || 1;
    if (question.question_type === 'multiple_choice') {
      totalPoints += points;
      if (currentAnswers[question.id] === question.correct_answer) {
        sectionScores.multiple_choice += points;
        totalScore += points;
      }
    } else if (question.question_type === 'enumeration') {
      const userAnswers = currentAnswers[question.id] || [];
      try {
        let items = [];
        if (question.enumeration_items_json) items = JSON.parse(question.enumeration_items_json);
        items.forEach((item, idx) => {
          const itemPoints = item.points || 1;
          totalPoints += itemPoints;
          if (userAnswers[idx] && userAnswers[idx].toUpperCase().trim() === (item.answer || '').toUpperCase().trim()) {
            sectionScores.enumeration += itemPoints;
            totalScore += itemPoints;
          }
        });
      } catch (e) { totalPoints += points; }
    } else if (question.question_type === 'identification') {
      const userAnswers = currentAnswers[question.id] || [];
      try {
        let items = [];
        if (question.identification_items_json) items = JSON.parse(question.identification_items_json);
        items.forEach((item, idx) => {
          const itemPoints = item.points || 1;
          totalPoints += itemPoints;
          if (userAnswers[idx] && userAnswers[idx].toUpperCase().trim() === (item.answer || '').toUpperCase().trim()) {
            sectionScores.identification += itemPoints;
            totalScore += itemPoints;
          }
        });
      } catch (e) { totalPoints += points; }
    } else if (question.question_type === 'procedure') {
      const userAnswers = currentAnswers[question.id] || [];
      try {
        let items = [];
        if (question.procedure_items_json) items = JSON.parse(question.procedure_items_json);
        items.forEach((item, idx) => {
          const itemPoints = 1;
          totalPoints += itemPoints;
          if (userAnswers[idx] && userAnswers[idx].toUpperCase().trim() === (item.answer || '').toUpperCase().trim()) {
            sectionScores.procedure += itemPoints;
            totalScore += itemPoints;
          }
        });
      } catch (e) { totalPoints += points; }
    }
  });
  
  const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
  const passed = percentage >= 70;

  // Build per-question detail for review
  const questionDetails = [];
  currentQuestions.forEach(question => {
    const qType = question.question_type;
    if (qType === 'multiple_choice') {
      const userAns = currentAnswers[question.id] || '';
      const correct = question.correct_answer || '';
      questionDetails.push({
        question_id: question.id,
        question_type: qType,
        question_text: question.question_text,
        user_answer: userAns,
        correct_answer: correct,
        is_correct: userAns === correct,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        points: question.points || 1
      });
    } else if (qType === 'enumeration') {
      const userAnswers = currentAnswers[question.id] || [];
      try {
        const items = question.enumeration_items_json ? JSON.parse(question.enumeration_items_json) : [];
        items.forEach((item, idx) => {
          const userAns = (userAnswers[idx] || '').toUpperCase().trim();
          const correct = (item.answer || '').toUpperCase().trim();
          questionDetails.push({
            question_id: question.id,
            question_type: qType,
            question_text: (question.enumeration_title || question.question_text) + ' — Item ' + (idx + 1) + ': ' + (item.text || ''),
            user_answer: userAns,
            correct_answer: correct,
            is_correct: userAns === correct,
            points: item.points || 1
          });
        });
      } catch (e) {}
    } else if (qType === 'identification') {
      const userAnswers = currentAnswers[question.id] || [];
      try {
        const items = question.identification_items_json ? JSON.parse(question.identification_items_json) : [];
        items.forEach((item, idx) => {
          const userAns = (userAnswers[idx] || '').toUpperCase().trim();
          const correct = (item.answer || '').toUpperCase().trim();
          questionDetails.push({
            question_id: question.id,
            question_type: qType,
            question_text: (question.identification_title || question.question_text) + ' — Item ' + (idx + 1) + ': ' + (item.text || ''),
            user_answer: userAns,
            correct_answer: correct,
            is_correct: userAns === correct,
            points: item.points || 1
          });
        });
      } catch (e) {}
    } else if (qType === 'procedure') {
      const userAnswers = currentAnswers[question.id] || [];
      try {
        const items = question.procedure_items_json ? JSON.parse(question.procedure_items_json) : [];
        items.forEach((item, idx) => {
          const userAns = (userAnswers[idx] || '').toUpperCase().trim();
          const correct = (item.answer || '').toUpperCase().trim();
          questionDetails.push({
            question_id: question.id,
            question_type: qType,
            question_text: (question.procedure_title || question.question_text) + ' — Step ' + (idx + 1) + ': ' + (item.text || ''),
            user_answer: userAns,
            correct_answer: correct,
            is_correct: userAns === correct,
            points: 1
          });
        });
      } catch (e) {}
    }
  });

  try {
    const response = await fetch(API + '/api/exam-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: selectedEmployeeId,
        exam_id: examId,
        score: Math.round(totalScore * 100) / 100,
        total_points: Math.round(totalPoints * 100) / 100,
        percentage: percentage,
        passed: passed,
        answers: currentAnswers,
        question_details: questionDetails
      })
    });
    const data = await response.json();
    if (data.success) {
      displayResults({ score: Math.round(totalScore * 100) / 100, total_points: Math.round(totalPoints * 100) / 100, percentage, passed });
    }
  } catch (err) {
    console.error('Error submitting exam:', err);
  }
}

function displayResults(results) {
  const scorePercentage = results.percentage;
  const passed = results.passed;
  
  // Calculate total items for each section
  let mcItems = 0;
  let enumItems = 0;
  let procItems = 0;
  let idItems = 0;
  
  currentQuestions.forEach(q => {
    if (q.question_type === 'multiple_choice') {
      mcItems += 1;
    } else if (q.question_type === 'enumeration') {
      try {
        const items = q.enumeration_items_json ? JSON.parse(q.enumeration_items_json) : [];
        enumItems += items.length || 0;
      } catch(e) { enumItems += 0; }
    } else if (q.question_type === 'procedure') {
      try {
        const items = q.procedure_items_json ? JSON.parse(q.procedure_items_json) : [];
        procItems += items.length || 0;
      } catch(e) { procItems += 0; }
    } else if (q.question_type === 'identification') {
      try {
        const items = q.identification_items_json ? JSON.parse(q.identification_items_json) : [];
        idItems += items.length || 0;
      } catch(e) { idItems += 0; }
    }
  });
  
  document.getElementById('questionsContainer').style.display = 'none';
  document.querySelector('.exam-navigation').style.display = 'none';
  
  const resultHeader = document.getElementById('resultHeader');
  resultHeader.innerHTML = passed ? '<h2 style="color: #28a745; margin: 0; font-size: 28px;">Exam Passed!</h2>' : '<h2 style="color: #dc3545; margin: 0; font-size: 28px;">Exam Failed</h2>';
  
  const resultMessage = document.getElementById('resultMessage');
  let resultHtml = '<div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">';
  resultHtml += '<h3 style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Score Breakdown by Section:</h3>';
  
  if (mcItems > 0) {
    resultHtml += '<div style="margin-bottom: 15px; padding: 15px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196f3;">';
    resultHtml += '<div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; color: #1565c0;">Multiple Choice ' + mcItems + ' Items</span><span style="font-size: 18px; font-weight: 700; color: #2196f3;">' + sectionScores.multiple_choice + '/' + sectionTotals.multiple_choice + '</span></div>';
    resultHtml += '</div>';
  }
  
  if (enumItems > 0) {
    resultHtml += '<div style="margin-bottom: 15px; padding: 15px; background: #f3e5f5; border-radius: 6px; border-left: 4px solid #9c27b0;">';
    resultHtml += '<div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; color: #6a1b9a;">Enumeration ' + enumItems + ' Items</span><span style="font-size: 18px; font-weight: 700; color: #9c27b0;">' + sectionScores.enumeration + '/' + sectionTotals.enumeration + '</span></div>';
    resultHtml += '</div>';
  }
  
  if (procItems > 0) {
    resultHtml += '<div style="margin-bottom: 15px; padding: 15px; background: #fff3e0; border-radius: 6px; border-left: 4px solid #ff9800;">';
    resultHtml += '<div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; color: #e65100;">Procedure Details ' + procItems + ' Items</span><span style="font-size: 18px; font-weight: 700; color: #ff9800;">' + sectionScores.procedure + '/' + sectionTotals.procedure + '</span></div>';
    resultHtml += '</div>';
  }
  
  if (idItems > 0) {
    resultHtml += '<div style="margin-bottom: 15px; padding: 15px; background: #e0f2f1; border-radius: 6px; border-left: 4px solid #009688;">';
    resultHtml += '<div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 600; color: #00695c;">Identification ' + idItems + ' Items</span><span style="font-size: 18px; font-weight: 700; color: #009688;">' + sectionScores.identification + '/' + sectionTotals.identification + '</span></div>';
    resultHtml += '</div>';
  }
  
  resultHtml += '<div style="margin-top: 20px; padding: 20px; background: ' + (passed ? '#e8f5e9' : '#ffebee') + '; border-radius: 8px; border: 2px solid ' + (passed ? '#4caf50' : '#f44336') + ';">';
  resultHtml += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><span style="font-weight: 700; color: #333; font-size: 14px;">OVERALL TOTAL:</span><span style="font-size: 24px; font-weight: 700; color: ' + (passed ? '#4caf50' : '#f44336') + ';">' + results.score + '/' + results.total_points + '</span></div>';
  resultHtml += '<div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-weight: 700; color: #333; font-size: 14px;">PERCENTAGE:</span><span style="font-size: 24px; font-weight: 700; color: ' + (passed ? '#4caf50' : '#f44336') + ';">' + scorePercentage + '%</span></div>';
  resultHtml += '</div></div>';
  resultMessage.innerHTML = resultHtml;
  
  document.getElementById('resultModal').style.display = 'flex';
}

function retakeExam() {
  currentQuestion = 0;
  currentAnswers = {};
  examStarted = false;
  sectionScores = { multiple_choice: 0, enumeration: 0, procedure: 0, identification: 0 };
  document.getElementById('resultModal').style.display = 'none';
  document.getElementById('questionsContainer').style.display = 'block';
  document.querySelector('.exam-navigation').style.display = 'flex';
  document.getElementById('employeeSelectionModal').style.display = 'flex';
}

function goBack() {
  window.history.back();
}

function showPrioritySettings() {
  document.getElementById('prioritySettingsModal').style.display = 'flex';
}

function closePrioritySettings() {
  document.getElementById('prioritySettingsModal').style.display = 'none';
}


function generateExamResultsHTML() {
  const totalScore = sectionScores.multiple_choice + sectionScores.enumeration + sectionScores.procedure + sectionScores.identification;
  const totalPoints = sectionTotals.multiple_choice + sectionTotals.enumeration + sectionTotals.procedure + sectionTotals.identification;
  const scorePercentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
  const passed = scorePercentage >= 70;
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const passColor = passed ? '#28a745' : '#dc3545';
  const passBg = passed ? '#e8f5e9' : '#ffebee';
  const passText = passed ? 'PASSED' : 'FAILED';
  
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exam Results</title><style>' +
    '* { margin: 0; padding: 0; box-sizing: border-box; }' +
    'body { font-family: Arial, sans-serif; padding: 0.5in; font-size: 11px; color: #000; background: white; }' +
    '.container { width: 100%; max-width: 8.5in; margin: 0 auto; }' +
    '.header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #000; }' +
    '.logo { height: 50px; margin-bottom: 10px; }' +
    '.title-box { border: 2px solid #000; padding: 10px; margin-bottom: 20px; text-align: center; }' +
    '.title-box h1 { font-size: 16px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0; }' +
    '.info-box { border: 2px solid #000; padding: 12px; margin-bottom: 20px; }' +
    '.info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 10px; }' +
    '.info-row:last-child { margin-bottom: 0; }' +
    '.info-field { display: flex; justify-content: space-between; font-size: 10px; }' +
    '.info-label { font-weight: 700; }' +
    '.info-value { font-weight: 600; }' +
    '.results-box { border: 3px solid ' + passColor + '; background: ' + passBg + '; padding: 20px; margin-bottom: 20px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.results-box h2 { font-size: 24px; font-weight: 900; color: ' + passColor + '; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 2px; }' +
    '.results-box .score { font-size: 12px; font-weight: 700; margin-bottom: 8px; }' +
    '.results-box .percentage { font-size: 32px; font-weight: 900; color: ' + passColor + '; }' +
    '.breakdown-box { border: 2px solid #000; padding: 12px; margin-bottom: 20px; }' +
    '.breakdown-title { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }' +
    '.breakdown-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 10px; border-bottom: 1px solid #ddd; }' +
    '.breakdown-row:last-child { border-bottom: none; }' +
    '.breakdown-row:nth-child(even) { background: #f5f5f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.breakdown-label { font-weight: 600; }' +
    '.breakdown-value { font-weight: 700; color: ' + passColor + '; }' +
    '.footer { font-size: 8px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; }' +
    '.footer-text { margin: 3px 0; }' +
    '@media print { body { margin: 0; padding: 0; } .container { max-width: 100%; } }' +
    '</style></head><body>' +
    '<div class="container">' +
    '<div class="header"><div class="logo-section"><img src="/images/NSB-LOGO.png" alt="NSB Logo" /></div></div>' +
    '</div>' +
    '<div class="title-box"><h1>EXAM RESULTS</h1></div>' +
    '<div class="info-box">' +
    '<div class="info-row">' +
    '<div class="info-field"><span class="info-label">Employee Name:</span><span class="info-value">' + selectedEmployeeName + '</span></div>' +
    '<div class="info-field"><span class="info-label">Exam Date:</span><span class="info-value">' + currentDate + '</span></div>' +
    '</div>' +
    '<div class="info-row">' +
    '<div class="info-field"><span class="info-label">Course/Exam:</span><span class="info-value">' + (examTitle || 'N/A') + '</span></div>' +
    '<div class="info-field"><span class="info-label">Passing Score:</span><span class="info-value">70%</span></div>' +
    '</div>' +
    '</div>' +
    '<div class="results-box">' +
    '<h2>' + passText + '</h2>' +
    '<div class="score">Score: ' + totalScore + ' / ' + totalPoints + '</div>' +
    '<div class="percentage">' + scorePercentage + '%</div>' +
    '</div>' +
    '<div class="breakdown-box">' +
    '<div class="breakdown-title">SCORE BREAKDOWN</div>';
  
  if (sectionTotals.multiple_choice > 0) {
    html += '<div class="breakdown-row"><span class="breakdown-label">Multiple Choice</span><span class="breakdown-value">' + sectionScores.multiple_choice + ' / ' + sectionTotals.multiple_choice + '</span></div>';
  }
  if (sectionTotals.enumeration > 0) {
    html += '<div class="breakdown-row"><span class="breakdown-label">Enumeration</span><span class="breakdown-value">' + sectionScores.enumeration + ' / ' + sectionTotals.enumeration + '</span></div>';
  }
  if (sectionTotals.procedure > 0) {
    html += '<div class="breakdown-row"><span class="breakdown-label">Procedure</span><span class="breakdown-value">' + sectionScores.procedure + ' / ' + sectionTotals.procedure + '</span></div>';
  }
  if (sectionTotals.identification > 0) {
    html += '<div class="breakdown-row"><span class="breakdown-label">Identification</span><span class="breakdown-value">' + sectionScores.identification + ' / ' + sectionTotals.identification + '</span></div>';
  }
  
  html += '</div>' +
    '<div class="footer">' +
    '<div class="footer-text"><strong>Document ID:</strong> F-EXAM-' + examId + '-' + new Date().getTime() + '</div>' +
    '<div class="footer-text">Generated on: ' + currentDate + '</div>' +
    '</div>' +
    '</div></body></html>';
  
  return html;
}

function printExamResults() {
  const printWindow = window.open('', '', 'height=800,width=1000');
  
  if (!printWindow) {
    alert('Please allow popups to print the exam results.');
    return;
  }
  
  const totalScore = sectionScores.multiple_choice + sectionScores.enumeration + sectionScores.procedure + sectionScores.identification;
  const totalPoints = sectionTotals.multiple_choice + sectionTotals.enumeration + sectionTotals.procedure + sectionTotals.identification;
  const scorePercentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
  const passed = scorePercentage >= 70;
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Generate filename with employee last name and exam ID
  const lastName = selectedEmployeeLastName || 'Employee';
  const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '_');
  const examIdForFilename = examId || 'exam';
  const filename = `${sanitizedLastName}_${examIdForFilename}_ExamResult.pdf`;
  
  const passColor = passed ? '#28a745' : '#dc3545';
  const passBg = passed ? '#e8f5e9' : '#ffebee';
  const passText = passed ? 'PASSED' : 'FAILED';
  
  let html = '<!DOCTYPE html><html><head><title>Exam Results</title><style>' +
    '* { margin: 0; padding: 0; box-sizing: border-box; }' +
    'body { font-family: Arial, sans-serif; padding: 0.4in 0.3in; font-size: 10px; color: #000; }' +
    '.container { width: 100%; position: relative; }' +
    '.header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #000; }' +
    '.logo-section { display: flex; align-items: center; justify-content: center; gap: 15px; }' +
    '.logo-section img { height: 45px; width: auto; }' +
    '.title { text-align: center; font-size: 14px; font-weight: 700; margin: 0 0 15px 0; border: 2px solid #000; padding: 6px; letter-spacing: 2px; text-transform: uppercase; }' +
    '.exam-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; padding: 8px; border: 1px solid #000; border-top: none; font-size: 9px; }' +
    '.info-field { display: block; line-height: 1.4; }' +
    '.info-field label { font-weight: 700; font-size: 8px; display: block; margin-bottom: 2px; }' +
    '.info-field span { font-weight: 600; font-size: 9px; display: block; }' +
    '.results-wrapper { position: relative; margin: 15px 0; }' +
    '.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 80px; font-weight: 900; color: ' + passColor + '; opacity: 0.15; z-index: 0; text-transform: uppercase; pointer-events: none; white-space: nowrap; }' +
    '.results-box { position: relative; z-index: 1; text-align: center; padding: 20px; border: 3px solid ' + passColor + '; background: ' + passBg + '; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.results-box h2 { font-size: 18px; margin-bottom: 10px; color: ' + passColor + '; text-transform: uppercase; letter-spacing: 1px; }' +
    '.results-box .score { font-size: 14px; font-weight: 700; margin-bottom: 5px; }' +
    '.results-box .percentage { font-size: 24px; font-weight: 700; color: ' + passColor + '; }' +
    '.section-scores { margin-top: 15px; padding: 10px; border: 1px solid #000; }' +
    '.section-scores h3 { font-size: 10px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 5px; }' +
    '.section-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 9px; }' +
    '.section-row:nth-child(even) { background: #f5f5f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.footer { font-size: 7px; text-align: left; margin-top: 15px; color: #666; }' +
    '@media print { body { margin: 0; } }' +
    '</style></head><body>' +
    '<div class="container">' +
    '<div class="header"><div class="logo-section"><img src="/images/NSB-LOGO.png" alt="NSB Logo" /></div></div>' +
    '<div class="title">EXAM RESULTS</div>' +
    '<div class="exam-info">' +
    '<div class="info-field"><label>Employee Name:</label><span>' + selectedEmployeeName + '</span></div>' +
    '<div class="info-field"><label>Exam Date:</label><span>' + currentDate + '</span></div>' +
    '<div class="info-field"><label>Course/Exam:</label><span>' + (examTitle || 'N/A') + '</span></div>' +
    '<div class="info-field"><label>Passing Score:</label><span>70%</span></div>' +
    '</div>' +
    '<div class="results-wrapper">' +
    '<div class="watermark">' + passText + '</div>' +
    '<div class="results-box">' +
    '<h2>' + passText + '</h2>' +
    '<div class="score">Score: ' + totalScore + ' / ' + totalPoints + '</div>' +
    '<div class="percentage">' + scorePercentage + '%</div>' +
    '</div>' +
    '</div>' +
    '<div class="section-scores">' +
    '<h3>Score Breakdown</h3>';
  
  if (sectionTotals.multiple_choice > 0) {
    html += '<div class="section-row"><span>Multiple Choice</span><span>' + sectionScores.multiple_choice + ' / ' + sectionTotals.multiple_choice + '</span></div>';
  }
  if (sectionTotals.enumeration > 0) {
    html += '<div class="section-row"><span>Enumeration</span><span>' + sectionScores.enumeration + ' / ' + sectionTotals.enumeration + '</span></div>';
  }
  if (sectionTotals.procedure > 0) {
    html += '<div class="section-row"><span>Procedure</span><span>' + sectionScores.procedure + ' / ' + sectionTotals.procedure + '</span></div>';
  }
  if (sectionTotals.identification > 0) {
    html += '<div class="section-row"><span>Identification</span><span>' + sectionScores.identification + ' / ' + sectionTotals.identification + '</span></div>';
  }
  
  html += '</div>' +
    '<div class="footer">F-EXAM-001/EFF: ' + currentDate + '</div>' +
    '</div></body></html>';
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Trigger print after window loads
  printWindow.onload = function() {
    printWindow.focus();
    printWindow.print();
  };
}

async function saveResultsAsPDF() {
  try {
    console.log('💾 Saving exam results as PDF...');

    const totalScore = sectionScores.multiple_choice + sectionScores.enumeration + sectionScores.procedure + sectionScores.identification;
    const totalPoints = sectionTotals.multiple_choice + sectionTotals.enumeration + sectionTotals.procedure + sectionTotals.identification;
    const scorePercentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    const passed = scorePercentage >= 70;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const lastName = selectedEmployeeLastName || 'Employee';
    const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '_');
    const examIdForFilename = examId || 'exam';
    const filename = `${sanitizedLastName}_${examIdForFilename}_ExamResult.pdf`;

    const passColor = passed ? '#28a745' : '#dc3545';
    const passBg = passed ? '#e8f5e9' : '#ffebee';
    const passText = passed ? 'PASSED' : 'FAILED';

    // Load logo as base64 for PDF embedding
    const logoBase64 = await getLogoAsBase64();
    const logoSrc = logoBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exam Results</title><style>' +
      '* { margin: 0; padding: 0; box-sizing: border-box; }' +
      'body { font-family: Arial, sans-serif; padding: 0.5in; font-size: 11px; color: #000; background: white; }' +
      '.container { width: 100%; max-width: 8.5in; margin: 0 auto; }' +
      '.header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #000; }' +
      '.logo { height: 50px; margin-bottom: 10px; }' +
      '.title-box { border: 2px solid #000; padding: 10px; margin-bottom: 20px; text-align: center; }' +
      '.title-box h1 { font-size: 16px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0; }' +
      '.info-box { border: 2px solid #000; padding: 12px; margin-bottom: 20px; }' +
      '.info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 10px; }' +
      '.info-row:last-child { margin-bottom: 0; }' +
      '.info-field { display: flex; justify-content: space-between; font-size: 10px; }' +
      '.info-label { font-weight: 700; }' +
      '.info-value { font-weight: 600; }' +
      '.results-box { border: 3px solid ' + passColor + '; background: ' + passBg + '; padding: 20px; margin-bottom: 20px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      '.results-box h2 { font-size: 24px; font-weight: 900; color: ' + passColor + '; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 2px; }' +
      '.results-box .score { font-size: 12px; font-weight: 700; margin-bottom: 8px; }' +
      '.results-box .percentage { font-size: 32px; font-weight: 900; color: ' + passColor + '; }' +
      '.breakdown-box { border: 2px solid #000; padding: 12px; margin-bottom: 20px; }' +
      '.breakdown-title { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }' +
      '.breakdown-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 10px; border-bottom: 1px solid #ddd; }' +
      '.breakdown-row:last-child { border-bottom: none; }' +
      '.breakdown-row:nth-child(even) { background: #f5f5f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      '.breakdown-label { font-weight: 600; }' +
      '.breakdown-value { font-weight: 700; color: ' + passColor + '; }' +
      '.footer { font-size: 8px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; }' +
      '.footer-text { margin: 3px 0; }' +
      '@media print { body { margin: 0; padding: 0; } .container { max-width: 100%; } }' +
      '</style></head><body>' +
      '<div class="container">' +
      '<div class="header"><img src="' + logoSrc + '" alt="NSB Logo" class="logo" /></div>' +
      '<div class="title-box"><h1>EXAM RESULTS</h1></div>' +
      '<div class="info-box">' +
      '<div class="info-row">' +
      '<div class="info-field"><span class="info-label">Employee Name:</span><span class="info-value">' + selectedEmployeeName + '</span></div>' +
      '<div class="info-field"><span class="info-label">Exam Date:</span><span class="info-value">' + currentDate + '</span></div>' +
      '</div>' +
      '<div class="info-row">' +
      '<div class="info-field"><span class="info-label">Course/Exam:</span><span class="info-value">' + (examTitle || 'N/A') + '</span></div>' +
      '<div class="info-field"><span class="info-label">Passing Score:</span><span class="info-value">70%</span></div>' +
      '</div>' +
      '</div>' +
      '<div class="results-box">' +
      '<h2>' + passText + '</h2>' +
      '<div class="score">Score: ' + totalScore + ' / ' + totalPoints + '</div>' +
      '<div class="percentage">' + scorePercentage + '%</div>' +
      '</div>' +
      '<div class="breakdown-box">' +
      '<div class="breakdown-title">SCORE BREAKDOWN</div>';

    if (sectionTotals.multiple_choice > 0) {
      htmlContent += '<div class="breakdown-row"><span class="breakdown-label">Multiple Choice</span><span class="breakdown-value">' + sectionScores.multiple_choice + ' / ' + sectionTotals.multiple_choice + '</span></div>';
    }
    if (sectionTotals.enumeration > 0) {
      htmlContent += '<div class="breakdown-row"><span class="breakdown-label">Enumeration</span><span class="breakdown-value">' + sectionScores.enumeration + ' / ' + sectionTotals.enumeration + '</span></div>';
    }
    if (sectionTotals.procedure > 0) {
      htmlContent += '<div class="breakdown-row"><span class="breakdown-label">Procedure</span><span class="breakdown-value">' + sectionScores.procedure + ' / ' + sectionTotals.procedure + '</span></div>';
    }
    if (sectionTotals.identification > 0) {
      htmlContent += '<div class="breakdown-row"><span class="breakdown-label">Identification</span><span class="breakdown-value">' + sectionScores.identification + ' / ' + sectionTotals.identification + '</span></div>';
    }

    htmlContent += '</div>' +
      '<div class="footer">' +
      '<div class="footer-text"><strong>Document ID:</strong> F-EXAM-' + examId + '-' + new Date().getTime() + '</div>' +
      '<div class="footer-text">Generated on: ' + currentDate + '</div>' +
      '</div>' +
      '</div></body></html>';

    uploadExamResultPDF(htmlContent, filename);

  } catch (err) {
    console.error('❌ Error saving PDF:', err);
    alert('Error saving PDF: ' + err.message);
  }
}

async function uploadExamResultPDF(htmlContent, filename) {
  try {
    console.log('📤 Uploading exam result PDF to server...');
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const formData = new FormData();
    formData.append('file', blob, filename.replace('.pdf', '.html'));
    formData.append('employee_id', selectedEmployeeId);
    formData.append('course_title', examTitle || 'Exam');
    formData.append('document_type', 'W/EXAM');
    formData.append('file_type', 'exam');
    formData.append('upload_path', 'uploads/tests/EXAM');
    
    const response = await fetch(API + '/api/tests/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ PDF uploaded successfully');
      console.log('📎 File URL:', data.file_url);
      updateTrainingRecordWithExamURL(data.file_url);
      alert('✅ Exam results saved successfully!\n\nFile: ' + filename);
    } else {
      console.error('❌ Upload failed:', data.message);
      alert('Failed to upload PDF: ' + data.message);
    }
  } catch (err) {
    console.error('❌ Error uploading PDF:', err);
    alert('Error uploading PDF: ' + err.message);
  }
}

async function updateTrainingRecordWithExamURL(fileUrl) {
  try {
    console.log('🔄 Updating training record with exam URL...');
    
    const trainingId = sessionStorage.getItem('examTrainingId');
    
    if (!trainingId) {
      console.warn('⚠️ No training ID found in sessionStorage');
      return;
    }
    
    // Mark that exam was completed
    sessionStorage.setItem('completedAssessmentType', 'exam');
    sessionStorage.setItem('completedTrainingId', trainingId);
    
    const response = await fetch(API + '/api/trainings/' + trainingId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_form_url: fileUrl
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Training record updated with exam URL');
    } else {
      console.warn('⚠️ Failed to update training record:', data.message);
    }
  } catch (err) {
    console.error('❌ Error updating training record:', err);
  }
}
