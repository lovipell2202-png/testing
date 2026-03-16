// Global variables
let allExams = [];
let filteredExams = [];
let allCourses = [];
let courseMap = {}; // Fast lookup map
let currentEditingExamId = null;
let questionsArray = [];
let currentQuestionType = null;
let enumItemsArray = [];
let idItemsArray = [];
let procItemsArray = []; // For procedure items

// Tab switching function
function switchTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => tab.classList.remove('active'));
  
  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab content
  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Add active class to clicked button
  event.target.classList.add('active');
  
  // Update questions summary when switching to details tab
  if (tabName === 'details') {
    updateQuestionsSummary();
  }
}

// Update questions summary
function updateQuestionsSummary() {
  const summary = document.getElementById('questionsSummary');
  if (questionsArray.length === 0) {
    summary.innerHTML = '<p style="margin: 0; color: #666;">No questions added yet. Go to the "Add Questions" tab to add questions.</p>';
  } else {
    const questionTypes = {};
    questionsArray.forEach(q => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
    });
    
    let summary_text = `<p style="margin: 0; font-weight: 600; color: #004085;">✓ ${questionsArray.length} question(s) added:</p>`;
    Object.entries(questionTypes).forEach(([type, count]) => {
      const typeLabel = type.replace(/_/g, ' ').toUpperCase();
      summary_text += `<p style="margin: 5px 0 0 0; color: #004085;">• ${count} ${typeLabel}</p>`;
    });
    summary.innerHTML = summary_text;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeData();
  setupSearch();
});

// Initialize data - load courses and exams in parallel
async function initializeData() {
  try {
    // Load both in parallel
    const [coursesRes, examsRes] = await Promise.all([
      fetch('/api/courses'),
      fetch('/api/exams')
    ]);

    const coursesResult = await coursesRes.json();
    const examsResult = await examsRes.json();

    // Process courses
    if (coursesResult.success && Array.isArray(coursesResult.data)) {
      allCourses = coursesResult.data;
      // Create lookup map for O(1) access
      courseMap = {};
      allCourses.forEach(course => {
        courseMap[course.id] = course.course_title;
      });
    }

    // Process exams
    if (examsResult.success && Array.isArray(examsResult.data)) {
      allExams = examsResult.data;
      console.log('✅ Loaded exams:', allExams.length);
      filteredExams = allExams;
      renderExams();
      updateExamCount();
    } else {
      console.warn('No exams found or API error:', examsResult.message);
      allExams = [];
      filteredExams = [];
      renderExams();
    }
  } catch (err) {
    console.error('Error initializing data:', err);
    showError('Error loading data: ' + err.message);
  }
}

// Populate course dropdown
function populateCourseDropdown() {
  const select = document.getElementById('examCourse');
  select.innerHTML = '<option value="">Select a course...</option>' + allCourses.map(course => 
    `<option value="${course.id}">${course.course_title}</option>`
  ).join('');
}

// Auto-fill exam title from course dropdown
function autoFillCourseFromDropdown() {
  const courseSelect = document.getElementById('examCourse');
  if (courseSelect.value) {
    const selectedCourse = allCourses.find(c => c.id == courseSelect.value);
    if (selectedCourse) {
      document.getElementById('examTitle').value = selectedCourse.course_title;
    }
  }
}

// Load all exams
async function loadAllExams() {
  try {
    const response = await fetch('/api/exams');
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      allExams = result.data;
      filteredExams = allExams;
      renderExams();
      updateExamCount();
    }
  } catch (err) {
    console.error('Error loading exams:', err);
  }
}

// Get exam question details (multiple choice count and enumeration items)
async function getExamQuestionDetails(examId) {
  try {
    const response = await fetch(`/api/exams/${examId}`);
    const result = await response.json();
    if (result.success && result.questions) {
      const multipleChoiceQuestions = result.questions.filter(q => q.question_type === 'multiple_choice');
      const enumerationQuestions = result.questions.filter(q => q.question_type === 'enumeration');
      let totalEnumItems = 0;
      enumerationQuestions.forEach(q => {
        totalEnumItems += parseInt(q.enumeration_items) || 0;
      });
      return { 
        multipleChoice: multipleChoiceQuestions.length, 
        enumItems: totalEnumItems, 
        enumQuestions: enumerationQuestions.length 
      };
    }
  } catch (err) {
    console.error('Error fetching exam details:', err);
  }
  return { multipleChoice: 0, enumItems: 0, enumQuestions: 0 };
}

// Render exams grid
function renderExams() {
  const grid = document.getElementById('examsGrid');
  if (filteredExams.length === 0) {
    grid.innerHTML = '<div class="no-exams">No exams found. Create your first exam to get started!</div>';
    return;
  }

  grid.innerHTML = filteredExams.map(exam => `  
    <div class="exam-card">
      <div class="exam-card-title">${exam.title}</div>
      <div class="exam-card-meta">📚 ${exam.title || 'N/A'}</div>
      <div class="exam-card-meta">❓<span id="total-questions-${exam.id}">0</span>Multiple Choice</div>
      <div class="exam-card-meta">✓ ${exam.passing_score || 70}% to pass</div>
      <div id="enum-count-${exam.id}" class="exam-card-meta" style="display: none;">📋 <span id="enum-items-${exam.id}">0</span> enumeration items</div>
      <div style="font-size: 12px; color: #999; margin-top: 10px;">Created: ${new Date(exam.created_at).toLocaleDateString()}</div>
      <div class="exam-card-actions">
        <button class="btn-take" onclick="takeExam(${exam.id}, '${exam.title.replace(/'/g, "\\'")}')">Take</button>
        <button class="btn-view" onclick="viewExam(${exam.id})">View</button>
        <button class="btn-delete" onclick="deleteExam(${exam.id})">Delete</button>
      </div>
    </div>
  `).join('');

  // Load question details for each exam
  filteredExams.forEach(exam => {
    getExamQuestionDetails(exam.id).then(result => {
      document.getElementById(`total-questions-${exam.id}`).textContent = result.multipleChoice;
      if (result.enumItems > 0) {
        document.getElementById(`enum-count-${exam.id}`).style.display = 'block';
        document.getElementById(`enum-items-${exam.id}`).textContent = result.enumItems;
      }
    });
  });
}

// Setup search functionality
function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    filteredExams = searchTerm ? allExams.filter(exam => 
      exam.title.toLowerCase().includes(searchTerm) ||
      exam.course_title.toLowerCase().includes(searchTerm)
    ) : allExams;
    renderExams();
    updateExamCount();
  });
}

// Update exam count
function updateExamCount() {
  document.getElementById('examCount').textContent = filteredExams.length;
}

// Open create exam modal
function openCreateModal() {
  currentEditingExamId = null;
  questionsArray = [];
  enumItemsArray = [];
  document.getElementById('examModalTitle').textContent = 'Create New Exam';
  document.getElementById('examTitle').value = '';
  document.getElementById('examDescription').value = '';
  document.getElementById('examPassingScore').value = '70';
  
  // Reset priority to defaults
  document.getElementById('priority_multiple_choice').value = '1';
  document.getElementById('priority_enumeration').value = '2';
  document.getElementById('priority_procedure').value = '3';
  document.getElementById('priority_video').value = '4';
  
  document.getElementById('questionsContainer').innerHTML = '';
  document.getElementById('questionTypeMenu').style.display = 'none';
  document.getElementById('questionFormContainer').style.display = 'none';
  
  // Reset tabs to first tab
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => tab.classList.remove('active'));
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById('tab-details').classList.add('active');
  tabButtons[0].classList.add('active');
  
  // Update questions summary
  updateQuestionsSummary();
  
  document.getElementById('examModalOverlay').classList.add('open');
}

// Close exam modal
function closeExamModal() {
  document.getElementById('examModalOverlay').classList.remove('open');
  enumItemsArray = [];
}

// Show question type menu
function showQuestionTypeMenu() {
  document.getElementById('questionTypeMenu').style.display = 'block';
  document.getElementById('questionFormContainer').style.display = 'none';
}

// Add enumeration item
function addEnumItem() {
  const itemNum = enumItemsArray.length + 1;
  const newItem = {
    id: Date.now(),
    number: itemNum,
    text: '',
    answer: '',
    points: 1
  };
  enumItemsArray.push(newItem);
  renderEnumItems();
}

