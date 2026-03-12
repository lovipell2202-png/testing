// Exam Management Dashboard
let questionsData = [];
let videosData = [];
let coursesData = [];
let hasUnsavedChanges = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCourses();
  setupExamTitleSearch();
  addMCQuestionForm(); // Add first question form
  
  // Warn before leaving if there are unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges && questionsData.length > 0) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
});

// Load courses from database
async function loadCourses() {
  try {
    const response = await fetch('/api/courses');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      coursesData = data.data;
      console.log('✅ Loaded courses:', coursesData.length);
    } else {
      console.error('Failed to load courses:', data);
    }
  } catch (err) {
    console.error('Error loading courses:', err);
  }
}

// Setup exam title search
function setupExamTitleSearch() {
  const examTitleInput = document.getElementById('examTitle');
  const dropdown = document.getElementById('examTitleDropdown');
  
  if (!examTitleInput || !dropdown) return;

  examTitleInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    if (!searchTerm) {
      dropdown.style.display = 'none';
      return;
    }

    const filtered = coursesData.filter(course => 
      course.course_title.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
      dropdown.innerHTML = '<div style="padding: 10px; color: #999;">No courses found</div>';
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = filtered.map(course => `
      <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;" 
           onmouseover="this.style.background='#f5f5f5'" 
           onmouseout="this.style.background='white'"
           onclick="selectExamTitle('${course.course_title.replace(/'/g, "\\'")}')">
        <strong>${course.course_title}</strong>
      </div>
    `).join('');

    dropdown.style.display = 'block';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (event.target !== examTitleInput && event.target.id !== 'examTitleDropdown') {
      dropdown.style.display = 'none';
    }
  });
}

// Select exam title from dropdown
function selectExamTitle(title) {
  document.getElementById('examTitle').value = title;
  document.getElementById('examTitleDropdown').style.display = 'none';
  console.log('✅ Exam title selected:', title);
}
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all sidebar items
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  
  // Add active class to clicked sidebar item
  event.target.classList.add('active');
}

