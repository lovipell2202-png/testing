// Course-Specific Exam Management - Updated for Optimized Schema
const API = '';
let currentEmployees = [];
let currentQuestions = [];
let currentAnswers = {};
let currentQuestion = 0;
let examStarted = false;
let allExams = [];
let currentCourseId = null;
let examData = {
  employeeName: '',
  employeeId: '',
  departmentPosition: '',
  courseTitle: COURSE_TITLE,
  startTime: null,
  endTime: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Course Exam page loaded:', COURSE_TITLE);
  loadEmployees();
  loadCourseIdAndExams();
  setupEmployeeSearch();
  
  const savedName = sessionStorage.getItem('examEmployeeName');
  const savedId = sessionStorage.getItem('examEmployeeId');
  const savedDept = sessionStorage.getItem('examDepartmentPosition');
  
  if (savedName && savedId && savedDept) {
    document.getElementById('employeeName').value = savedName;
    document.getElementById('employeeId').value = savedId;
    document.getElementById('departmentPosition').value = savedDept;
    console.log('✅ Loaded employee info from session');
  }
});

// Load employees
async function loadEmployees() {
  try {
    const response = await fetch(`${API}/api/employees`);
    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      currentEmployees = data.data;
      console.log('✅ Loaded employees:', currentEmployees.length);
    } else {
      console.error('Failed to load employees:', data);
    }
  } catch (err) {
    console.error('Error loading employees:', err);
  }
}

// Load course ID and exams (NEW SCHEMA)
async function loadCourseIdAndExams() {
  try {
    // Get all courses to find the current course ID
    const coursesResponse = await fetch(`${API}/api/courses`);
    const coursesData = await coursesResponse.json();
    
    if (coursesData.success && Array.isArray(coursesData.data)) {
      const course = coursesData.data.find(c => c.course_title === COURSE_TITLE);
      if (course) {
        currentCourseId = course.id;
        console.log('✅ Found course ID:', currentCourseId, 'for', COURSE_TITLE);
        
        // Load exams for this course
        loadAllExams();
      } else {
        console.warn('Course not found:', COURSE_TITLE);
      }
    }
  } catch (err) {
    console.error('Error loading course:', err);
  }
}

// Load all exams for this course (NEW SCHEMA)
async function loadAllExams() {
  try {
    if (!currentCourseId) {
      console.warn('Course ID not set yet');
      return;
    }
    
    const response = await fetch(`${API}/api/exams?course_id=${currentCourseId}`);
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      allExams = result.data;
      renderExamsList();
      console.log('✅ Loaded exams for course:', allExams.length);
    } else {
      console.error('Failed to load exams:', result);
    }
  } catch (err) {
    console.error('Error loading exams:', err);
  }
}

// Render exams list in sidebar
function renderExamsList() {
  const examsList = document.getElementById('availableExamsList');
  if (!examsList) return;
  
  if (allExams.length === 0) {
    examsList.innerHTML = '<p style="color: #999; padding: 10px;">No exams available</p>';
    return;
  }
  
  examsList.innerHTML = allExams.map(exam => `
    <div style="background: #f9f9f9; padding: 10px; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #007bff;">
      <div style="font-weight: bold; margin-bottom: 5px;">${exam.title}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
        Questions: ${exam.total_questions} | Pass: ${exam.passing_score}%
      </div>
      <div style="display: flex; gap: 5px;">
        <button class="btn-small" onclick="takeExamFromSidebar(${exam.id})" style="flex: 1; padding: 5px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Take</button>
        <button class="btn-small" onclick="viewExamFromSidebar(${exam.id})" style="flex: 1; padding: 5px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">View</button>
        <button class="btn-small" onclick="editExamFromSidebar(${exam.id})" style="flex: 1; padding: 5px; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Edit</button>
        <button class="btn-small" onclick="deleteExamFromSidebar(${exam.id})" style="flex: 1; padding: 5px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Delete</button>
      </div>
    </div>
  `).join('');
}

// Setup employee search
function setupEmployeeSearch() {
  const searchInput = document.getElementById('employeeName');
  const dropdown = document.getElementById('employeeSearchResults');
  
  if (!searchInput || !dropdown) return;

  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    if (!searchTerm) {
      dropdown.style.display = 'none';
      return;
    }

    const filtered = currentEmployees.filter(emp => 
      emp.full_name.toLowerCase().includes(searchTerm) ||
      emp.employee_no.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
      dropdown.innerHTML = '<div style="padding: 10px; color: #999;">No employees found</div>';
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = filtered.map(emp => `
      <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;" 
           onmouseover="this.style.background='#f5f5f5'" 
           onmouseout="this.style.background='white'"
           onclick="selectEmployee(${emp.id}, '${emp.full_name.replace(/'/g, "\\'")}', '${emp.employee_no}', '${(emp.department || '') + ' - ' + (emp.position || '')}')">
        <strong>${emp.full_name}</strong><br>
        <small style="color: #666;">${emp.employee_no} | ${emp.department || 'N/A'}</small>
      </div>
    `).join('');

    dropdown.style.display = 'block';
  });

  document.addEventListener('click', function(event) {
    if (event.target !== searchInput && event.target.id !== 'employeeSearchResults') {
      dropdown.style.display = 'none';
    }
  });
}