// Render enumeration items
function renderEnumItems() {
  const container = document.getElementById('enumItemsList');
  if (!container) return;
  
  if (enumItemsArray.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; margin: 0;">No items added yet</p>';
    return;
  }
  
  container.innerHTML = enumItemsArray.map((item, idx) => `
    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="color: #17a2b8;">Item ${item.number}</strong>
        <button onclick="removeEnumItem(${idx})" style="padding: 4px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Remove</button>
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Item Text * <span style="color: #999; font-size: 11px;">(letters and spaces only)</span></label>
        <input type="text" id="enumItemText_${item.id}" placeholder="e.g., SORT OR SEIRI" value="${item.text}" onchange="updateEnumItem(${idx}, 'text', this.value)" onkeypress="return /[a-zA-Z\s]/.test(String.fromCharCode(event.which))" style="width: 100%; padding: 8px; border: 2px solid ${item.text.trim() ? '#28a745' : '#dc3545'}; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
        ${!item.text.trim() ? '<small style="color: #dc3545; display: block; margin-top: 4px;">⚠️ Item text is required</small>' : '<small style="color: #28a745; display: block; margin-top: 4px;">✓ Item text provided</small>'}
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Enumeration Answer ${item.number} * <span style="color: #999; font-size: 11px;">(letters and spaces only)</span></label>
        <textarea id="enumItemAnswer_${item.id}" placeholder="e.g., This is the correct answer for this item" value="${item.answer || ''}" onchange="updateEnumItem(${idx}, 'answer', this.value)" onkeypress="return /[a-zA-Z\s]/.test(String.fromCharCode(event.which))" style="width: 100%; padding: 8px; border: 2px solid ${item.answer.trim() ? '#28a745' : '#dc3545'}; border-radius: 4px; font-size: 12px; box-sizing: border-box; min-height: 50px; resize: vertical;">${item.answer || ''}</textarea>
        ${!item.answer.trim() ? '<small style="color: #dc3545; display: block; margin-top: 4px;">⚠️ Answer is required</small>' : '<small style="color: #28a745; display: block; margin-top: 4px;">✓ Answer provided</small>'}
      </div>
      <div>
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Points for this item</label>
        <input type="number" id="enumItemPoints_${item.id}" placeholder="e.g., 1" value="${item.points || 1}" min="1" onchange="updateEnumItem(${idx}, 'points', parseInt(this.value) || 1)" style="width: 100%; padding: 8px; border: 2px solid #28a745; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
      </div>
    </div>
  `).join('');
}

// Update enumeration item
function updateEnumItem(idx, field, value) {
  if (enumItemsArray[idx]) {
    enumItemsArray[idx][field] = value;
  }
}

// Remove enumeration item
function removeEnumItem(idx) {
  enumItemsArray.splice(idx, 1);
  enumItemsArray.forEach((item, i) => {
    item.number = i + 1;
  });
  renderEnumItems();
}

// Update enumeration item count
function updateEnumItemCount() {
  const answerField = document.getElementById('enumAnswer');
  const countField = document.getElementById('enumCount');
  
  if (!answerField || !countField) return;
  
  let answer = answerField.value.trim().toUpperCase();
  answerField.value = answer;
  
  const answerOptions = answer.split(/\s+OR\s+/i);
  let maxCount = 0;
  
  answerOptions.forEach(option => {
    const letters = option.match(/[A-Z]/g);
    if (letters) {
      maxCount = Math.max(maxCount, letters.length);
    }
  });
  
  if (maxCount > 0) {
    countField.value = maxCount;
  }
}

// Update procedure item count
function updateProcItemCount() {
  const answerField = document.getElementById('procAnswer');
  const countField = document.getElementById('procCount');
  
  if (!answerField || !countField) return;
  
  let answer = answerField.value.trim().toUpperCase();
  answerField.value = answer;
  
  const answerOptions = answer.split(/\s+OR\s+/i);
  let maxCount = 0;
  
  answerOptions.forEach(option => {
    const letters = option.match(/[A-Z]/g);
    if (letters) {
      maxCount = Math.max(maxCount, letters.length);
    }
  });
  
  if (maxCount > 0) {
    countField.value = maxCount;
  }
}

// Find course by title
function findCourseByTitle(title) {
  if (!title) return null;
  const titleLower = title.toLowerCase();
  return allCourses.find(c => c.course_title.toLowerCase().includes(titleLower)) || null;
}

// Add question form
function addQuestionForm(type) {
  currentQuestionType = type;
  document.getElementById('questionTypeMenu').style.display = 'none';
  document.getElementById('questionFormContainer').style.display = 'block';
  
  let formHTML = '';
  
  if (type === 'multiple_choice') {
    formHTML = `
      <div class="form-group">
        <label>Question Priority (Display Order) *</label>
        <select id="mcPriority">
          <option value="multiple_choice" selected>Multiple Choice (Default First)</option>
          <option value="enumeration">Enumeration</option>
          <option value="procedure">Procedure Details</option>
          <option value="video">Optional Video</option>
        </select>
        <small style="color: #666; margin-top: 5px; display: block;">Set when this question type should appear during exam</small>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="mcQuestion" placeholder="Enter the question..." style="min-height: 60px;"></textarea>
      </div>
      <div class="form-group">
        <label>Option A *</label>
        <input type="text" id="mcOptionA" placeholder="Enter option A...">
      </div>
      <div class="form-group">
        <label>Option B *</label>
        <input type="text" id="mcOptionB" placeholder="Enter option B...">
      </div>
      <div class="form-group">
        <label>Option C</label>
        <input type="text" id="mcOptionC" placeholder="Enter option C...">
      </div>
      <div class="form-group">
        <label>Option D</label>
        <input type="text" id="mcOptionD" placeholder="Enter option D...">
      </div>
      <div class="form-group">
        <label>Correct Answer (A, B, C, or D) *</label>
        <select id="mcCorrectAnswer">
          <option value="">Select correct answer...</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>
      <div class="form-group">
        <label>Video URL (Optional)</label>
        <input type="url" id="mcVideoUrl" placeholder="https://example.com/video.mp4">
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="saveQuestion()" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Add Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
  } else if (type === 'enumeration') {
    formHTML = `
      <div class="form-group">
        <label>Question Priority (Display Order) *</label>
        <select id="enumPriority">
          <option value="multiple_choice">Multiple Choice</option>
          <option value="enumeration" selected>Enumeration (Default Second)</option>
          <option value="procedure">Procedure Details</option>
          <option value="video">Optional Video</option>
        </select>
        <small style="color: #666; margin-top: 5px; display: block;">Set when this question type should appear during exam</small>
      </div>
      <div class="form-group">
        <label>Enumeration Title *</label>
        <input type="text" id="enumTitle" placeholder="e.g., List the steps..." onchange="autoFillCourseFromEnumeration()">
      </div>
      <div class="form-group">
        <label>Instruction *</label>
        <textarea id="enumInstruction" placeholder="Enter instructions..." style="min-height: 60px;"></textarea>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="enumQuestion" placeholder="Enter the question..." style="min-height: 60px;"></textarea>
      </div>
      
      <div style="background: #f0f7ff; border: 2px solid #17a2b8; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #17a2b8;">📋 Enumeration Items</h4>
        <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">Add each item with its text and answer. Both fields are required and can only contain letters and spaces.</p>
        <div id="enumItemsList" style="margin-bottom: 15px;"></div>
        <button onclick="addEnumItem()" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">➕ Add Item</button>
      </div>
      
      <div class="form-group">
        <label>Video URL (Optional)</label>
        <input type="url" id="enumVideoUrl" placeholder="https://example.com/video.mp4">
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="saveQuestion()" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Add Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
  } else if (type === 'procedure') {
    formHTML = `
      <div class="form-group">
        <label>Question Priority (Display Order) *</label>
        <select id="procPriority">
          <option value="multiple_choice">Multiple Choice</option>
          <option value="enumeration">Enumeration</option>
          <option value="procedure" selected>Procedure Details (Default Third)</option>
          <option value="video">Optional Video</option>
        </select>
        <small style="color: #666; margin-top: 5px; display: block;">Set when this question type should appear during exam</small>
      </div>
      <div class="form-group">
        <label>Procedure Title *</label>
        <input type="text" id="procTitle" placeholder="e.g., Assembly Procedure..." onchange="autoFillCourseFromProcedure()">
      </div>
      <div class="form-group">
        <label>Instruction *</label>
        <textarea id="procInstruction" placeholder="Enter instructions..." style="min-height: 60px;"></textarea>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="procQuestion" placeholder="Enter the question..." style="min-height: 60px;"></textarea>
      </div>
      
      <div style="background: #f8f0ff; border: 2px solid #6f42c1; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #6f42c1;">📖 Procedure Items</h4>
        <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">Add each procedure step/question. Each item accepts uppercase letters and numbers.</p>
        <div id="procItemsList" style="margin-bottom: 15px;"></div>
        <button onclick="addProcItem()" style="width: 100%; padding: 10px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">➕ Add Item</button>
      </div>
      
      <div class="form-group">
        <label>Video URL (Optional)</label>
        <input type="url" id="procVideoUrl" placeholder="https://example.com/video.mp4">
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="saveQuestion()" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Add Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
    setTimeout(() => renderProcItems(), 0);
  } else if (type === 'identification') {
    formHTML = `
      <div class="form-group">
        <label>Identification Title *</label>
        <input type="text" id="idTitle" placeholder="e.g., Identify the parts..." onchange="autoFillCourseFromIdentification()">
      </div>
      <div class="form-group">
        <label>Instruction *</label>
        <textarea id="idInstruction" placeholder="Enter instructions..." style="min-height: 60px;"></textarea>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="idQuestion" placeholder="Enter the question..." style="min-height: 60px;"></textarea>
      </div>
      <div class="form-group">
        <label>Reference Image (Optional)</label>
        <input type="file" id="idImageFile" accept="image/*" onchange="handleIdImageUpload(event)">
        <small style="color: #666; margin-top: 5px; display: block;">Image to display as reference during exam (JPG, PNG, GIF)</small>
        <div id="idImagePreview" style="margin-top: 10px;"></div>
      </div>
      
      <div style="background: #e8f5e9; border: 2px solid #28a745; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #28a745;">🖼️ Identification Items</h4>
        <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">Add each item to identify. Each item is worth 1 point.</p>
        <div id="idItemsList" style="margin-bottom: 15px;"></div>
        <button onclick="addIdItem()" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">➕ Add Item</button>
      </div>
      
      <div style="display: flex; gap: 10px;">
        <button onclick="saveQuestion()" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Add Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
  }
  
  document.getElementById('questionFormContent').innerHTML = formHTML;
}