// Switch question type
function switchQuestionType(type) {
  // Hide all question type contents
  document.querySelectorAll('.question-type-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.question-type-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected type
  document.getElementById(type).classList.add('active');
  
  // Add active class to clicked tab
  event.target.classList.add('active');
}

// Multiple Choice Functions
function addMCQuestionForm() {
  const container = document.getElementById('mcQuestionsContainer');
  const formId = 'mcForm_' + Date.now();
  
  const formHTML = `
    <div class="question-builder" id="${formId}">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4 style="margin: 0; color: var(--navy);">Question ${container.children.length + 1}</h4>
        <button onclick="removeMCQuestionForm('${formId}')" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove Form</button>
      </div>
      
      <div class="form-group">
        <label>Question Text *</label>
        <textarea class="mc-question-text" placeholder="Enter the question..."></textarea>
      </div>
      
      <div class="form-group">
        <label>Options</label>
        <div class="mc-options-group">
          <div class="option-input">
            <input type="text" placeholder="Option A" class="mc-option">
            <button onclick="removeMCOption(this)">Remove</button>
          </div>
          <div class="option-input">
            <input type="text" placeholder="Option B" class="mc-option">
            <button onclick="removeMCOption(this)">Remove</button>
          </div>
          <div class="option-input">
            <input type="text" placeholder="Option C" class="mc-option">
            <button onclick="removeMCOption(this)">Remove</button>
          </div>
          <div class="option-input">
            <input type="text" placeholder="Option D" class="mc-option">
            <button onclick="removeMCOption(this)">Remove</button>
          </div>
        </div>
        <button class="btn-add-option" onclick="addMCOption(this)">+ Add Option</button>
      </div>
      
      <div class="form-group">
        <label>Correct Answer *</label>
        <select class="mc-correct-answer">
          <option value="">Select correct answer...</option>
          <option value="A">Option A</option>
          <option value="B">Option B</option>
          <option value="C">Option C</option>
          <option value="D">Option D</option>
        </select>
      </div>
      
      <button class="btn-add-question" onclick="addMultipleChoiceQuestion('${formId}')" style="background: #28a745;">+ Add This Question</button>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', formHTML);
  console.log('✅ Question form added');
}

function removeMCQuestionForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.remove();
    console.log('✅ Question form removed');
  }
}

function addMCOption(button) {
  const optionsGroup = button.previousElementSibling;
  const optionCount = optionsGroup.children.length;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const letter = letters[optionCount] || String.fromCharCode(65 + optionCount);
  
  const optionInput = document.createElement('div');
  optionInput.className = 'option-input';
  optionInput.innerHTML = `
    <input type="text" placeholder="Option ${letter}" class="mc-option">
    <button onclick="removeMCOption(this)">Remove</button>
  `;
  optionsGroup.appendChild(optionInput);
}

function removeMCOption(button) {
  button.parentElement.remove();
}

function addMultipleChoiceQuestion(formId) {
  let form;
  
  if (formId) {
    form = document.getElementById(formId);
  } else {
    form = document.querySelector('.question-builder');
  }
  
  const question = form.querySelector('.mc-question-text')?.value.trim() || 
                   document.getElementById('mcQuestion')?.value.trim();
  const correctAnswer = form.querySelector('.mc-correct-answer')?.value || 
                        document.getElementById('mcCorrectAnswer')?.value;
  const options = Array.from(form.querySelectorAll('.mc-option')).map(opt => opt.value.trim()).filter(v => v);
  
  if (!question) {
    showError('Please enter a question');
    return;
  }
  
  if (options.length < 2) {
    showError('Please add at least 2 options');
    return;
  }
  
  if (!correctAnswer) {
    showError('Please select the correct answer');
    return;
  }
  
  const questionObj = {
    id: Date.now(),
    type: 'multiple_choice',
    question: question,
    options: options,
    correctAnswer: correctAnswer,
    points: 1
  };
  
  questionsData.push(questionObj);
  hasUnsavedChanges = true;
  updateQuestionsList();
  
  // Clear form
  if (formId) {
    form.remove();
  } else {
    document.getElementById('mcQuestion').value = '';
    document.getElementById('mcCorrectAnswer').value = '';
    document.querySelectorAll('.mc-option').forEach(opt => opt.value = '');
  }
  
  showSuccess('Multiple choice question added');
}

// Procedure Functions
function addProcedureQuestion() {
  const title = document.getElementById('procTitle').value.trim();
  const content = document.getElementById('procContent').value.trim();
  const instructions = document.getElementById('procInstructions').value.trim();
  
  if (!title || !content) {
    showError('Please fill in title and content');
    return;
  }
  
  const questionObj = {
    id: Date.now(),
    type: 'procedure',
    title: title,
    content: content,
    instructions: instructions
  };
  
  questionsData.push(questionObj);
  hasUnsavedChanges = true;
  updateQuestionsList();
  
  // Clear form
  document.getElementById('procTitle').value = '';
  document.getElementById('procContent').value = '';
  document.getElementById('procInstructions').value = '';
  
  showSuccess('Procedure section added');
}

// Enumeration Functions
function addEnumerationQuestion() {
  const title = document.getElementById('enumTitle').value.trim();
  const instruction = document.getElementById('enumInstruction').value.trim();
  const itemsText = document.getElementById('enumItems').value.trim();
  
  if (!title || !instruction || !itemsText) {
    showError('Please fill in all fields');
    return;
  }
  
  const items = itemsText.split('\n').map(item => item.trim()).filter(item => item);
  
  if (items.length === 0) {
    showError('Please add at least one item');
    return;
  }
  
  const questionObj = {
    id: Date.now(),
    type: 'enumeration',
    title: title,
    instruction: instruction,
    items: items
  };
  
  questionsData.push(questionObj);
  hasUnsavedChanges = true;
  updateQuestionsList();
  
  // Clear form
  document.getElementById('enumTitle').value = '';
  document.getElementById('enumInstruction').value = '';
  document.getElementById('enumItems').value = '';
  
  showSuccess('Enumeration section added');
}

// Update questions list display
function updateQuestionsList() {
  const preview = document.getElementById('questionsPreview');
  const count = document.getElementById('questionCount');
  
  count.textContent = questionsData.length;
  
  preview.innerHTML = questionsData.map((q, index) => `
    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <strong style="color: var(--navy);">Q${index + 1} (${q.type === 'multiple_choice' ? 'Multiple Choice' : q.type === 'procedure' ? 'Procedure' : 'Enumeration'})</strong>
          ${q.type === 'multiple_choice' ? `
            <p style="margin: 8px 0 0 0;">${q.question}</p>
            <div style="margin-top: 8px; font-size: 13px;">
              ${q.options.map((opt, i) => `<div>${String.fromCharCode(65 + i)}) ${opt}</div>`).join('')}
            </div>
            <p style="margin: 8px 0 0 0; color: #28a745;"><strong>Answer: ${q.correctAnswer}</strong></p>
          ` : q.type === 'procedure' ? `
            <p style="margin: 8px 0 0 0;"><strong>${q.title}</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 13px;">${q.content}</p>
            ${q.instructions ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #666;"><em>${q.instructions}</em></p>` : ''}
          ` : `
            <p style="margin: 8px 0 0 0;"><strong>${q.title}</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 13px;">${q.instruction}</p>
            <div style="margin-top: 8px; font-size: 13px;">
              ${q.items.map((item, i) => `<div>${i + 1}. ${item}</div>`).join('')}
            </div>
          `}
        </div>
        <div style="display: flex; gap: 5px;">
          <button onclick="editQuestion(${q.id})" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Edit</button>
          <button onclick="removeQuestion(${q.id})" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑 Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function editQuestion(id) {
  const question = questionsData.find(q => q.id === id);
  if (!question) return;

  if (question.type !== 'multiple_choice') {
    showError('Edit is only available for multiple choice questions');
    return;
  }

  // Show edit modal
  const modal = document.createElement('div');
  modal.id = 'editQuestionModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 8px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h3 style="margin: 0 0 20px 0; color: var(--navy);">Edit Question</h3>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">Question Text *</label>
        <textarea id="editQuestionText" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; min-height: 80px;">${question.question}</textarea>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">Options & Correct Answer</label>
        ${question.options.map((opt, i) => `
          <div style="margin-bottom: 12px; display: flex; gap: 10px; align-items: center;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">${String.fromCharCode(65 + i)})</label>
              <input type="text" id="editOption${i}" value="${opt}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <input type="radio" name="correctAnswer" value="${String.fromCharCode(65 + i)}" ${question.correctAnswer === String.fromCharCode(65 + i) ? 'checked' : ''} style="cursor: pointer;">
              <label style="font-size: 12px; cursor: pointer;">Correct</label>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="closeEditModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
        <button onclick="saveEditedQuestion(${id})" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Save Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeEditModal() {
  const modal = document.getElementById('editQuestionModal');
  if (modal) modal.remove();
}

