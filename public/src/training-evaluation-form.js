// Training Evaluation Form JavaScript

let currentTrainingData = null;
let currentTeefId = null;
let allTrainings = [];
let allEmployees = [];
let allSpeakers = [];
let allVenues = [];
let employeePositionMap = {}; // Map employee name to position

// Load trainings and populate dropdown
async function loadTrainings() {
  try {
    const response = await fetch('/api/courses');
    const data = await response.json();
    if (data.success && data.data) {
      allTrainings = data.data;
      // No need to populate dropdown for text input
    }
  } catch (err) {
    console.error('Error loading trainings:', err);
  }
}

// Load employee trainings and populate dropdown
async function loadEmployeeTrainings(employeeName) {
  try {
    console.log('🔍 loadEmployeeTrainings called with:', employeeName);
    console.log('📊 allEmployees:', allEmployees);
    
    // Find employee ID from name
    const employee = allEmployees.find(e => e.full_name === employeeName);
    if (!employee) {
      console.warn('❌ Employee not found:', employeeName);
      console.log('Available employees:', allEmployees.map(e => ({ id: e.id, full_name: e.full_name })));
      
      const titleSelect = document.getElementById('training_title');
      titleSelect.innerHTML = '<option value="">-- Employee not found --</option>';
      return;
    }
    
    console.log('✅ Found employee:', { id: employee.id, full_name: employee.full_name });
    
    const url = `/api/trainings/employee/${employee.id}`;
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('📥 API Response:', data);
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Found', data.data.length, 'trainings');
      populateTrainingTitleDropdown(data.data);
    } else {
      console.warn('⚠️ No trainings found for employee:', employeeName);
      // Show empty dropdown with message
      const titleSelect = document.getElementById('training_title');
      titleSelect.innerHTML = '<option value="">-- No trainings found for this employee --</option>';
    }
  } catch (err) {
    console.error('❌ Error loading employee trainings:', err);
  }
}

// Populate training title dropdown with employee's trainings
function populateTrainingTitleDropdown(trainings) {
  const datalist = document.getElementById('training_list');
  
  // Clear and populate datalist
  datalist.innerHTML = '';
  trainings.forEach(training => {
    const option = document.createElement('option');
    option.value = training.course_title;
    datalist.appendChild(option);
  });
}

// Validate training title for keywords
function validateTrainingTitle(title) {
  const keywords = ['W/EXAM_TEEF', 'W/BOTH', 'EXAM', 'TEST', 'FORM', 'TEEF'];
  const titleUpper = title.toUpperCase();
  const foundKeywords = keywords.filter(keyword => titleUpper.includes(keyword));
  
  return {
    isValid: foundKeywords.length === 0,
    keywords: foundKeywords
  };
}