// Select employee
function selectEmployee(id, name, empNo, deptPos) {
  document.getElementById('employeeName').value = name;
  document.getElementById('employeeId').value = empNo;
  document.getElementById('departmentPosition').value = deptPos;
  document.getElementById('employeeSearchResults').style.display = 'none';
  
  sessionStorage.setItem('examEmployeeName', name);
  sessionStorage.setItem('examEmployeeId', empNo);
  sessionStorage.setItem('examDepartmentPosition', deptPos);
  
  console.log('✅ Employee selected:', name);
}

// Take exam from sidebar
async function takeExamFromSidebar(examId) {
  const employeeName = document.getElementById('employeeName').value.trim();
  const employeeId = document.getElementById('employeeId').value.trim();
  
  if (!employeeName || !employeeId) {
    alert('Please select an employee first');
    return;
  }
  
  try {
    const response = await fetch(`${API}/api/exams/${examId}`);
    const result = await response.json();
    
    if (result.success) {
      currentQuestions = result.questions;
      currentQuestion = 0;
      currentAnswers = {};
      examStarted = true;
      
      examData.employeeName = employeeName;
      examData.employeeId = employeeId;
      examData.departmentPosition = document.getElementById('departmentPosition').value;
      examData.startTime = new Date();
      
      document.getElementById('examSetup').style.display = 'none';
      document.getElementById('examContainer').style.display = 'block';
      
      displayQuestion();
      console.log('✅ Exam started with', currentQuestions.length, 'questions');
    }
  } catch (err) {
    console.error('Error loading exam:', err);
    alert('Error loading exam');
  }
}

// View exam from sidebar
async function viewExamFromSidebar(examId) {
  try {
    const response = await fetch(`${API}/api/exams/${examId}`);
    const result = await response.json();
    
    if (result.success) {
      const exam = result.exam;
      const questions = result.questions;
      
      const modal = document.getElementById('examViewerModal');
      if (!modal) {
        alert('Exam viewer not available');
        return;
      }
      
      const content = document.getElementById('examViewerContent');
      content.innerHTML = `
        <h3>${exam.title}</h3>
        <p><strong>Course:</strong> ${exam.course_title}</p>
        <p><strong>Questions:</strong> ${questions.length}</p>
        <p><strong>Passing Score:</strong> ${exam.passing_score}%</p>
        
        <div style="margin-top: 20px; max-height: 400px; overflow-y: auto;">
          <h4>Questions:</h4>
          ${questions.map((q, idx) => `
            <div style="background: #f9f9f9; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
              <strong>${idx + 1}. ${q.question_text}</strong>
              <div style="margin-top: 8px; font-size: 14px;">
                A) ${q.option_a}<br>
                B) ${q.option_b}<br>
                C) ${q.option_c}<br>
                D) ${q.option_d}<br>
                <strong style="color: green;">Answer: ${q.correct_answer}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      modal.style.display = 'block';
    }
  } catch (err) {
    console.error('Error viewing exam:', err);
    alert('Error loading exam');
  }
}

// Edit exam from sidebar
async function editExamFromSidebar(examId) {
  alert('Edit functionality coming soon');
}

// Delete exam from sidebar
async function deleteExamFromSidebar(examId) {
  if (!confirm('Are you sure you want to delete this exam?')) return;
  
  try {
    const response = await fetch(`${API}/api/exams/${examId}`, { method: 'DELETE' });
    const result = await response.json();
    
    if (result.success) {
      alert('✅ Exam deleted!');
      loadAllExams();
    } else {
      alert('Error deleting exam');
    }
  } catch (err) {
    console.error('Error deleting exam:', err);
    alert('Error deleting exam');
  }
}