function saveEditedQuestion(id) {
  const question = questionsData.find(q => q.id === id);
  if (!question) return;

  // Get updated question text
  const newQuestion = document.getElementById('editQuestionText').value.trim();
  if (!newQuestion) {
    showError('Question text cannot be empty');
    return;
  }

  // Get updated options
  const newOptions = [];
  for (let i = 0; i < 4; i++) {
    const opt = document.getElementById(`editOption${i}`).value.trim();
    if (!opt) {
      showError(`Option ${String.fromCharCode(65 + i)} cannot be empty`);
      return;
    }
    newOptions.push(opt);
  }

  // Get correct answer
  const correctAnswer = document.querySelector('input[name="correctAnswer"]:checked').value;

  // Update question
  question.question = newQuestion;
  question.options = newOptions;
  question.correctAnswer = correctAnswer;

  hasUnsavedChanges = true;
  closeEditModal();
  updateQuestionsList();
  showSuccess('✅ Question updated successfully');
}

function removeQuestion(id) {
  questionsData = questionsData.filter(q => q.id !== id);
  hasUnsavedChanges = true;
  updateQuestionsList();
  showSuccess('Question removed');
}

function addBulkQuestions() {
  const bulkInput = document.getElementById('bulkQuestionsInput').value.trim();
  
  console.log('Bulk input:', bulkInput);
  
  if (!bulkInput) {
    showError('Please enter questions');
    return;
  }

  const lines = bulkInput.split('\n').map(line => line.trim());
  console.log('Total lines:', lines.length);
  console.log('Lines:', lines);
  
  let addedCount = 0;
  let i = 0;

  while (i < lines.length) {
    // Skip empty lines
    while (i < lines.length && !lines[i]) {
      i++;
    }
    
    if (i >= lines.length) break;

    // Get question
    const question = lines[i];
    console.log('Question:', question);
    i++;

    // Get 4 options
    const options = [];
    for (let j = 0; j < 4; j++) {
      if (i >= lines.length || !lines[i]) {
        console.warn(`Missing option ${j + 1} for question: ${question}`);
        break;
      }
      options.push(lines[i]);
      console.log(`Option ${String.fromCharCode(65 + j)}:`, lines[i]);
      i++;
    }

    // Only add if we have all 4 options
    if (options.length === 4 && question) {
      const questionObj = {
        id: Date.now() + addedCount,
        type: 'multiple_choice',
        question: question,
        options: options,
        correctAnswer: 'D',
        points: 1
      };

      questionsData.push(questionObj);
      console.log('Added question:', questionObj);
      addedCount++;
    }
  }

  console.log('Total added:', addedCount);
  console.log('questionsData:', questionsData);

  if (addedCount > 0) {
    updateQuestionsList();
    document.getElementById('bulkQuestionsInput').value = '';
    hasUnsavedChanges = true;
    showSuccess(`✅ Added ${addedCount} question${addedCount !== 1 ? 's' : ''}`);
  } else {
    showError('No valid questions found. Make sure each question has exactly 4 options, separated by blank lines.');
  }
}