// Setup training title validation
function setupTrainingTitleValidation() {
  const titleInput = document.getElementById('training_title');
  let isInitialLoad = true;
  
  // Create modal for notifications
  const modal = document.createElement('div');
  modal.id = 'validation_modal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: #fefefe;
    margin: 10% auto;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
  `;
  
  const modalMessage = document.createElement('p');
  modalMessage.id = 'modal_message';
  modalMessage.style.cssText = `
    font-size: 14px;
    margin: 0 0 15px 0;
    font-weight: 500;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'OK';
  closeBtn.style.cssText = `
    padding: 8px 20px;
    background-color: #4169e1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  };
  
  modalContent.appendChild(modalMessage);
  modalContent.appendChild(closeBtn);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  titleInput.addEventListener('blur', async function() {
    console.log('📝 Training title blur event, value:', this.value);
    
    // Skip modal on initial load
    if (isInitialLoad) {
      isInitialLoad = false;
      console.log('⏭️ Skipping modal on initial load');
      return;
    }
    
    if (this.value) {
      const validation = validateTrainingTitle(this.value);
      console.log('🔍 Validation result:', validation);
      
      // Show orange warning for W/EXAM_TEEF or W/BOTH (contains both EXAM and TEEF)
      if (validation.keywords.includes('W/EXAM_TEEF') || validation.keywords.includes('W/BOTH')) {
        console.log('⚠️ W/EXAM_TEEF or W/BOTH keyword found');
        modalMessage.textContent = `⚠️ Warning: This training contains BOTH TEEF Form AND EXAM - Please ensure both attachments are uploaded`;
        modalMessage.style.color = '#ff9800';
        modal.style.display = 'block';
      }
      // Show orange warning for EXAM only
      else if (validation.keywords.includes('EXAM')) {
        console.log('⚠️ EXAM keyword found');
        modalMessage.textContent = `⚠️ Warning: Training title contains "EXAM" - This training may have associated exam`;
        modalMessage.style.color = '#ff9800';
        modal.style.display = 'block';
      }
      // Check for TEST/FORM/TEEF attachment
      else if (validation.keywords.includes('TEST') || validation.keywords.includes('FORM') || validation.keywords.includes('TEEF')) {
        console.log('🔎 Checking for attachment...');
        await checkTestFormAttachmentModal(this.value, modal, modalMessage);
      } else {
        // No keywords - close modal
        modal.style.display = 'none';
        console.log('✅ No keywords found');
      }
      
      // Fetch and display attachments
      await fetchAndDisplayAttachments(this.value);
    }
  });
}

// Check if TEST FORM has attachment (with modal)
async function checkTestFormAttachmentModal(trainingTitle, modal, modalMessage) {
  try {
    console.log('🔍 Checking attachment for:', trainingTitle);
    const url = `/api/test-form-attachment?title=${encodeURIComponent(trainingTitle)}`;
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📥 Full response:', data);
    console.log('Has attachment:', data.hasAttachment);
    
    if (data.success && data.hasAttachment === true) {
      // Green notification - has attachment
      console.log('✅ GREEN - Attachment found');
      modalMessage.textContent = '✅ Test Form Attachment: Found';
      modalMessage.style.color = '#155724';
      modal.style.display = 'block';
    } else if (data.success && data.hasAttachment === false) {
      // Red notification - no attachment
      console.log('❌ RED - Attachment not found');
      modalMessage.textContent = '❌ Test Form Attachment: Not Found - Please upload test form';
      modalMessage.style.color = '#721c24';
      modal.style.display = 'block';
    } else {
      console.warn('⚠️ Unexpected response format:', data);
    }
  } catch (err) {
    console.error('❌ Error checking test form attachment:', err);
  }
}

// Check if TEST FORM has attachment
async function checkTestFormAttachment(trainingTitle, attachmentMsg) {
  try {
    console.log('🔍 Checking attachment for:', trainingTitle);
    const url = `/api/test-form-attachment?title=${encodeURIComponent(trainingTitle)}`;
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📥 Full response:', data);
    console.log('Has attachment:', data.hasAttachment);
    console.log('Response type:', typeof data.hasAttachment);
    
    if (data.success && data.hasAttachment === true) {
      // Green notification - has attachment
      console.log('✅ GREEN - Attachment found');
      attachmentMsg.style.backgroundColor = '#d4edda';
      attachmentMsg.style.color = '#155724';
      attachmentMsg.style.border = '1px solid #c3e6cb';
      attachmentMsg.textContent = '✅ Test Form Attachment: Found';
      attachmentMsg.style.display = 'block';
    } else if (data.success && data.hasAttachment === false) {
      // Red notification - no attachment
      console.log('❌ RED - Attachment not found');
      attachmentMsg.style.backgroundColor = '#f8d7da';
      attachmentMsg.style.color = '#721c24';
      attachmentMsg.style.border = '1px solid #f5c6cb';
      attachmentMsg.textContent = '❌ Test Form Attachment: Not Found - Please upload test form';
      attachmentMsg.style.display = 'block';
    } else {
      console.warn('⚠️ Unexpected response format:', data);
    }
  } catch (err) {
    console.error('❌ Error checking test form attachment:', err);
  }
}

// Fetch and display attachments (EXAM and TEEF)
async function fetchAndDisplayAttachments(courseTitle) {
  try {
    console.log('🔍 Fetching attachments for course:', courseTitle);
    
    // Fetch all trainings and filter by course title
    const response = await fetch(`/api/trainings`);
    const data = await response.json();
    
    console.log('📥 Attachments response:', data);
    
    const examAttachmentEl = document.getElementById('exam_attachment');
    const teefAttachmentEl = document.getElementById('teef_attachment');
    const noAttachmentsEl = document.getElementById('no_attachments');
    const examLink = document.getElementById('exam_link');
    const teefLink = document.getElementById('teef_link');
    
    let hasExam = false;
    let hasTeef = false;
    
    // Get the data array from response
    let trainings = [];
    if (data.success && Array.isArray(data.data)) {
      trainings = data.data;
    } else if (Array.isArray(data)) {
      trainings = data;
    }
    
    // Find the training record matching the course title
    const training = trainings.find(t => t.course_title === courseTitle);
    
    if (training) {
      // Check for EXAM attachment
      if (training.exam_form_url) {
        hasExam = true;
        examLink.href = training.exam_form_url;
        examLink.target = '_blank';
        examAttachmentEl.style.display = 'inline';
        console.log('✅ EXAM attachment found:', training.exam_form_url);
      }
      
      // Check for TEEF attachment
      if (training.eff_form_file) {
        hasTeef = true;
        teefLink.href = training.eff_form_file;
        teefLink.target = '_blank';
        teefAttachmentEl.style.display = 'inline';
        console.log('✅ TEEF attachment found:', training.eff_form_file);
      }
    }
    
    // Show/hide elements based on attachments
    if (hasExam || hasTeef) {
      noAttachmentsEl.style.display = 'none';
      if (!hasExam) examAttachmentEl.style.display = 'none';
      if (!hasTeef) teefAttachmentEl.style.display = 'none';
    } else {
      examAttachmentEl.style.display = 'none';
      teefAttachmentEl.style.display = 'none';
      noAttachmentsEl.style.display = 'inline';
      console.log('❌ No attachments found');
    }
  } catch (err) {
    console.error('❌ Error fetching attachments:', err);
    document.getElementById('no_attachments').style.display = 'inline';
  }
}

// Load employees and populate dropdowns
async function loadEmployees() {
  try {
    console.log('📡 Fetching employees from /api/employees');
    const response = await fetch('/api/employees');
    const data = await response.json();
    console.log('📥 Employees API Response:', data);
    
    if (data.success && data.data) {
      allEmployees = data.data;
      console.log('✅ Loaded', allEmployees.length, 'employees');
      console.log('Employee IDs:', allEmployees.map(e => ({ id: e.id, full_name: e.full_name })));
      populateEmployeeDropdowns();
    }
  } catch (err) {
    console.error('❌ Error loading employees:', err);
  }
}

// Load speakers and populate datalist
async function loadSpeakers() {
  // Speakers are now text inputs, no need to load
}

// Load venues and populate dropdown
async function loadVenues() {
  // Venues are now text inputs, no need to load
}

// Setup date input formatting
function setupDateFormatting() {
  const dateInput = document.getElementById('training_date');
  
  // Create error message element
  const errorMsg = document.createElement('div');
  errorMsg.id = 'training_date_error';
  errorMsg.style.cssText = `
    color: #dc3545;
    font-size: 8pt;
    margin-top: 4px;
    display: none;
  `;
  dateInput.parentNode.appendChild(errorMsg);
  
  dateInput.addEventListener('input', function() {
    // Remove all non-digits
    let value = this.value.replace(/\D/g, '');
    
    if (value.length > 0) {
      // Format as MM-DD-YYYY automatically
      if (value.length <= 2) {
        this.value = value;
      } else if (value.length <= 4) {
        this.value = value.slice(0, 2) + '-' + value.slice(2);
      } else {
        this.value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 8);
      }
    }
    
    // Clear error on input
    this.style.borderBottom = '1px solid #000';
    this.style.backgroundColor = 'transparent';
    errorMsg.style.display = 'none';
  });
  
  dateInput.addEventListener('blur', function() {
    if (this.value) {
      // Validate date format MM-DD-YYYY
      const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-(\d{4})$/;
      
      if (!dateRegex.test(this.value)) {
        // Show error styling and message
        this.style.borderBottom = '2px solid #dc3545';
        this.style.backgroundColor = '#fff5f5';
        errorMsg.textContent = '❌ Invalid date format. Please use MM-DD-YYYY (Example: 01-31-2026)';
        errorMsg.style.display = 'block';
      } else {
        // Valid date - reset styling
        this.style.borderBottom = '1px solid #000';
        this.style.backgroundColor = 'transparent';
        errorMsg.style.display = 'none';
      }
    }
  });
  
  dateInput.addEventListener('focus', function() {
    // Reset styling when user focuses on field
    this.style.borderBottom = '1px solid #000';
    this.style.backgroundColor = 'transparent';
    errorMsg.style.display = 'none';
  });
}

// Populate employee name dropdown
function populateEmployeeDropdowns() {
  const nameSelect = document.getElementById('participant_name');
  const positionSelect = document.getElementById('position');
  
  // Clear and populate name dropdown
  nameSelect.innerHTML = '<option value="">-- Select Employee --</option>';
  const uniqueNames = [...new Set(allEmployees.map(e => e.full_name))].sort();
  uniqueNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    // Store employee ID in data attribute
    const employee = allEmployees.find(e => e.full_name === name);
    if (employee) {
      option.dataset.employeeId = employee.id;
    }
    nameSelect.appendChild(option);
  });
  
  // Populate position dropdown from unique positions in employees
  positionSelect.innerHTML = '<option value="">-- Select Position --</option>';
  const uniquePositions = [...new Set(allEmployees.map(e => e.position).filter(p => p))].sort();
  uniquePositions.forEach(position => {
    const option = document.createElement('option');
    option.value = position;
    option.textContent = position;
    positionSelect.appendChild(option);
  });
  
  // Add event listener to load trainings when employee is selected
  nameSelect.addEventListener('change', (e) => {
    const selectedName = e.target.value;
    if (selectedName) {
      loadEmployeeTrainings(selectedName);
      // Auto-fill position from employee data
      const employee = allEmployees.find(emp => emp.full_name === selectedName);
      if (employee && employee.position) {
        document.getElementById('position').value = employee.position;
      }
    } else {
      // Clear training title if no employee selected
      document.getElementById('training_title').value = '';
      const datalist = document.getElementById('training_list');
      if (datalist) {
        datalist.innerHTML = '';
      }
    }
  });
}

// Populate venue dropdown
function populateVenueDropdown(venues) {
  // Venues are now text inputs, no need to populate
}

// Populate speaker datalist and select
function populateSpeakerDatalist(speakers) {
  // Speakers are now text inputs, no need to populate
  
  // Populate select dropdown if exists
  if (select) {
    select.innerHTML = '<option value="">-- Select Speaker --</option>';
    
    speakers.forEach(speaker => {
      const option = document.createElement('option');
      option.value = speaker;
      option.textContent = speaker;
      select.appendChild(option);
    });
  }
}

// Setup add buttons for new values
// View-only mode — disables all inputs and shows a read-only banner
function enableViewMode() {
  // Wait for form to be populated, then lock everything
  setTimeout(() => {
    // Disable all inputs, selects, textareas, checkboxes
    document.querySelectorAll('input, select, textarea').forEach(el => {
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.85';
    });

    // Show view-only banner at top
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#1a2340;color:#fff;text-align:center;padding:10px;font-size:13px;font-weight:700;z-index:9999;letter-spacing:1px;';
    banner.textContent = '👁 VIEW ONLY — This TEEF record is read-only';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
  }, 800);

  // Also add print button for convenience
  addPrintButton();
}

// Handle form initialization
document.addEventListener('DOMContentLoaded', () => {
  loadTrainings();
  loadEmployees();
  setupDateFormatting();
  setupTrainingTitleValidation();
  setupCheckboxes();
  setupTextInputUppercase();
  addBackButton();

  const isViewMode = new URLSearchParams(window.location.search).get('view') === '1';
  if (isViewMode) {
    enableViewMode();
  } else {
    addPrintButton();
    addSaveButton();
  }

  loadFormData();
});

// Function to populate form with data
function populateForm(data) {
  if (!data) return;

  console.log('📋 Populating form with data:', data);

  // Populate training title (text input with datalist)
  const trainingTitleInput = document.getElementById('training_title');
  if (trainingTitleInput) {
    const courseTitle = data.course_title || data.training_title || '';
    trainingTitleInput.value = courseTitle;
    console.log('✅ Training title set to:', courseTitle);
  }

  // Populate resource speaker
  const resourceSpeakerInput = document.getElementById('resource_speaker');
  if (resourceSpeakerInput) {
    resourceSpeakerInput.value = data.trainer || data.resource_speaker || '';
  }

  // Populate participant name (select dropdown)
  const participantSelect = document.getElementById('participant_name');
  if (participantSelect) {
    const participantName = data.full_name || data.employee_name || data.participant_name || '';
    participantSelect.value = participantName;
    console.log('✅ Participant name set to:', participantName);
  }

  // Populate training date in MM-DD-YYYY format
  const trainingDateInput = document.getElementById('training_date');
  if (trainingDateInput) {
    let dateValue = '';
    if (data.date_from) {
      // Convert date_from to MM-DD-YYYY format
      const dateObj = new Date(data.date_from);
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const year = dateObj.getFullYear();
      dateValue = `${month}-${day}-${year}`;
    } else if (data.training_date) {
      dateValue = data.training_date;
    }
    trainingDateInput.value = dateValue;
    console.log('✅ Training date set to:', dateValue);
  }

  // Populate position (select dropdown) - fetch from TrainingRecords
  const positionSelect = document.getElementById('position');
  if (positionSelect && data.position) {
    positionSelect.value = data.position;
    console.log('✅ Position set to:', data.position);
  }

  // Populate venue (select dropdown) - fetch from TrainingRecords
  const venueSelect = document.getElementById('venue');
  if (venueSelect && data.venue) {
    venueSelect.value = data.venue;
    console.log('✅ Venue set to:', data.venue);
  }

  console.log('✅ Form population complete');
}

// Format date helper
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format date for input field
function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// Setup automatic uppercase for text inputs
function setupTextInputUppercase() {
  const textInputs = document.querySelectorAll('input[type="text"]');
  
  textInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
  });
}

// Handle checkbox behavior - only one per row per section
function setupCheckboxes() {
  const tables = document.querySelectorAll('.evaluation-table, .applied-skills-table');
  
  tables.forEach(table => {
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const checkboxes = row.querySelectorAll('input[type="checkbox"]');
      
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          if (this.checked) {
            // For applied skills table: separate Before and After
            const dataSection = this.getAttribute('data-section');
            
            if (dataSection === 'applied-before' || dataSection === 'applied-after') {
              // Only uncheck others in the same section (Before or After)
              checkboxes.forEach(cb => {
                if (cb !== this && cb.getAttribute('data-section') === dataSection) {
                  cb.checked = false;
                }
              });
            } else {
              // For other tables: uncheck all others in the row
              checkboxes.forEach(cb => {
                if (cb !== this) {
                  cb.checked = false;
                }
              });
            }
          }
          // Recalculate scores
          calculateScores();
        });
      });
    });
  });
}

// Calculate overall and average scores
function calculateScores() {
  // PAGE 1: Program Contents + Trainer + Transfer Quotient
  const programChecks = document.querySelectorAll('input[data-section="program"]:checked');
  const trainerChecks = document.querySelectorAll('input[data-section="trainer"]:checked');
  const transferChecks = document.querySelectorAll('input[data-section="transfer"]:checked');
  
  let page1Total = 0;
  let page1Count = 0;
  
  programChecks.forEach(cb => {
    page1Total += parseInt(cb.value);
    page1Count++;
  });
  trainerChecks.forEach(cb => {
    page1Total += parseInt(cb.value);
    page1Count++;
  });
  transferChecks.forEach(cb => {
    page1Total += parseInt(cb.value);
    page1Count++;
  });
  
  // Page 1 Calculations
  const overallScore = page1Total; // Sum of all checked values
  const totalAverageScore = page1Count > 0 ? (page1Total / page1Count).toFixed(2) : 0; // GWA
  
  // Update Page 1 score fields
  const overallScoreField = document.getElementById('overall_score');
  const totalAverageField = document.getElementById('total_average_score');
  
  if (overallScoreField) overallScoreField.value = overallScore > 0 ? overallScore : '';
  if (totalAverageField) totalAverageField.value = totalAverageScore > 0 ? totalAverageScore : '';
  
  // PAGE 2: Applied Skills - SEPARATE CALCULATIONS
  const appliedBeforeChecks = document.querySelectorAll('input[data-section="applied-before"]:checked');
  const appliedAfterChecks = document.querySelectorAll('input[data-section="applied-after"]:checked');
  
  let appliedBeforeTotal = 0;
  let appliedBeforeCount = 0;
  appliedBeforeChecks.forEach(cb => {
    appliedBeforeTotal += parseInt(cb.value);
    appliedBeforeCount++;
  });
  
  let appliedAfterTotal = 0;
  let appliedAfterCount = 0;
  appliedAfterChecks.forEach(cb => {
    appliedAfterTotal += parseInt(cb.value);
    appliedAfterCount++;
  });
  
  // Update Page 2 Applied Skills fields
  const appliedBeforeTotalField = document.getElementById('applied_before_total');
  const appliedAfterTotalField = document.getElementById('applied_after_total');
  const appliedBeforeAvgField = document.getElementById('applied_before_avg');
  const appliedAfterAvgField = document.getElementById('applied_after_avg');
  
  if (appliedBeforeTotalField) appliedBeforeTotalField.value = appliedBeforeTotal > 0 ? appliedBeforeTotal : '';
  if (appliedAfterTotalField) appliedAfterTotalField.value = appliedAfterTotal > 0 ? appliedAfterTotal : '';
  if (appliedBeforeAvgField) appliedBeforeAvgField.value = appliedBeforeCount > 0 ? (appliedBeforeTotal / appliedBeforeCount).toFixed(2) : '';
  if (appliedAfterAvgField) appliedAfterAvgField.value = appliedAfterCount > 0 ? (appliedAfterTotal / appliedAfterCount).toFixed(2) : '';
  
  // PAGE 2: Business Results - SEPARATE CALCULATION
  const businessChecks = document.querySelectorAll('input[data-section="business"]:checked');
  
  let businessTotal = 0;
  let businessCount = 0;
  businessChecks.forEach(cb => {
    businessTotal += parseInt(cb.value);
    businessCount++;
  });
  
  // Update Page 2 Business Result fields
  const businessTotalField = document.getElementById('business_total');
  const businessAvgField = document.getElementById('business_avg');
  
  if (businessTotalField) businessTotalField.value = businessTotal > 0 ? businessTotal : '';
  if (businessAvgField) businessAvgField.value = businessCount > 0 ? (businessTotal / businessCount).toFixed(2) : '';
}

// Collect form data
function collectFormData() {
  // Get training date from input (already in MM-DD-YYYY format)
  const trainingDate = document.getElementById('training_date').value;
  
  // Get training title from text input (not a select)
  const trainingTitleInput = document.getElementById('training_title');
  const courseTitle = trainingTitleInput ? trainingTitleInput.value : '';
  
  const data = {
    training_id: currentTrainingData?.id || null,
    employee_id: currentTrainingData?.employee_id || null,
    course_title: courseTitle,
    resource_speaker: document.getElementById('resource_speaker')?.value || '',
    participant_name: document.getElementById('participant_name')?.value || '',
    training_date: trainingDate,
    position: document.getElementById('position')?.value || '',
    venue: document.getElementById('venue')?.value || '',
    
    // Page 1 ratings
    program_ratings: [],
    trainer_ratings: [],
    transfer_ratings: [],
    
    // Page 1 scores
    overall_score: document.getElementById('overall_score')?.value || '',
    total_average_score: document.getElementById('total_average_score')?.value || '',
    page1_remarks_1: document.querySelector('.remarks-textarea:nth-of-type(1)')?.value || '',
    page1_remarks_2: document.querySelector('.remarks-textarea:nth-of-type(2)')?.value || '',
    overall_remarks: document.querySelector('.remarks-box textarea')?.value || '',
    
    // Page 2 Applied Skills
    applied_before_ratings: [],
    applied_after_ratings: [],
    applied_before_total: document.getElementById('applied_before_total')?.value || '',
    applied_before_avg: document.getElementById('applied_before_avg')?.value || '',
    applied_after_total: document.getElementById('applied_after_total')?.value || '',
    applied_after_avg: document.getElementById('applied_after_avg')?.value || '',
    
    // Page 2 Business Results
    business_ratings: [],
    business_feedbacks: [],
    business_total: document.getElementById('business_total')?.value || '',
    business_avg: document.getElementById('business_avg')?.value || '',
    page2_remarks_1: document.getElementById('page2_remarks_1')?.value || '',
    page2_remarks_2: document.getElementById('page2_remarks_2')?.value || ''
  };
  
  // Collect program ratings
  document.querySelectorAll('input[data-section="program"]:checked').forEach(cb => {
    data.program_ratings.push(parseInt(cb.value));
  });
  
  // Collect trainer ratings
  document.querySelectorAll('input[data-section="trainer"]:checked').forEach(cb => {
    data.trainer_ratings.push(parseInt(cb.value));
  });
  
  // Collect transfer ratings
  document.querySelectorAll('input[data-section="transfer"]:checked').forEach(cb => {
    data.transfer_ratings.push(parseInt(cb.value));
  });
  
  // Collect applied skills ratings
  document.querySelectorAll('input[data-section="applied-before"]:checked').forEach(cb => {
    data.applied_before_ratings.push(parseInt(cb.value));
  });
  
  document.querySelectorAll('input[data-section="applied-after"]:checked').forEach(cb => {
    data.applied_after_ratings.push(parseInt(cb.value));
  });
  
  // Collect business ratings and feedback
  document.querySelectorAll('input[data-section="business"]:checked').forEach(cb => {
    data.business_ratings.push(parseInt(cb.value));
  });
  
  document.querySelectorAll('.feedback-input').forEach(input => {
    data.business_feedbacks.push(input.value);
  });
  
  return data;
}

// Close validation modal
function closeValidationModal() {
  document.getElementById('validationModal').style.display = 'none';
}

// Page 2 due notification modal
let _pendingSaveAfterNotice = false;

function closePage2DueModal(proceed) {
  document.getElementById('page2DueModal').style.display = 'none';
  if (proceed) {
    _pendingSaveAfterNotice = true;
    saveForm();
  }
}

function getMonthsElapsed() {
  const trainingDateRaw = document.getElementById('training_date')?.value?.trim();
  if (!trainingDateRaw) return 0;
  const parts = trainingDateRaw.split('-');
  if (parts.length !== 3) return 0;
  const trainingDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
  if (isNaN(trainingDate)) return 0;
  const today = new Date();
  return (today.getFullYear() - trainingDate.getFullYear()) * 12 + (today.getMonth() - trainingDate.getMonth());
}

function checkPage2Due() {
  const monthsElapsed = getMonthsElapsed();
  const notices = [];

  const appliedBeforeEmpty = document.querySelectorAll('input[data-section="applied-before"]:checked').length === 0;
  const appliedAfterEmpty = document.querySelectorAll('input[data-section="applied-after"]:checked').length === 0;
  const businessEmpty = document.querySelectorAll('input[data-section="business"]:checked').length === 0;

  // Only show "coming up" notices for sections not yet due
  if (monthsElapsed < 3 && appliedBeforeEmpty) {
    notices.push(`<li style="margin-bottom:10px;"><strong>I. Job Application – Before & After Training</strong><br>Due in <strong>${3 - monthsElapsed} month(s)</strong>. The immediate superior must fill this up 3 months after the training.</li>`);
  }
  if (monthsElapsed < 6 && businessEmpty) {
    notices.push(`<li style="margin-bottom:10px;"><strong>II. Business Result / Return of Investment</strong><br>Due in <strong>${6 - monthsElapsed} month(s)</strong>. The immediate superior must fill this up 6 months after the training.</li>`);
  }

  return notices.length ? notices : null;
}

// Show validation modal with error messages
function showValidationModal(errors) {
  const messageDiv = document.getElementById('validationMessage');
  let html = '<ul style="margin: 0; padding-left: 20px;">';
  errors.forEach(error => {
    html += `<li style="margin-bottom: 10px; color: #dc3545; font-weight: 500;">${error}</li>`;
  });
  html += '</ul>';
  messageDiv.innerHTML = html;
  document.getElementById('validationModal').style.display = 'flex';
}

// Validate required fields
function validateRequiredFields() {
  const errors = [];
  
  const trainingTitle = document.getElementById('training_title')?.value?.trim();
  const resourceSpeaker = document.getElementById('resource_speaker')?.value?.trim();
  const participantName = document.getElementById('participant_name')?.value?.trim();
  const trainingDate = document.getElementById('training_date')?.value?.trim();
  const position = document.getElementById('position')?.value?.trim();
  const venue = document.getElementById('venue')?.value?.trim();
  
  // Page 1 remarks (exclude page 2 remarks)
  const page1Remarks = document.querySelectorAll('.remarks-textarea:not(.page2-remarks)');
  let page1RemarksEmpty = true;
  page1Remarks.forEach(textarea => {
    if (textarea.value?.trim()) page1RemarksEmpty = false;
  });

  // Page 2 remarks
  const page2Remarks1 = document.getElementById('page2_remarks_1')?.value?.trim();
  const page2Remarks2 = document.getElementById('page2_remarks_2')?.value?.trim();

  // Helper: check each row in a section has at least one checkbox checked
  function getMissingRows(section, totalRows) {
    const missing = [];
    for (let r = 1; r <= totalRows; r++) {
      const checked = document.querySelectorAll(`input[data-section="${section}"][data-row="${r}"]:checked`).length;
      if (!checked) missing.push(r);
    }
    return missing;
  }

  // Check header fields
  if (!trainingTitle) errors.push('Training Title is required');
  if (!resourceSpeaker) errors.push('Resource Speaker is required');
  if (!participantName) errors.push('Name of Participant is required');
  if (!trainingDate) errors.push('Training Date is required');
  if (!position) errors.push('Position is required');
  if (!venue) errors.push('Venue is required');
  if (page1RemarksEmpty) errors.push('Page 1: At least one Remarks/Comments/Suggestions field is required');

  // Page 1 checkbox sections
  const programMissing = getMissingRows('program', 5);
  if (programMissing.length) errors.push(`Page 1 - Program Contents: Row(s) ${programMissing.join(', ')} not rated`);

  const trainerMissing = getMissingRows('trainer', 5);
  if (trainerMissing.length) errors.push(`Page 1 - Trainer Evaluation: Row(s) ${trainerMissing.join(', ')} not rated`);

  const transferMissing = getMissingRows('transfer', 5);
  if (transferMissing.length) errors.push(`Page 1 - Transfer Quotient: Row(s) ${transferMissing.join(', ')} not rated`);

  // Page 2 checkbox sections - required only after due date
  const monthsElapsed = getMonthsElapsed();

  if (monthsElapsed >= 3) {
    const beforeMissing = getMissingRows('applied-before', 5);
    if (beforeMissing.length) errors.push(`Page 2 - Job Application (Before Training): Row(s) ${beforeMissing.join(', ')} not rated — required after 3 months`);

    const afterMissing = getMissingRows('applied-after', 5);
    if (afterMissing.length) errors.push(`Page 2 - Job Application (After Training): Row(s) ${afterMissing.join(', ')} not rated — required after 3 months`);

    if (!page2Remarks1) errors.push('Page 2: "List down improvements in employee\'s skills/knowledge/attitude" is required');
    if (!page2Remarks2) errors.push('Page 2: "What other training programs..." field is required');
  }

  if (monthsElapsed >= 6) {
    const businessMissing = getMissingRows('business', 3);
    if (businessMissing.length) errors.push(`Page 2 - Business Result: Row(s) ${businessMissing.join(', ')} not rated — required after 6 months`);
  }
  
  if (errors.length > 0) {
    showValidationModal(errors);
    return false;
  }
  
  return true;
}

// Save form to database
async function saveForm() {
  try {
    // Validate required fields
    if (!validateRequiredFields()) {
      return;
    }

    // Check if page 2 sections are coming up (not yet due) — informational only
    if (!_pendingSaveAfterNotice) {
      const notices = checkPage2Due();
      if (notices) {
        const msgDiv = document.getElementById('page2DueMessage');
        msgDiv.innerHTML = `
          <p style="margin:0 0 12px 0;">The following Page 2 section(s) will be required soon:</p>
          <ul style="margin:0; padding-left:20px;">${notices.join('')}</ul>
          <p style="margin:12px 0 0 0; color:#888;">You can save now and fill them up when they are due.</p>`;
        document.getElementById('page2DueModal').style.display = 'flex';
        return;
      }
    }
    _pendingSaveAfterNotice = false;
    
    const formData = collectFormData();
    
    // Ensure we have training_id and employee_id
    if (!formData.training_id) {
      alert('❌ Error: Training ID not found. Please select a training first.');
      return;
    }
    
    if (!formData.employee_id) {
      alert('❌ Error: Employee ID not found. Please select an employee first.');
      return;
    }
    
    // Add upload path for TEEF
    formData.upload_path = 'uploads/tests/TEEF';
    formData.document_type = 'W/TEEF';
    
    console.log('Saving evaluation form with data:', formData);

    // Check if a TEEF already exists for this training (edit vs new)
    let method = 'POST';
    let url = '/api/evaluation-forms';
    if (currentTeefId) {
      method = 'PUT';
      url = `/api/evaluation-form/${currentTeefId}`;
    }
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (!currentTeefId && result.id) currentTeefId = result.id;

      // Update attachment status indicator to green
      const statusIndicator = document.getElementById('attachmentStatusIndicator');
      if (statusIndicator) {
        statusIndicator.style.backgroundColor = '#4caf50';
        statusIndicator.style.color = 'white';
        statusIndicator.innerHTML = '✅ W/TEEF Attachment Saved';
      }
      
      // Mark that evaluation was completed
      sessionStorage.setItem('completedAssessmentType', 'evaluation');
      sessionStorage.setItem('completedTrainingId', formData.training_id);

      alert('✅ Evaluation form saved successfully!');
      
      // Redirect back to training records after a delay
      setTimeout(() => {
        window.location.href = '/pages/training-records.html';
      }, 1500);
    } else {
      alert('❌ Error saving form: ' + result.message);
      console.error('Save error:', result);
    }
  } catch (err) {
    console.error('Error saving form:', err);
    alert('❌ Error saving form: ' + err.message);
  }
}

// Print function
function printForm() {
  // Validate required fields
  if (!validateRequiredFields()) {
    return;
  }
  window.print();
}

// Save form as PDF
async function saveFormAsPDF() {
  try {
    // Validate required fields
    if (!validateRequiredFields()) {
      return;
    }
    
    console.log('📄 Saving evaluation form as PDF...');
    
    // Get form values
    const trainingTitle = document.getElementById('training_title')?.value || 'Training';
    const resourceSpeaker = document.getElementById('resource_speaker')?.value || '';
    const participantName = document.getElementById('participant_name')?.value || 'Employee';
    const trainingDate = document.getElementById('training_date')?.value || '';
    const position = document.getElementById('position')?.value || '';
    const venue = document.getElementById('venue')?.value || '';
    
    // Get all pages
    const pages = document.querySelectorAll('.page');
    
    if (pages.length === 0) {
      alert('❌ Error: No pages found to save');
      return;
    }
    
    // Create PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let isFirstPage = true;
    
    // Process each page
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const canvas = await html2canvas(page, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (!isFirstPage) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      isFirstPage = false;
    }
    
    // Generate filename with format: name_TEEF_DATE.pdf
    const sanitizedName = participantName.replace(/[^a-zA-Z0-9]/g, '_');
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
    const filename = `${sanitizedName}_TEEF_${dateStr}.pdf`;
    
    // Save PDF locally
    pdf.save(filename);
    
    console.log('✅ PDF saved successfully:', filename);
    alert('✅ PDF saved successfully!');
    
  } catch (err) {
    console.error('Error saving PDF:', err);
    alert('❌ Error saving PDF: ' + err.message);
  }
}

// Load data from URL parameters or localStorage
function loadFormData() {
  const urlParams = new URLSearchParams(window.location.search);
  const trainingId = urlParams.get('id');

  if (trainingId) {
    fetch(`/api/trainings/${trainingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          currentTrainingData = data.data;
          populateForm(data.data);
          checkAndDisplayAttachmentStatus(data.data);
        } else if (data.data) {
          currentTrainingData = data.data;
          populateForm(data.data);
          checkAndDisplayAttachmentStatus(data.data);
        }
        // After loading training, check if a TEEF already exists
        loadExistingTeef(trainingId);
      })
      .catch(err => console.error('Error loading training data:', err));
  } else {
    const trainingIdFromSession = sessionStorage.getItem('evaluationTrainingId');
    if (trainingIdFromSession) {
      fetch(`/api/trainings/${trainingIdFromSession}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            currentTrainingData = data.data;
            populateForm(data.data);
            checkAndDisplayAttachmentStatus(data.data);
          } else if (data.data) {
            currentTrainingData = data.data;
            populateForm(data.data);
            checkAndDisplayAttachmentStatus(data.data);
          }
          loadExistingTeef(trainingIdFromSession);
        })
        .catch(err => console.error('Error loading training data from session:', err));
      sessionStorage.removeItem('evaluationTrainingId');
    } else {
      const storedData = localStorage.getItem('evaluationFormData');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          currentTrainingData = data;
          populateForm(data);
          checkAndDisplayAttachmentStatus(data);
          localStorage.removeItem('evaluationFormData');
        } catch (e) {
          console.error('Error parsing stored data:', e);
        }
      }
    }
  }
}

function loadExistingTeef(trainingId) {
  fetch(`/api/evaluation-forms/${trainingId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data && data.data.length > 0) {
        const teef = data.data[0];
        currentTeefId = teef.id;
        populateTeefRatings(teef);

        // Update indicator
        const indicator = document.getElementById('attachmentStatusIndicator');
        if (indicator) {
          const isViewMode = new URLSearchParams(window.location.search).get('view') === '1';
          indicator.style.backgroundColor = '#4caf50';
          indicator.style.color = 'white';
          indicator.innerHTML = isViewMode ? '✅ W/TEEF Saved' : '✅ W/TEEF Saved — Editing';
        }
        console.log('✅ Existing TEEF loaded for editing, id:', currentTeefId);
      }
    })
    .catch(err => console.error('Error checking existing TEEF:', err));
}