// Save question
function saveQuestion() {
  let question = {};
  
  if (currentQuestionType === 'multiple_choice') {
    const text = document.getElementById('mcQuestion').value.trim();
    const optA = document.getElementById('mcOptionA').value.trim();
    const optB = document.getElementById('mcOptionB').value.trim();
    const correct = document.getElementById('mcCorrectAnswer').value;
    const video = document.getElementById('mcVideoUrl').value.trim();
    const priority = document.getElementById('mcPriority').value || 'multiple_choice';
    
    if (!text || !optA || !optB || !correct) {
      showError('Please fill in all required fields');
      return;
    }
    
    question = {
      type: 'multiple_choice',
      question_text: text,
      option_a: optA,
      option_b: optB,
      option_c: document.getElementById('mcOptionC').value.trim() || null,
      option_d: document.getElementById('mcOptionD').value.trim() || null,
      correct_answer: correct,
      video_url: video || null,
      priority: priority
    };
  } else if (currentQuestionType === 'enumeration') {
    const questionText = document.getElementById('enumQuestion').value.trim();
    const title = document.getElementById('enumTitle').value.trim();
    const instruction = document.getElementById('enumInstruction').value.trim();
    const video = document.getElementById('enumVideoUrl').value.trim();
    const priority = document.getElementById('enumPriority').value || 'enumeration';
    
    if (!questionText || !title || !instruction) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (enumItemsArray.length === 0) {
      showError('Please add at least one enumeration item');
      return;
    }
    
    // Validate that all items have both text and answer (only letters and spaces allowed)
    for (let item of enumItemsArray) {
      if (!item.text.trim() || !item.answer.trim()) {
        showError('All enumeration items must have both text and answer');
        return;
      }
      // Validate that text and answer only contain letters and spaces
      if (!/^[a-zA-Z\s]+$/.test(item.text.trim())) {
        showError('Item text can only contain letters and spaces');
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(item.answer.trim())) {
        showError('Enumeration answer can only contain letters and spaces');
        return;
      }
    }
    
    question = {
      type: 'enumeration',
      question_text: questionText,
      title: title,
      instruction: instruction,
      items: enumItemsArray,
      count: enumItemsArray.length,
      answer: enumItemsArray.map(item => item.answer).join(' | '),
      video_url: video || null,
      priority: priority
    };
    console.log('[DEBUG] Enumeration question saved:', question);
  } else if (currentQuestionType === 'procedure') {
    const questionText = document.getElementById('procQuestion').value.trim();
    const title = document.getElementById('procTitle').value.trim();
    const instruction = document.getElementById('procInstruction').value.trim();
    const video = document.getElementById('procVideoUrl').value.trim();
    const priority = document.getElementById('procPriority').value || 'procedure';
    
    if (!questionText || !title || !instruction) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (procItemsArray.length === 0) {
      showError('Please add at least one procedure item');
      return;
    }
    
    // Validate that all items have both text and answer
    for (let item of procItemsArray) {
      if (!item.text.trim() || !item.answer.trim()) {
        showError('All procedure items must have both text and answer');
        return;
      }
      // Validate that answer only contains letters and numbers
      if (!/^[A-Z0-9\s,]+$/.test(item.answer.trim())) {
        showError('Answer can only contain uppercase letters, numbers, and commas');
        return;
      }
    }
    
    question = {
      type: 'procedure',
      question_text: questionText,
      title: title,
      instruction: instruction,
      items: procItemsArray,
      count: procItemsArray.length,
      answer: procItemsArray.map(item => item.answer).join(' | '),
      video_url: video || null,
      priority: priority
    };
    console.log('[DEBUG] Procedure question saved:', question);
  } else if (currentQuestionType === 'identification') {
    const title = document.getElementById('idTitle').value.trim();
    const instruction = document.getElementById('idInstruction').value.trim();
    const questionText = document.getElementById('idQuestion').value.trim();
    const imageFile = document.getElementById('idImageFile');
    const imageBase64 = imageFile.dataset.base64 || null;
    
    if (!title || !instruction || !questionText) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (idItemsArray.length === 0) {
      showError('Please add at least one identification item');
      return;
    }
    
    // Validate that all items have both text and answer
    for (let item of idItemsArray) {
      if (!item.text.trim() || !item.answer.trim()) {
        showError('All identification items must have both text and answer');
        return;
      }
      // Validate that answer only contains letters and numbers
      if (!/^[A-Z0-9\s,]+$/.test(item.answer.trim())) {
        showError('Answer can only contain uppercase letters, numbers, and commas');
        return;
      }
    }
    
    question = {
      type: 'identification',
      question_text: questionText,
      title: title,
      instruction: instruction,
      image_base64: imageBase64,
      items: idItemsArray,
      count: idItemsArray.length,
      answer: idItemsArray.map(item => item.answer).join(' | ')
    };
  }
  
  questionsArray.push(question);
  renderQuestions();
  cancelQuestion();
  showSuccess('Question added successfully');
}

// Cancel question form
function cancelQuestion() {
  document.getElementById('questionFormContainer').style.display = 'none';
  document.getElementById('questionTypeMenu').style.display = 'none';
  currentQuestionType = null;
  // Clear all items arrays
  enumItemsArray = [];
  idItemsArray = [];
  procItemsArray = [];
}

// Auto-fill course from enumeration
function autoFillCourseFromEnumeration() {
  const enumTitle = document.getElementById('enumTitle').value.trim();
  if (enumTitle) {
    const matchedCourse = findCourseByTitle(enumTitle);
    if (matchedCourse) {
      document.getElementById('examCourse').value = matchedCourse.id;
      document.getElementById('examTitle').value = matchedCourse.course_title;
      showSuccess('Course auto-filled: ' + matchedCourse.course_title);
    }
  }
}