// Display current question
function displayQuestion() {
  if (currentQuestion >= currentQuestions.length) {
    submitExam();
    return;
  }
  
  const q = currentQuestions[currentQuestion];
  const container = document.getElementById('examContent');
  
  // Update progress
  document.getElementById('examProgress').textContent = `Question ${currentQuestion + 1} of ${currentQuestions.length}`;
  
  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 20px;">
        <span style="color: #666;">Question ${currentQuestion + 1} of ${currentQuestions.length}</span>
        <div style="width: 100%; height: 8px; background: #eee; border-radius: 4px; margin-top: 10px;">
          <div style="width: ${((currentQuestion + 1) / currentQuestions.length) * 100}%; height: 100%; background: #007bff; border-radius: 4px;"></div>
        </div>
      </div>
      
      <h3 style="margin: 0 0 20px 0;">${q.question_text}</h3>
      
      <div style="margin-bottom: 20px;">
        ${['A', 'B', 'C', 'D'].map(opt => `
          <label style="display: block; padding: 12px; margin-bottom: 10px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s; ${currentAnswers[currentQuestion] === opt ? 'background: #e7f3ff; border-color: #007bff;' : ''}">
            <input type="radio" name="answer" value="${opt}" ${currentAnswers[currentQuestion] === opt ? 'checked' : ''} onchange="currentAnswers[${currentQuestion}] = '${opt}'">
            <strong>${opt})</strong> ${q['option_' + opt.toLowerCase()]}
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

// Next question
function nextQuestion() {
  if (currentQuestion < currentQuestions.length - 1) {
    currentQuestion++;
    displayQuestion();
  }
}

// Previous question
function previousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    displayQuestion();
  }
}

// Submit exam
async function submitExam() {
  examData.endTime = new Date();
  
  let score = 0;
  currentQuestions.forEach((q, idx) => {
    if (currentAnswers[idx] === q.correct_answer) {
      score++;
    }
  });
  
  const percentage = Math.round((score / currentQuestions.length) * 100);
  const passed = percentage >= 70;
  
  try {
    // Save exam result to database
    const response = await fetch(`${API}/api/exam-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: currentEmployees.find(e => e.employee_no === examData.employeeId)?.id || 0,
        exam_id: allExams[0]?.id || 0,
        score: score,
        total_points: currentQuestions.length,
        percentage: percentage,
        passed: passed ? 1 : 0,
        answers: currentAnswers
      })
    });
    
    const result = await response.json();
    console.log('Exam result saved:', result);
  } catch (err) {
    console.error('Error saving exam result:', err);
  }
  
  // Display results
  const resultsHtml = `
    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
      <h2 style="margin: 0 0 20px 0; color: ${passed ? '#28a745' : '#dc3545'};">
        ${passed ? '✅ PASSED' : '❌ FAILED'}
      </h2>
      
      <div style="font-size: 48px; font-weight: bold; color: #007bff; margin-bottom: 20px;">
        ${percentage}%
      </div>
      
      <div style="font-size: 18px; margin-bottom: 30px;">
        <p>Score: <strong>${score} out of ${currentQuestions.length}</strong></p>
        <p>Passing Score: <strong>70%</strong></p>
      </div>
      
      <button onclick="location.reload()" style="padding: 12px 30px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Take Another Exam</button>
      <button onclick="printResults()" style="padding: 12px 30px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">Print Results</button>
    </div>
  `;
  
  document.getElementById('examContent').innerHTML = resultsHtml;
}

// Print results
function printResults() {
  window.print();
}


// Start exam function
function startExam() {
  const employeeName = document.getElementById('employeeName').value.trim();
  const employeeId = document.getElementById('employeeId').value.trim();
  const departmentPosition = document.getElementById('departmentPosition').value.trim();
  
  if (!employeeName || !employeeId || !departmentPosition) {
    alert('Please select an employee first');
    return;
  }
  
  if (allExams.length === 0) {
    alert('No exams available for this course');
    return;
  }
  
  // Save employee info to session
  sessionStorage.setItem('examEmployeeName', employeeName);
  sessionStorage.setItem('examEmployeeId', employeeId);
  sessionStorage.setItem('examDepartmentPosition', departmentPosition);
  
  // Set exam data
  examData.employeeName = employeeName;
  examData.employeeId = employeeId;
  examData.departmentPosition = departmentPosition;
  examData.startTime = new Date();
  
  // Load first exam
  const exam = allExams[0];
  currentQuestions = exam.questions || [];
  currentQuestion = 0;
  currentAnswers = {};
  examStarted = true;
  
  // Hide employee selection, show exam
  document.getElementById('employeeSelection').style.display = 'none';
  document.getElementById('examContainer').style.display = 'block';
  
  // Display first question
  displayQuestion();
}


// Cancel exam
function cancelExam() {
  if (confirm('Are you sure you want to cancel this exam?')) {
    location.reload();
  }
}

// Print exam
function printExam() {
  const printContent = document.getElementById('printContent');
  let html = `
    <h2>${examData.courseTitle}</h2>
    <p><strong>Employee:</strong> ${examData.employeeName}</p>
    <p><strong>Employee ID:</strong> ${examData.employeeId}</p>
    <p><strong>Department/Position:</strong> ${examData.departmentPosition}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <hr>
  `;
  
  currentQuestions.forEach((q, idx) => {
    html += `
      <div style="page-break-inside: avoid; margin-bottom: 30px;">
        <h4>Question ${idx + 1}</h4>
        <p><strong>${q.question_text}</strong></p>
        <ul style="list-style: none; padding: 0;">
          <li>A) ${q.option_a}</li>
          <li>B) ${q.option_b}</li>
          <li>C) ${q.option_c}</li>
          <li>D) ${q.option_d}</li>
        </ul>
        <p style="margin-top: 10px; color: #666;"><em>Your answer: ${currentAnswers[idx] || 'Not answered'}</em></p>
      </div>
    `;
  });
  
  printContent.innerHTML = html;
  document.getElementById('printPreview').style.display = 'block';
}

// Close print preview
function closePrintPreview() {
  document.getElementById('printPreview').style.display = 'none';
}
