// Exam Form Management - Updated for Optimized Schema
const API = '';
let currentCourses = [];
let currentEmployees = [];
let currentQuestions = [];
let currentAnswers = {};
let currentQuestion = 0;
let examStarted = false;
let selectedCourseId = null;
let examData = {
  employeeName: '',
  employeeId: '',
  departmentPosition: '',
  courseTitle: '',
  startTime: null,
  endTime: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Exam Form page loaded');
  loadEmployees();
  loadCourses();
  setupEmployeeSearch();
  setupCourseSearch();
});

// Load all employees
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

// Setup employee search
function setupEmployeeSearch() {
  const employeeInput = document.getElementById('employeeName');
  if (!employeeInput) return;

  employeeInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    const resultsDiv = document.getElementById('employeeSearchResults');
    
    if (!searchTerm) {
      resultsDiv.style.display = 'none';
      return;
    }

    const filtered = currentEmployees.filter(emp => 
      emp.full_name.toLowerCase().includes(searchTerm) ||
      emp.employee_no.toString().includes(searchTerm)
    );

    if (filtered.length === 0) {
      resultsDiv.style.display = 'none';
      return;
    }

    resultsDiv.innerHTML = filtered.map(emp => `
      <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; hover: background: #f5f5f5;" 
           onclick="selectEmployee('${emp.full_name}', '${emp.employee_no}', '${emp.department}', '${emp.position}')">
        <strong>${emp.full_name}</strong> (ID: ${emp.employee_no})<br>
        <small style="color: #666;">${emp.department} - ${emp.position}</small>
      </div>
    `).join('');

    resultsDiv.style.display = 'block';
  });
}

// Select employee from search
function selectEmployee(name, id, department, position) {
  document.getElementById('employeeName').value = name;
  document.getElementById('employeeId').value = id;
  document.getElementById('departmentPosition').value = `${department} - ${position}`;
  document.getElementById('employeeSearchResults').style.display = 'none';
  console.log('✅ Employee selected:', name, id);
}

// Load all courses (NEW SCHEMA)
async function loadCourses() {
  try {
    const response = await fetch(`${API}/api/courses`);
    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      currentCourses = data.data;
      console.log('✅ Loaded courses:', currentCourses.length);
      populateCourseSelect();
    }
  } catch (err) {
    console.error('Error loading courses:', err);
  }
}

// Populate course select dropdown
function populateCourseSelect() {
  const courseSelect = document.getElementById('courseSelect');
  courseSelect.innerHTML = '<option value="">-- Select a course --</option>';
  
  currentCourses.forEach(course => {
    const option = document.createElement('option');
    option.value = course.course_title;
    option.dataset.courseId = course.id;
    option.textContent = course.course_title;
    courseSelect.appendChild(option);
  });
}

// Setup course search
function setupCourseSearch() {
  const courseInput = document.getElementById('courseSearch');
  const resultsDiv = document.getElementById('courseSearchResults');
  if (!courseInput || !resultsDiv) return;

  courseInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    if (!searchTerm) {
      resultsDiv.style.display = 'none';
      return;
    }

    const filtered = currentCourses.filter(course => 
      course.course_title.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
      resultsDiv.innerHTML = '<div style="padding: 10px; color: #999;">No courses found</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    resultsDiv.innerHTML = filtered.map(course => `
      <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; hover: background: #f5f5f5;" 
           onclick="selectCourse('${course.course_title.replace(/'/g, "\\'")}', ${course.id})">
        <strong>${course.course_title}</strong>
      </div>
    `).join('');

    resultsDiv.style.display = 'block';
  });
}

// Select course from search
function selectCourse(courseTitle, courseId) {
  document.getElementById('courseSearch').value = courseTitle;
  document.getElementById('courseSearchResults').style.display = 'none';
  selectedCourseId = courseId;
  console.log('✅ Course selected:', courseTitle, 'ID:', courseId);
}

// Load exams for selected course (NEW SCHEMA)
async function loadExamsForCourse() {
  const courseSelect = document.getElementById('courseSelect');
  const selectedOption = courseSelect.options[courseSelect.selectedIndex];
  
  if (!selectedOption.value) {
    alert('Please select a course');
    return;
  }
  
  const courseId = selectedOption.dataset.courseId;
  selectedCourseId = courseId;
  
  try {
    const response = await fetch(`${API}/api/exams?course_id=${courseId}`);
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      if (result.data.length === 0) {
        alert('No exams available for this course');
        return;
      }
      
      // Load first exam's questions
      const exam = result.data[0];
      loadExamQuestions(exam.id);
    }
  } catch (err) {
    console.error('Error loading exams:', err);
    alert('Error loading exams');
  }
}

// Load exam questions (NEW SCHEMA)
async function loadExamQuestions(examId) {
  try {
    const response = await fetch(`${API}/api/exams/${examId}`);
    const result = await response.json();
    
    if (result.success) {
      currentQuestions = result.questions;
      currentQuestion = 0;
      currentAnswers = {};
      console.log('✅ Loaded exam with', currentQuestions.length, 'questions');
    }
  } catch (err) {
    console.error('Error loading exam questions:', err);
    alert('Error loading exam questions');
  }
}

// Start exam
function startExam() {
  const employeeName = document.getElementById('employeeName').value.trim();
  const employeeId = document.getElementById('employeeId').value.trim();
  const courseTitle = document.getElementById('courseSearch').value.trim();
  
  if (!employeeName || !employeeId || !courseTitle) {
    alert('Please fill all required fields');
    return;
  }
  
  if (currentQuestions.length === 0) {
    alert('No exam questions loaded');
    return;
  }
  
  examData.employeeName = employeeName;
  examData.employeeId = employeeId;
  examData.departmentPosition = document.getElementById('departmentPosition').value;
  examData.courseTitle = courseTitle;
  examData.startTime = new Date();
  
  document.getElementById('examSetup').style.display = 'none';
  document.getElementById('examContainer').style.display = 'block';
  
  displayQuestion();
  console.log('✅ Exam started');
}

// Display current question
function displayQuestion() {
  if (currentQuestion >= currentQuestions.length) {
    submitExam();
    return;
  }
  
  const q = currentQuestions[currentQuestion];
  const container = document.getElementById('questionContainer');
  
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
      
      <div style="display: flex; gap: 10px; justify-content: space-between;">
        <button onclick="previousQuestion()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; ${currentQuestion === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">← Previous</button>
        <button onclick="nextQuestion()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Next →</button>
        <button onclick="submitExam()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit Exam</button>
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
    // Find employee ID
    const employee = currentEmployees.find(e => e.employee_no === examData.employeeId);
    
    // Save exam result to database
    const response = await fetch(`${API}/api/exam-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: employee?.id || 0,
        exam_id: 1, // This should be the actual exam ID
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
  
  document.getElementById('questionContainer').innerHTML = resultsHtml;
}

// Print results
function printResults() {
  window.print();
}