// Auto-fill course from procedure
function autoFillCourseFromProcedure() {
  const procTitle = document.getElementById('procTitle').value.trim();
  if (procTitle) {
    const matchedCourse = findCourseByTitle(procTitle);
    if (matchedCourse) {
      document.getElementById('examCourse').value = matchedCourse.id;
      document.getElementById('examTitle').value = matchedCourse.course_title;
      showSuccess('Course auto-filled: ' + matchedCourse.course_title);
    }
  }
}

// Auto-fill course from identification
function autoFillCourseFromIdentification() {
  const idTitle = document.getElementById('idTitle').value.trim();
  if (idTitle) {
    const matchedCourse = findCourseByTitle(idTitle);
    if (matchedCourse) {
      document.getElementById('examCourse').value = matchedCourse.id;
      document.getElementById('examTitle').value = matchedCourse.course_title;
      showSuccess('Course auto-filled: ' + matchedCourse.course_title);
    }
  }
}

// Handle identification image file upload
function handleIdImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('idImagePreview');
      preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 1px solid #ddd;">`;
      // Store the base64 data in a data attribute
      document.getElementById('idImageFile').dataset.base64 = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Add identification item
function addIdItem() {
  const itemNum = idItemsArray.length + 1;
  const newItem = {
    id: Date.now(),
    number: itemNum,
    text: '',
    answer: '',
    points: 1
  };
  idItemsArray.push(newItem);
  renderIdItems();
}

// Render identification items
function renderIdItems() {
  const container = document.getElementById('idItemsList');
  if (!container) return;
  
  if (idItemsArray.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; margin: 0;">No items added yet</p>';
    return;
  }
  
  container.innerHTML = idItemsArray.map((item, idx) => `
    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="color: #28a745;">Item ${item.number}</strong>
        <button onclick="removeIdItem(${idx})" style="padding: 4px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Remove</button>
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Item Text/Label *</label>
        <input type="text" id="idItemText_${item.id}" placeholder="e.g., Part A, Component 1" value="${item.text}" onchange="updateIdItem(${idx}, 'text', this.value)" style="width: 100%; padding: 8px; border: 2px solid ${item.text.trim() ? '#28a745' : '#dc3545'}; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
        ${!item.text.trim() ? '<small style="color: #dc3545; display: block; margin-top: 4px;">⚠️ Item text is required</small>' : '<small style="color: #28a745; display: block; margin-top: 4px;">✓ Item text provided</small>'}
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Correct Answer (UPPERCASE) *</label>
        <textarea id="idItemAnswer_${item.id}" placeholder="e.g., A, B1, PART3" onchange="updateIdItem(${idx}, 'answer', this.value)" style="width: 100%; padding: 8px; border: 2px solid ${item.answer.trim() ? '#28a745' : '#dc3545'}; border-radius: 4px; font-size: 12px; box-sizing: border-box; text-transform: uppercase; min-height: 50px; resize: vertical;">${item.answer}</textarea>
        ${!item.answer.trim() ? '<small style="color: #dc3545; display: block; margin-top: 4px;">⚠️ Answer is required</small>' : '<small style="color: #28a745; display: block; margin-top: 4px;">✓ Answer provided</small>'}
      </div>
      <div>
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Points for this item</label>
        <input type="number" id="idItemPoints_${item.id}" placeholder="e.g., 1" value="${item.points || 1}" min="1" onchange="updateIdItem(${idx}, 'points', parseInt(this.value) || 1)" style="width: 100%; padding: 8px; border: 2px solid #28a745; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
      </div>
    </div>
  `).join('');
}

// Update identification item
function updateIdItem(idx, field, value) {
  if (idItemsArray[idx]) {
    idItemsArray[idx][field] = field === 'answer' ? value.toUpperCase() : value;
    renderIdItems();
  }
}

// Remove identification item
function removeIdItem(idx) {
  idItemsArray.splice(idx, 1);
  // Renumber items
  idItemsArray.forEach((item, i) => {
    item.number = i + 1;
  });
  renderIdItems();
}

// Add procedure item
function addProcItem() {
  const itemNum = procItemsArray.length + 1;
  const newItem = {
    id: Date.now(),
    number: itemNum,
    text: '',
    answer: '',
    points: 1
  };
  procItemsArray.push(newItem);
  renderProcItems();
}

// Render procedure items
function renderProcItems() {
  const container = document.getElementById('procItemsList');
  if (!container) return;
  
  if (procItemsArray.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; margin: 0;">No items added yet</p>';
    return;
  }
  
  container.innerHTML = procItemsArray.map((item, idx) => `
    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="color: #6f42c1;">Item ${item.number}</strong>
        <button onclick="removeProcItem(${idx})" style="padding: 4px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Remove</button>
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Question/Step *</label>
        <input type="text" id="procItemText_${item.id}" placeholder="e.g., Step 1, First check" value="${item.text}" onchange="updateProcItem(${idx}, 'text', this.value)" style="width: 100%; padding: 8px; border: 2px solid ${item.text.trim() ? '#6f42c1' : '#dc3545'}; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
        ${!item.text.trim() ? '<small style="color: #dc3545; display: block; margin-top: 4px;">⚠️ Question text is required</small>' : '<small style="color: #6f42c1; display: block; margin-top: 4px;">✓ Question provided</small>'}
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #333;">Correct Answer (UPPERCASE letters and numbers) *</label>
        <textarea id="procItemAnswer_${item.id}" placeholder="e.g., A, B1, PART3" onchange="updateProcItem(${idx}, 'answer', this.value)" style="width: 100%; padding: 8px; border: 2px solid ${item.answer.trim() ? '#6f42c1' : '#dc3545'}; border-radius: 4px; font-size: 12px; box-sizing: border-box; text-transform: uppercase; min-height: 50px; resize: vertical;">${item.answer}</textarea>
        ${!item.answer.trim() ? '<small style="color: #dc3545; display: block; margin-top: 4px;">⚠️ Answer is required</small>' : '<small style="color: #6f42c1; display: block; margin-top: 4px;">✓ Answer provided</small>'}
      </div>
    </div>
  `).join('');
}

// Update procedure item
function updateProcItem(idx, field, value) {
  if (procItemsArray[idx]) {
    procItemsArray[idx][field] = field === 'answer' ? value.toUpperCase() : value;
    renderProcItems();
  }
}

// Remove procedure item
function removeProcItem(idx) {
  procItemsArray.splice(idx, 1);
  // Renumber items
  procItemsArray.forEach((item, i) => {
    item.number = i + 1;
  });
  renderProcItems();
}

// Render questions
function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  if (questionsArray.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center;">No questions added yet</p>';
    return;
  }
  
  container.innerHTML = questionsArray.map((q, idx) => `
    <div style="background: white; border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="flex: 1;">
        <strong style="color: var(--navy);">Q${idx + 1}: ${q.type === 'multiple_choice' ? '📝 Multiple Choice' : q.type === 'enumeration' ? '📋 Enumeration' : q.type === 'procedure' ? '📖 Procedure' : '🖼️ Identification'}</strong>
        <p style="margin: 5px 0 0 0; color: #333; font-size: 13px; font-weight: 500;">${q.question_text || q.title || ''}</p>
        ${q.type === 'multiple_choice' ? `<p style="margin: 3px 0 0 0; color: #007bff; font-size: 12px;">✓ Answer: ${q.correct_answer}</p>` : ''}
        ${q.type === 'enumeration' ? `
          <div style="margin: 8px 0 0 0; padding: 8px; background: #f0f7ff; border-radius: 4px; font-size: 12px;">
            <p style="margin: 0 0 4px 0; color: #007bff; font-weight: 600;">📋 ${q.title}</p>
            <p style="margin: 0 0 4px 0; color: #666;"><strong>List:</strong> ${q.count} items</p>
          </div>
        ` : ''}
        ${q.type === 'procedure' ? `
          <div style="margin: 8px 0 0 0; padding: 8px; background: #f8f0ff; border-radius: 4px; font-size: 12px;">
            <p style="margin: 0 0 4px 0; color: #6f42c1; font-weight: 600;">📖 ${q.title}</p>
            <p style="margin: 0 0 4px 0; color: #666;"><strong>Items:</strong> ${q.count || (q.items ? q.items.length : 0)} items</p>
          </div>
        ` : ''}
        ${q.type === 'identification' ? `
          <div style="margin: 8px 0 0 0; padding: 8px; background: #e8f5e9; border-radius: 4px; font-size: 12px;">
            <p style="margin: 0 0 4px 0; color: #28a745; font-weight: 600;">🖼️ ${q.title}</p>
            <p style="margin: 0 0 4px 0; color: #666;"><strong>Items:</strong> ${q.count || (q.items ? q.items.length : 0)} items</p>
            ${q.image_url ? '<p style="margin: 0; color: #28a745;">📷 Has reference image</p>' : ''}
          </div>
        ` : ''}
        <button onclick="editQuestion(${idx})" style="padding: 6px 12px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Edit</button>
        <button onclick="removeQuestion(${idx})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Remove</button>
      </div>
    </div>
  `).join('');
}