function testBulkAdd() {
  const sampleText = `Is a system for organizing spaces so work can be performed efficiently?
5M
3S
FOD
5S

I designate a place for every needed item so that anyone can find it.
Organize
Designate
Arrange
Allocate`;

  document.getElementById('bulkQuestionsInput').value = sampleText;
  showSuccess('Sample questions loaded. Click "Add All Questions" to test.');
}

// Video Functions
document.addEventListener('DOMContentLoaded', () => {
  const videoFile = document.getElementById('videoFile');
  if (videoFile) {
    videoFile.addEventListener('change', handleVideoUpload);
  }
});

function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const videoObj = {
    id: Date.now(),
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
  };
  
  videosData.push(videoObj);
  updateVideoList();
  showSuccess('Video added: ' + file.name);
}

function updateVideoList() {
  const videoList = document.getElementById('videoList');
  
  if (videosData.length === 0) {
    videoList.style.display = 'none';
    return;
  }
  
  videoList.style.display = 'block';
  videoList.innerHTML = `
    <h4 style="margin-top: 0;">Videos Added (${videosData.length})</h4>
    ${videosData.map(video => `
      <div class="video-item">
        <div>
          <strong>📹 ${video.name}</strong><br>
          <small style="color: #666;">${video.size}</small>
        </div>
        <button onclick="removeVideo(${video.id})">Remove</button>
      </div>
    `).join('')}
  `;
}

function removeVideo(id) {
  videosData = videosData.filter(v => v.id !== id);
  updateVideoList();
  showSuccess('Video removed');
}

// Save Exam
async function saveExam() {
  const title = document.getElementById('examTitle').value.trim();
  const courseTitle = document.getElementById('examTitle').value.trim(); // Get course title from search input
  const courseCode = document.getElementById('courseCode').value.trim();
  const description = document.getElementById('examDescription').value.trim();
  
  if (!title) {
    showError('Please enter exam title');
    return;
  }
  
  if (questionsData.length === 0) {
    showError('Please add at least one question');
    return;
  }
  
  try {
    // Prepare exam data
    const examData = {
      title: title,
      course_title: courseTitle,
      course_code: courseCode,
      description: description,
      question_count: questionsData.length,
      questions: questionsData
    };
    
    // Save to database via API
    const response = await fetch('/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(examData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess('✅ Exam saved successfully!');
      
      // Reset form after delay
      setTimeout(() => {
        document.getElementById('examTitle').value = '';
        document.getElementById('courseCode').value = '';
        document.getElementById('examDescription').value = '';
        questionsData = [];
        videosData = [];
        hasUnsavedChanges = false;
        updateQuestionsList();
        updateVideoList();
      }, 1500);
    } else {
      showError('Error saving exam: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error saving exam:', error);
    showError('Error saving exam. Please try again.');
  }
}

// Message Functions
function showSuccess(message) {
  const msgDiv = document.getElementById('successMessage');
  msgDiv.textContent = '✅ ' + message;
  msgDiv.style.display = 'block';
  setTimeout(() => {
    msgDiv.style.display = 'none';
  }, 3000);
}

function showError(message) {
  const msgDiv = document.getElementById('errorMessage');
  msgDiv.textContent = '❌ ' + message;
  msgDiv.style.display = 'block';
  setTimeout(() => {
    msgDiv.style.display = 'none';
  }, 3000);
}