function populateTeefRatings(teef) {
  // Helper to check a checkbox by section and row
  function setCheck(section, row, value) {
    if (!value) return;
    const cb = document.querySelector(`input[data-section="${section}"][data-row="${row}"][value="${value}"]`);
    if (cb) cb.checked = true;
  }

  // Page 1
  ['program','trainer','transfer'].forEach(section => {
    for (let r = 1; r <= 5; r++) {
      setCheck(section, r, teef[`${section}_${r}_rating`]);
    }
  });

  // Page 2 applied
  for (let r = 1; r <= 5; r++) {
    setCheck('applied-before', r, teef[`applied_before_${r}_rating`]);
    setCheck('applied-after', r, teef[`applied_after_${r}_rating`]);
  }

  // Page 2 business
  for (let r = 1; r <= 3; r++) {
    setCheck('business', r, teef[`business_${r}_rating`]);
    const fb = document.querySelectorAll('.feedback-input')[r - 1];
    if (fb) fb.value = teef[`business_${r}_feedback`] || '';
  }

  // Remarks
  const p1r = document.querySelectorAll('.remarks-textarea:not(.page2-remarks)');
  if (p1r[0]) p1r[0].value = teef.page1_remarks_1 || '';
  if (p1r[1]) p1r[1].value = teef.page1_remarks_2 || '';

  const r1 = document.getElementById('page2_remarks_1');
  const r2 = document.getElementById('page2_remarks_2');
  if (r1) r1.value = teef.page2_remarks_1 || '';
  if (r2) r2.value = teef.page2_remarks_2 || '';

  const overallRemarks = document.querySelector('.remarks-box textarea');
  if (overallRemarks) overallRemarks.value = teef.overall_remarks || '';

  // Recalculate scores
  if (typeof calculateScores === 'function') calculateScores();
}