// Edit question
function editQuestion(idx) {
  const q = questionsArray[idx];
  console.log('[DEBUG] editQuestion - question:', q);
  currentQuestionType = q.type;
  document.getElementById('questionTypeMenu').style.display = 'none';
  document.getElementById('questionFormContainer').style.display = 'block';
  
  let formHTML = '';
  
  if (q.type === 'multiple_choice') {
    formHTML = `
      <div class="form-group">
        <label>Question Priority (Display Order) *</label>
        <select id="mcPriority">
          <option value="multiple_choice" ${q.priority === 'multiple_choice' ? 'selected' : ''}>Multiple Choice (Default First)</option>
          <option value="enumeration" ${q.priority === 'enumeration' ? 'selected' : ''}>Enumeration</option>
          <option value="procedure" ${q.priority === 'procedure' ? 'selected' : ''}>Procedure Details</option>
          <option value="video" ${q.priority === 'video' ? 'selected' : ''}>Optional Video</option>
        </select>
        <small style="color: #666; margin-top: 5px; display: block;">Set when this question type should appear during exam</small>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="mcQuestion" placeholder="Enter the question..." style="min-height: 60px;">${q.question_text}</textarea>
      </div>
      <div class="form-group">
        <label>Option A *</label>
        <input type="text" id="mcOptionA" placeholder="Enter option A..." value="${q.option_a || ''}">
      </div>
      <div class="form-group">
        <label>Option B *</label>
        <input type="text" id="mcOptionB" placeholder="Enter option B..." value="${q.option_b || ''}">
      </div>
      <div class="form-group">
        <label>Option C</label>
        <input type="text" id="mcOptionC" placeholder="Enter option C..." value="${q.option_c || ''}">
      </div>
      <div class="form-group">
        <label>Option D</label>
        <input type="text" id="mcOptionD" placeholder="Enter option D..." value="${q.option_d || ''}">
      </div>
      <div class="form-group">
        <label>Correct Answer (A, B, C, or D) *</label>
        <select id="mcCorrectAnswer">
          <option value="">Select correct answer...</option>
          <option value="A" ${q.correct_answer === 'A' ? 'selected' : ''}>A</option>
          <option value="B" ${q.correct_answer === 'B' ? 'selected' : ''}>B</option>
          <option value="C" ${q.correct_answer === 'C' ? 'selected' : ''}>C</option>
          <option value="D" ${q.correct_answer === 'D' ? 'selected' : ''}>D</option>
        </select>
      </div>
      <div class="form-group">
        <label>Video URL (Optional)</label>
        <input type="url" id="mcVideoUrl" placeholder="https://example.com/video.mp4" value="${q.video_url || ''}">
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="updateQuestion(${idx})" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Update Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
  } else if (q.type === 'enumeration') {
    enumItemsArray = JSON.parse(JSON.stringify(q.items || []));
    console.log('[DEBUG] editQuestion - enumeration - enumItemsArray:', enumItemsArray);
    formHTML = `
      <div class="form-group">
        <label>Question Priority (Display Order) *</label>
        <select id="enumPriority">
          <option value="multiple_choice" ${q.priority === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
          <option value="enumeration" ${q.priority === 'enumeration' ? 'selected' : ''}>Enumeration (Default Second)</option>
          <option value="procedure" ${q.priority === 'procedure' ? 'selected' : ''}>Procedure Details</option>
          <option value="video" ${q.priority === 'video' ? 'selected' : ''}>Optional Video</option>
        </select>
        <small style="color: #666; margin-top: 5px; display: block;">Set when this question type should appear during exam</small>
      </div>
      <div class="form-group">
        <label>Enumeration Title *</label>
        <input type="text" id="enumTitle" placeholder="e.g., List the steps..." value="${q.title || ''}" onchange="autoFillCourseFromEnumeration()">
      </div>
      <div class="form-group">
        <label>Instruction *</label>
        <textarea id="enumInstruction" placeholder="Enter instructions..." style="min-height: 60px;">${q.instruction || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="enumQuestion" placeholder="Enter the question..." style="min-height: 60px;">${q.question_text || ''}</textarea>
      </div>
      
      <div style="background: #f0f7ff; border: 2px solid #17a2b8; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #17a2b8;">📋 Enumeration Items</h4>
        <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">Add each item with its text and answer. Both fields are required and can only contain letters and spaces.</p>
        <div id="enumItemsList" style="margin-bottom: 15px;"></div>
        <button onclick="addEnumItem()" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">➕ Add Item</button>
      </div>
      
      <div class="form-group">
        <label>Video URL (Optional)</label>
        <input type="url" id="enumVideoUrl" placeholder="https://example.com/video.mp4" value="${q.video_url || ''}">
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="updateQuestion(${idx})" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Update Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
    setTimeout(() => renderEnumItems(), 0);
  } else if (q.type === 'procedure') {
    procItemsArray = JSON.parse(JSON.stringify(q.items || []));
    console.log('[DEBUG] editQuestion - procedure - procItemsArray:', procItemsArray);
    formHTML = `
      <div class="form-group">
        <label>Question Priority (Display Order) *</label>
        <select id="procPriority">
          <option value="multiple_choice" ${q.priority === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
          <option value="enumeration" ${q.priority === 'enumeration' ? 'selected' : ''}>Enumeration</option>
          <option value="procedure" ${q.priority === 'procedure' ? 'selected' : ''}>Procedure Details (Default Third)</option>
          <option value="video" ${q.priority === 'video' ? 'selected' : ''}>Optional Video</option>
        </select>
        <small style="color: #666; margin-top: 5px; display: block;">Set when this question type should appear during exam</small>
      </div>
      <div class="form-group">
        <label>Procedure Title *</label>
        <input type="text" id="procTitle" placeholder="e.g., Assembly Procedure..." value="${q.title || ''}" onchange="autoFillCourseFromProcedure()">
      </div>
      <div class="form-group">
        <label>Instruction *</label>
        <textarea id="procInstruction" placeholder="Enter instructions..." style="min-height: 60px;">${q.instruction || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="procQuestion" placeholder="Enter the question..." style="min-height: 60px;">${q.question_text || ''}</textarea>
      </div>
      
      <div style="background: #f8f0ff; border: 2px solid #6f42c1; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #6f42c1;">📖 Procedure Items</h4>
        <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">Add each procedure step/question. Each item accepts uppercase letters and numbers.</p>
        <div id="procItemsList" style="margin-bottom: 15px;"></div>
        <button onclick="addProcItem()" style="width: 100%; padding: 10px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">➕ Add Item</button>
      </div>
      
      <div class="form-group">
        <label>Video URL (Optional)</label>
        <input type="url" id="procVideoUrl" placeholder="https://example.com/video.mp4" value="${q.video_url || ''}">
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="updateQuestion(${idx})" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Update Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
    setTimeout(() => renderProcItems(), 0);
  } else if (q.type === 'identification') {
    idItemsArray = JSON.parse(JSON.stringify(q.items || []));
    formHTML = `
      <div class="form-group">
        <label>Identification Title *</label>
        <input type="text" id="idTitle" placeholder="e.g., Identify the parts..." value="${q.title || ''}">
      </div>
      <div class="form-group">
        <label>Instruction *</label>
        <textarea id="idInstruction" placeholder="Enter instructions..." style="min-height: 60px;">${q.instruction || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Question Text *</label>
        <textarea id="idQuestion" placeholder="Enter the question..." style="min-height: 60px;">${q.question_text || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Reference Image (Optional)</label>
        <input type="file" id="idImageFile" accept="image/*" onchange="handleIdImageUpload(event)">
        <small style="color: #666; margin-top: 5px; display: block;">Image to display as reference during exam (JPG, PNG, GIF)</small>
        <div id="idImagePreview" style="margin-top: 10px;">
          ${q.image_url ? `<img src="${q.image_url}" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 1px solid #ddd;">` : (q.image_base64 ? `<img src="${q.image_base64}" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 1px solid #ddd;">` : '')}
        </div>
      </div>
      
      <div style="background: #e8f5e9; border: 2px solid #28a745; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #28a745;">🖼️ Identification Items</h4>
        <p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">Add each item to identify. Each item is worth 1 point.</p>
        <div id="idItemsList" style="margin-bottom: 15px;"></div>
        <button onclick="addIdItem()" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">➕ Add Item</button>
      </div>
      
      <div style="display: flex; gap: 10px;">
        <button onclick="updateQuestion(${idx})" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✓ Update Question</button>
        <button onclick="cancelQuestion()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
    `;
    setTimeout(() => renderIdItems(), 0);
  }
  
  document.getElementById('questionFormContent').innerHTML = formHTML;
}

// Update question
function updateQuestion(idx) {
  let question = {};
  
  if (currentQuestionType === 'multiple_choice') {
    const text = document.getElementById('mcQuestion').value.trim();
    const optA = document.getElementById('mcOptionA').value.trim();
    const optB = document.getElementById('mcOptionB').value.trim();
    const correct = document.getElementById('mcCorrectAnswer').value;
    const video = document.getElementById('mcVideoUrl').value.trim();
    const priority = document.getElementById('mcPriority').value || 'multiple_choice';
    
    if (!text || !optA || !optB || !correct) {
      showError('Please fill in all required fields');
      return;
    }
    
    question = {
      type: 'multiple_choice',
      question_text: text,
      option_a: optA,
      option_b: optB,
      option_c: document.getElementById('mcOptionC').value.trim() || null,
      option_d: document.getElementById('mcOptionD').value.trim() || null,
      correct_answer: correct,
      video_url: video || null,
      priority: priority
    };
  } else if (currentQuestionType === 'enumeration') {
    const questionText = document.getElementById('enumQuestion').value.trim();
    const title = document.getElementById('enumTitle').value.trim();
    const instruction = document.getElementById('enumInstruction').value.trim();
    const video = document.getElementById('enumVideoUrl').value.trim();
    const priority = document.getElementById('enumPriority').value || 'enumeration';
    
    if (!questionText || !title || !instruction) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (enumItemsArray.length === 0) {
      showError('Please add at least one enumeration item');
      return;
    }
    
    for (let item of enumItemsArray) {
      if (!item.text.trim() || !item.answer.trim()) {
        showError('All enumeration items must have text and answer');
        return;
      }
    }
    
    question = {
      type: 'enumeration',
      question_text: questionText,
      title: title,
      instruction: instruction,
      items: enumItemsArray,
      count: enumItemsArray.length,
      answer: enumItemsArray.map(item => item.answer).join(' | '),
      video_url: video || null,
      priority: priority
    };
  } else if (currentQuestionType === 'procedure') {
    const questionText = document.getElementById('procQuestion').value.trim();
    const title = document.getElementById('procTitle').value.trim();
    const instruction = document.getElementById('procInstruction').value.trim();
    const video = document.getElementById('procVideoUrl').value.trim();
    const priority = document.getElementById('procPriority').value || 'procedure';
    
    if (!questionText || !title || !instruction) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (procItemsArray.length === 0) {
      showError('Please add at least one procedure item');
      return;
    }
    
    // Validate that all items have both text and answer
    for (let item of procItemsArray) {
      if (!item.text.trim() || !item.answer.trim()) {
        showError('All procedure items must have both question text and answer');
        return;
      }
    }
    
    question = {
      type: 'procedure',
      question_text: questionText,
      title: title,
      instruction: instruction,
      items: procItemsArray,
      count: procItemsArray.length,
      answer: '',
      video_url: video || null,
      priority: priority
    };
  } else if (currentQuestionType === 'identification') {
    const title = document.getElementById('idTitle').value.trim();
    const instruction = document.getElementById('idInstruction').value.trim();
    const questionText = document.getElementById('idQuestion').value.trim();
    const imageFile = document.getElementById('idImageFile');
    const imageBase64 = imageFile.dataset.base64 || null;
    
    // Get existing image URL from the question being edited
    const existingQuestion = questionsArray[idx];
    const existingImageUrl = existingQuestion ? existingQuestion.image_url : '';
    
    if (!title || !instruction || !questionText) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (idItemsArray.length === 0) {
      showError('Please add at least one identification item');
      return;
    }
    
    // Validate that all items have both text and answer
    for (let item of idItemsArray) {
      if (!item.text.trim() || !item.answer.trim()) {
        showError('All identification items must have both text and answer');
        return;
      }
    }
    
    question = {
      type: 'identification',
      question_text: questionText,
      title: title,
      instruction: instruction,
      image_base64: imageBase64,
      image_url: existingImageUrl || '', // Preserve existing image URL if no new image uploaded
      items: idItemsArray,
      count: idItemsArray.length,
      answer: idItemsArray.map(item => item.answer).join(' | ')
    };
  }
  
  questionsArray[idx] = question;
  renderQuestions();
  cancelQuestion();
  showSuccess('Question updated successfully');
}

// Remove question
function removeQuestion(idx) {
  questionsArray.splice(idx, 1);
  renderQuestions();
  showSuccess('Question removed');
}

// Edit exam
function editExam(examId) {
  const exam = allExams.find(e => e.id === examId);
  if (!exam) return;
  
  currentEditingExamId = examId;
  questionsArray = [];
  enumItemsArray = [];
  idItemsArray = [];
  procItemsArray = [];
  document.getElementById('examModalTitle').textContent = 'Edit Exam';
  document.getElementById('examTitle').value = exam.title;
  document.getElementById('examDescription').value = exam.description || '';
  document.getElementById('examPassingScore').value = exam.passing_score;
  document.getElementById('questionsContainer').innerHTML = '<p style="color: #999; text-align: center;">Loading questions...</p>';
  document.getElementById('questionTypeMenu').style.display = 'none';
  document.getElementById('questionFormContainer').style.display = 'none';
  
  loadExamQuestions(examId);
  document.getElementById('examModalOverlay').classList.add('open');
}

// Load exam questions
async function loadExamQuestions(examId) {
  try {
    const response = await fetch(`/api/exams/${examId}`);
    const result = await response.json();
    console.log('[DEBUG] loadExamQuestions - API response:', result);
    
    if (result.success && result.questions) {
      questionsArray = result.questions.map(q => {
        console.log('[DEBUG] Processing question:', q.id, q.question_type);
        
        if (q.question_type === 'multiple_choice') {
          return {
            type: 'multiple_choice',
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer,
            video_url: null
          };
        } else if (q.question_type === 'enumeration') {
          console.log('[DEBUG] Enumeration question - enumeration_items_json:', q.enumeration_items_json);
          console.log('[DEBUG] Enumeration question - question_text:', q.question_text);
          
          // Try to load items from JSON first, otherwise reconstruct from answer
          let items = [];
          if (q.enumeration_items_json) {
            try {
              items = JSON.parse(q.enumeration_items_json);
              console.log('[DEBUG] Parsed items from JSON:', items);
            } catch (e) {
              console.log('[DEBUG] JSON parse error:', e.message);
              // If JSON parse fails, reconstruct from answer
              const answerStr = q.enumeration_answer || '';
              const answers = answerStr.split(',').map(a => a.trim());
              items = answers.map((answer, idx) => ({
                id: idx + 1,
                number: idx + 1,
                text: `Item ${idx + 1}`,
                answer: answer
              }));
            }
          } else {
            console.log('[DEBUG] No JSON, reconstructing from answer');
            // Reconstruct items from answer (e.g., "A, B, C" → [{id: 1, number: 1, text: 'Item 1', answer: 'A'}, ...])
            const answerStr = q.enumeration_answer || '';
            const answers = answerStr.split(',').map(a => a.trim());
            items = answers.map((answer, idx) => ({
              id: idx + 1,
              number: idx + 1,
              text: `Item ${idx + 1}`,
              answer: answer
            }));
          }
          
          const enumQuestion = {
            type: 'enumeration',
            question_text: q.question_text || '',
            title: q.enumeration_title || '',
            instruction: q.enumeration_instruction || '',
            count: parseInt(q.enumeration_items) || items.length || 0,
            answer: q.enumeration_answer || '',
            items: items,
            video_url: null
          };
          console.log('[DEBUG] Enumeration question object:', enumQuestion);
          return enumQuestion;
        } else if (q.question_type === 'procedure') {
          let items = [];
          if (q.procedure_items_json) {
            try {
              items = JSON.parse(q.procedure_items_json);
            } catch (e) {
              console.log('[DEBUG] JSON parse error for procedure:', e.message);
            }
          }
          return {
            type: 'procedure',
            question_text: q.question_text || '',
            title: q.procedure_title || '',
            instruction: q.procedure_instructions || '',
            items: items,
            count: items.length || 0,
            answer: q.procedure_answer || '',
            video_url: null
          };
        } else if (q.question_type === 'identification') {
          let items = [];
          if (q.identification_items_json) {
            try {
              items = JSON.parse(q.identification_items_json);
            } catch (e) {
              console.log('[DEBUG] JSON parse error for identification:', e.message);
            }
          }
          return {
            type: 'identification',
            question_text: q.question_text || '',
            title: q.identification_title || '',
            instruction: q.identification_instruction || '',
            image_url: q.identification_image_url || '',
            answer: q.identification_answer || '',
            items: items,
            points: q.points || 1
          };
        }
      });
      renderQuestions();
      console.log('✅ Loaded', questionsArray.length, 'questions for editing');
      console.log('[DEBUG] questionsArray:', questionsArray);
    }
  } catch (err) {
    console.error('Error loading exam questions:', err);
    document.getElementById('questionsContainer').innerHTML = '<p style="color: #999; text-align: center;">Error loading questions</p>';
  }
}

// Save exam
async function saveExam() {
  const title = document.getElementById('examTitle').value.trim();
  const description = document.getElementById('examDescription').value.trim();
  const passingScore = parseInt(document.getElementById('examPassingScore').value) || 70;

  if (!title) {
    showError('Please fill in all required fields');
    return;
  }

  // Extract course from title (the title IS the course name)
  const course = allCourses.find(c => c.course_title === title);
  if (!course) {
    showError('Invalid course. Please select a valid course title.');
    return;
  }

  try {
    const method = currentEditingExamId ? 'PUT' : 'POST';
    const url = currentEditingExamId ? `/api/exams/${currentEditingExamId}` : '/api/exams';
    
    const convertedQuestions = questionsArray.map(q => {
      if (q.type === 'multiple_choice') {
        return {
          type: 'multiple_choice',
          question: q.question_text || q.question || '',
          options: [q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || ''],
          correctAnswer: q.correct_answer || ''
        };
      } else if (q.type === 'enumeration') {
        const converted = {
          type: 'enumeration',
          question: q.question_text || '',
          title: q.title || '',
          instruction: q.instruction || '',
          count: q.count || q.items?.length || 0,
          answer: q.answer || '',
          items: q.items || [],
          items_json: JSON.stringify(q.items || [])
        };
        console.log('[DEBUG] Enumeration question converted:', converted);
        return converted;
      } else if (q.type === 'procedure') {
        return {
          type: 'procedure',
          question: q.question_text || '',
          title: q.title || '',
          instruction: q.instruction || '',
          items: q.items || [],
          items_json: JSON.stringify(q.items || []),
          count: q.count || q.items?.length || 0,
          answer: q.answer || ''
        };
      } else if (q.type === 'identification') {
        // If there's an existing image_url and no new image_base64, keep the existing image
        let imageData = '';
        if (q.image_base64 && q.image_base64.startsWith('data:image')) {
          // New image uploaded - use the base64
          imageData = q.image_base64;
        } else if (q.image_url && q.image_url.includes('/uploads/')) {
          // No new image uploaded but existing image URL exists - preserve it
          // We'll handle this on server side
          imageData = '';
        }
        return {
          type: 'identification',
          question_text: q.question_text || '',
          title: q.title || '',
          instruction: q.instruction || '',
          image_base64: imageData,
          image_url: q.image_url || '', // Send existing URL to server
          items: q.items || [],
          items_json: JSON.stringify(q.items || []),
          count: q.count || q.items?.length || 0,
          answer: q.answer || ''
        };
      }
      return q;
    });
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        course_title: course.course_title,
        course_code: course.course_code || '',
        description: description,
        question_count: convertedQuestions.length,
        questions: convertedQuestions
      })
    });

    const result = await response.json();
    if (result.success) {
      showSuccess(currentEditingExamId ? 'Exam updated successfully' : 'Exam created successfully');
      closeExamModal();
      loadAllExams();
    } else {
      showError(result.message || 'Error saving exam');
    }
  } catch (err) {
    console.error('Error saving exam:', err);
    showError('Error saving exam: ' + err.message);
  }
}

// Delete exam
async function deleteExam(examId) {
  if (!confirm('Are you sure you want to delete this exam?')) return;
  
  try {
    const response = await fetch(`/api/exams/${examId}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      showSuccess('Exam deleted successfully');
      loadAllExams();
    } else {
      showError('Error deleting exam');
    }
  } catch (err) {
    console.error('Error deleting exam:', err);
    showError('Error deleting exam');
  }
}

// View exam
async function viewExam(examId) {
  try {
    const response = await fetch(`/api/exams/${examId}`);
    const result = await response.json();
    console.log('View Exam Response:', result);
    
    if (result.success && result.exam) {
      const exam = result.exam;
      const questions = result.questions || [];
      console.log('✅ Loaded exam:', exam.title, 'with', questions.length, 'questions');
      
      const questionsHtml = questions.map((q, idx) => {
        let qHtml = `<div class="question-item" style="margin-bottom: 20px;">`;
        
        if (q.question_type === 'multiple_choice') {
          qHtml += `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div class="question-number" style="flex: 1;">Q${idx + 1}: ${q.question_text}</div>
              <span style="background: #007bff; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap;">📝 Multiple Choice</span>
            </div>
            <div class="question-options" style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
              ${[q.option_a, q.option_b, q.option_c, q.option_d].filter(o => o).map((opt, i) => `
                <div style="padding: 6px 0; color: #333;">${String.fromCharCode(65 + i)}) ${opt}</div>
              `).join('')}
            </div>
            <div class="correct-answer" style="background: #d4edda; padding: 10px; border-radius: 6px; color: #155724; font-weight: 600;">✓ Correct Answer: ${q.correct_answer}</div>
          `;
        } else if (q.question_type === 'enumeration') {
          qHtml += `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div class="question-number" style="flex: 1;">Q${idx + 1}: ${q.enumeration_title}</div>
              <span style="background: #17a2b8; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap;">📋 Enumeration</span>
            </div>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
              <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Instructions:</strong></p>
              <p style="color: #333; margin: 0; white-space: pre-wrap; font-size: 13px;">${q.enumeration_instruction}</p>
            </div>
            <div class="correct-answer" style="background: #d4edda; padding: 10px; border-radius: 6px; color: #155724; font-weight: 600;">📋 List ${q.enumeration_items || 'items'}</div>
          `;
        } else if (q.question_type === 'procedure') {
          qHtml += `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div class="question-number" style="flex: 1;">Q${idx + 1}: ${q.procedure_title}</div>
              <span style="background: #6f42c1; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap;">📖 Procedure</span>
            </div>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
              <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Procedure Content:</strong></p>
              <p style="color: #333; margin: 0 0 12px 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${q.procedure_content}</p>
              <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Instructions:</strong></p>
              <p style="color: #333; margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${q.procedure_instructions}</p>
            </div>
          `;
        }
        
        qHtml += `</div>`;
        return qHtml;
      }).join('');

      // Organize questions by type
      const multipleChoice = questions.filter(q => q.question_type === 'multiple_choice');
      const enumeration = questions.filter(q => q.question_type === 'enumeration');
      const procedure = questions.filter(q => q.question_type === 'procedure');
      const identification = questions.filter(q => q.question_type === 'identification');

      let sectionsHtml = '';
      
      if (multipleChoice.length > 0) {
        sectionsHtml += `
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%); border-left: 5px solid #007bff; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="color: #007bff; margin: 0 0 16px 0; font-size: 16px; font-weight: 700;">📝 Multiple Choice Questions (${multipleChoice.length})</h4>
            ${multipleChoice.map((q, idx) => `
              <div class="question-item" style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <div class="question-number" style="flex: 1;">Q${questions.indexOf(q) + 1}: ${q.question_text}</div>
                </div>
                <div class="question-options" style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                  ${[q.option_a, q.option_b, q.option_c, q.option_d].filter(o => o).map((opt, i) => `
                    <div style="padding: 6px 0; color: #333;">${String.fromCharCode(65 + i)}) ${opt}</div>
                  `).join('')}
                </div>
                <div class="correct-answer" style="background: #d4edda; padding: 10px; border-radius: 6px; color: #155724; font-weight: 600;">✓ Answer: ${q.correct_answer}</div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (enumeration.length > 0) {
        sectionsHtml += `
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%); border-left: 5px solid #17a2b8; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="color: #17a2b8; margin: 0 0 16px 0; font-size: 16px; font-weight: 700;">📋 Enumeration Questions (${enumeration.length})</h4>
            ${enumeration.map((q, idx) => `
              <div class="question-item" style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <div class="question-number" style="flex: 1;">Q${questions.indexOf(q) + 1}: ${q.enumeration_title}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                  <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Instructions:</strong></p>
                  <p style="color: #333; margin: 0; white-space: pre-wrap; font-size: 13px;">${q.enumeration_instruction}</p>
                </div>
                <div class="correct-answer" style="background: #d4edda; padding: 10px; border-radius: 6px; color: #155724; font-weight: 600;">📋 Items: ${q.enumeration_items || 'N/A'}</div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (procedure.length > 0) {
        sectionsHtml += `
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%); border-left: 5px solid #6f42c1; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="color: #6f42c1; margin: 0 0 16px 0; font-size: 16px; font-weight: 700;">📖 Procedure Questions (${procedure.length})</h4>
            ${procedure.map((q, idx) => `
              <div class="question-item" style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <div class="question-number" style="flex: 1;">Q${questions.indexOf(q) + 1}: ${q.procedure_title}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                  <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Content:</strong></p>
                  <p style="color: #333; margin: 0 0 12px 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${q.procedure_content}</p>
                  <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Instructions:</strong></p>
                  <p style="color: #333; margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${q.procedure_instructions}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (identification.length > 0) {
        sectionsHtml += `
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%); border-left: 5px solid #28a745; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="color: #28a745; margin: 0 0 16px 0; font-size: 16px; font-weight: 700;">🖼️ Identification Questions (${identification.length})</h4>
            ${identification.map((q, idx) => {
              let items = [];
              try {
                if (q.identification_items_json) {
                  items = JSON.parse(q.identification_items_json);
                }
              } catch (e) {
                console.error('Error parsing identification items:', e);
              }
              return `
              <div class="question-item" style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <div class="question-number" style="flex: 1;">Q${questions.indexOf(q) + 1}: ${q.identification_title}</div>
                </div>
                ${q.identification_image_url ? `
                  <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 10px; text-align: center;">
                    <img src="${q.identification_image_url}" style="max-width: 100%; max-height: 300px; border-radius: 4px;" alt="Reference image">
                  </div>
                ` : ''}
                <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                  <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Instructions:</strong></p>
                  <p style="color: #333; margin: 0 0 12px 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${q.identification_instruction}</p>
                  <p style="color: #666; margin: 0 0 8px 0; font-size: 13px;"><strong>Items to Identify:</strong></p>
                  ${items.length > 0 ? `
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 4px;">
                      ${items.map((item, i) => `
                        <div style="padding: 6px 0; border-bottom: 1px solid #eee;">
                          <strong>${i + 1}. ${item.text}</strong> → <span style="color: #28a745; font-weight: 600;">Answer: ${item.answer}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : '<p style="color: #999; margin: 0;">No items defined</p>'}
                </div>
              </div>
            `;
            }).join('')}
          </div>
        `;
      }

      // Calculate overall total items (including enumeration and identification items)
      let overallTotal = 0;
      questions.forEach(q => {
        if (q.question_type === 'enumeration' || q.question_type === 'identification') {
          try {
            let items = [];
            if (q.enumeration_items_json) {
              items = JSON.parse(q.enumeration_items_json);
            }
            overallTotal += items.length || 0;
          } catch (e) {
            overallTotal += parseInt(q.enumeration_items) || 0;
          }
        } else {
          overallTotal += 1;
        }
      });

      document.getElementById('viewModalTitle').textContent = exam.title;
      document.getElementById('modalBody').innerHTML = `
        <div style="background: linear-gradient(135deg, var(--navy) 0%, #1a3a52 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">${exam.title}</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px;">
            <div>
              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.8);">📚 Course</p>
              <p style="margin: 0; font-weight: 600;">${exam.title || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.8);">✓ Passing Score</p>
              <p style="margin: 0; font-weight: 600;">${exam.passing_score}%</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.8);">❓ Overall Total Items</p>
              <p style="margin: 0; font-weight: 600;">${overallTotal}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.8);">📅 Created</p>
              <p style="margin: 0; font-weight: 600;">${new Date(exam.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          ${exam.description ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
              <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.8); font-size: 12px;">Description</p>
              <p style="margin: 0; font-size: 13px;">${exam.description}</p>
            </div>
          ` : ''}
        </div>

        ${sectionsHtml || '<p style="color: #999; text-align: center; padding: 20px;">No questions added yet</p>'}
      `;
      document.getElementById('viewModalOverlay').classList.add('open');
    } else {
      showError('Error loading exam details');
    }
  } catch (err) {
    console.error('Error viewing exam:', err);
    showError('Error loading exam details: ' + err.message);
  }
}

// Edit from view modal
function editFromView() {
  closeViewModal();
  const examTitle = document.getElementById('viewModalTitle').textContent;
  const exam = allExams.find(e => e.title === examTitle);
  if (exam) {
    editExam(exam.id);
  }
}

// Close view modal
function closeViewModal() {
  document.getElementById('viewModalOverlay').classList.remove('open');
}

// Take exam
function takeExam(examId, examTitle) {
  // Get priority settings from the form
  const prioritySettings = {
    'multiple_choice': parseInt(document.getElementById('priority_multiple_choice')?.value || 1),
    'enumeration': parseInt(document.getElementById('priority_enumeration')?.value || 2),
    'procedure': parseInt(document.getElementById('priority_procedure')?.value || 3),
    'video': parseInt(document.getElementById('priority_video')?.value || 4)
  };
  
  // Save to localStorage
  localStorage.setItem(`exam_priority_${examId}`, JSON.stringify(prioritySettings));
  console.log('✅ Priority settings saved for exam', examId, ':', prioritySettings);
  
  // Use the universal take-exam page for all exams
  window.location.href = `take-exam.html?id=${examId}`;
}

// Show success message
// Show toast notification
function showNotification(message, type = 'success') {
  const container = document.getElementById('notificationContainer');
  
  // If container doesn't exist, create it
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.id = 'notificationContainer';
    newContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 3000;';
    document.body.appendChild(newContainer);
  }
  
  const finalContainer = document.getElementById('notificationContainer');
  const notification = document.createElement('div');
  notification.className = `modal-notification notification-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 18px; font-weight: bold;">${icons[type]}</span>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  
  finalContainer.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }
  }, 4000);
}

// Show success message (legacy - now uses toast)
function showSuccess(message) {
  showNotification(message, 'success');
}

// Show error message (legacy - now uses toast)
function showError(message) {
  showNotification(message, 'error');
}

// Show modal notification (for operations within modals)
function showModalNotification(message, type = 'success') {
  const modal = document.getElementById('examModal');
  if (modal.classList.contains('active')) {
    showNotification(message, type);
  } else {
    showNotification(message, type);
  }
}