// Check and display attachment status
function checkAndDisplayAttachmentStatus(trainingData) {
  if (!trainingData) return;
  
  const hasTeefAttachment = trainingData.eff_form_file ? true : false;
  
  // Create or update attachment status indicator
  let statusIndicator = document.getElementById('attachmentStatusIndicator');
  if (!statusIndicator) {
    statusIndicator = document.createElement('div');
    statusIndicator.id = 'attachmentStatusIndicator';
    statusIndicator.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 12px 16px; border-radius: 6px; font-weight: 600; z-index: 1000; display: flex; align-items: center; gap: 8px;';
    document.body.appendChild(statusIndicator);
  }
  
  if (hasTeefAttachment) {
    statusIndicator.style.backgroundColor = '#4caf50';
    statusIndicator.style.color = 'white';
    statusIndicator.innerHTML = '✅ W/TEEF Attachment Found';
    console.log('✅ W/TEEF attachment detected:', trainingData.eff_form_file);
  } else {
    statusIndicator.style.backgroundColor = '#f44336';
    statusIndicator.style.color = 'white';
    statusIndicator.innerHTML = '⏳ No W/TEEF Attachment Yet';
    console.log('⏳ No W/TEEF attachment found');
  }
}

// Add back button functionality
function addBackButton() {
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back to Dashboard';
  backBtn.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    padding: 12px 24px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  
  backBtn.addEventListener('click', () => {
    window.location.href = '/index.html';
  });
  backBtn.addEventListener('mouseenter', function() {
    this.style.background = '#5a6268';
  });
  backBtn.addEventListener('mouseleave', function() {
    this.style.background = '#6c757d';
  });

  // Hide button when printing
  window.addEventListener('beforeprint', () => {
    backBtn.style.display = 'none';
  });
  window.addEventListener('afterprint', () => {
    backBtn.style.display = 'block';
  });

  document.body.appendChild(backBtn);
}

// Add print button functionality
function addPrintButton() {
  const printBtn = document.createElement('button');
  printBtn.textContent = 'Print Form';
  printBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 260px;
    padding: 12px 24px;
    background: #4169e1;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  
  printBtn.addEventListener('click', printForm);
  printBtn.addEventListener('mouseenter', function() {
    this.style.background = '#3155c5';
  });
  printBtn.addEventListener('mouseleave', function() {
    this.style.background = '#4169e1';
  });

  // Hide button when printing
  window.addEventListener('beforeprint', () => {
    printBtn.style.display = 'none';
  });
  window.addEventListener('afterprint', () => {
    printBtn.style.display = 'block';
  });

  document.body.appendChild(printBtn);
}

// Add save button functionality
function addSaveButton() {
  // Save Form button
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save Form';
  saveBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  
  saveBtn.addEventListener('click', saveForm);
  saveBtn.addEventListener('mouseenter', function() {
    this.style.background = '#218838';
  });
  saveBtn.addEventListener('mouseleave', function() {
    this.style.background = '#28a745';
  });

  // Save as PDF button
  const savePdfBtn = document.createElement('button');
  savePdfBtn.textContent = 'Save as PDF';
  savePdfBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 140px;
    padding: 12px 24px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  
  savePdfBtn.addEventListener('click', saveFormAsPDF);
  savePdfBtn.addEventListener('mouseenter', function() {
    this.style.background = '#0056b3';
  });
  savePdfBtn.addEventListener('mouseleave', function() {
    this.style.background = '#007bff';
  });

  // Hide buttons when printing
  window.addEventListener('beforeprint', () => {
    saveBtn.style.display = 'none';
    savePdfBtn.style.display = 'none';
  });
  window.addEventListener('afterprint', () => {
    saveBtn.style.display = 'block';
    savePdfBtn.style.display = 'block';
  });

  document.body.appendChild(saveBtn);
  document.body.appendChild(savePdfBtn);
}

// Export functions for external use
window.TrainingEvaluationForm = {
  populateForm,
  printForm,
  saveForm,
  formatDate
};
