// Training Evaluation Form JavaScript

let currentTrainingData = null;
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

// Load employees and populate dropdowns
async function loadEmployees() {
  try {
    const response = await fetch('/api/employees');
    const data = await response.json();
    if (data.success && data.data) {
      allEmployees = data.data;
      populateEmployeeDropdowns();
    }
  } catch (err) {
    console.error('Error loading employees:', err);
  }
}

// Load speakers and populate datalist
async function loadSpeakers() {
  try {
    const response = await fetch('/api/speakers');
    const data = await response.json();
    if (data.success && data.data) {
      allSpeakers = data.data;
      populateSpeakerDatalist(data.data);
    }
  } catch (err) {
    console.error('Error loading speakers:', err);
  }
}

// Load venues and populate dropdown
async function loadVenues() {
  try {
    const response = await fetch('/api/venues');
    const data = await response.json();
    if (data.success && data.data) {
      allVenues = data.data;
      populateVenueDropdown(data.data);
    }
  } catch (err) {
    console.error('Error loading venues:', err);
  }
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
    nameSelect.appendChild(option);
  });
  
  // Populate position dropdown
  positionSelect.innerHTML = '<option value="">-- Select Position --</option>';
  const uniquePositions = [...new Set(allEmployees.map(e => e.position))].sort();
  uniquePositions.forEach(position => {
    const option = document.createElement('option');
    option.value = position;
    option.textContent = position;
    positionSelect.appendChild(option);
  });
  
  // Create employee-position map
  allEmployees.forEach(emp => {
    employeePositionMap[emp.full_name] = emp.position;
  });
}

// Populate venue dropdown
function populateVenueDropdown(venues) {
  const select = document.getElementById('venue');
  select.innerHTML = '<option value="">-- Select Venue --</option>';
  
  venues.forEach(venue => {
    const option = document.createElement('option');
    option.value = venue;
    option.textContent = venue;
    select.appendChild(option);
  });
}

// Populate speaker datalist
function populateSpeakerDatalist(speakers) {
  const datalist = document.getElementById('speaker_list');
  datalist.innerHTML = '';
  
  speakers.forEach(speaker => {
    const option = document.createElement('option');
    option.value = speaker;
    datalist.appendChild(option);
  });
}

// Setup add buttons for new values
function setupAddButtons() {
  // Add Speaker button
  document.getElementById('add_speaker_btn')?.addEventListener('click', () => {
    const newSpeaker = prompt('Enter new resource speaker name:');
    if (newSpeaker && newSpeaker.trim()) {
      const input = document.getElementById('resource_speaker');
      input.value = newSpeaker.trim();
      
      // Add to datalist
      const datalist = document.getElementById('speaker_list');
      const option = document.createElement('option');
      option.value = newSpeaker.trim();
      datalist.appendChild(option);
      
      // Save to database
      saveNewSpeaker(newSpeaker.trim());
    }
  });
  
  // Add Participant button
  document.getElementById('add_participant_btn')?.addEventListener('click', () => {
    const newName = prompt('Enter new employee name:');
    if (newName && newName.trim()) {
      const select = document.getElementById('participant_name');
      const option = document.createElement('option');
      option.value = newName.trim();
      option.textContent = newName.trim();
      select.appendChild(option);
      select.value = newName.trim();
      
      // Save to database
      saveNewEmployee(newName.trim());
    }
  });
  
  // Add Position button
  document.getElementById('add_position_btn')?.addEventListener('click', () => {
    const newPosition = prompt('Enter new position:');
    if (newPosition && newPosition.trim()) {
      const select = document.getElementById('position');
      const option = document.createElement('option');
      option.value = newPosition.trim();
      option.textContent = newPosition.trim();
      select.appendChild(option);
      select.value = newPosition.trim();
      
      // Save to database
      saveNewPosition(newPosition.trim());
    }
  });
  
  // Add Venue button
  document.getElementById('add_venue_btn')?.addEventListener('click', () => {
    const newVenue = prompt('Enter new venue:');
    if (newVenue && newVenue.trim()) {
      const select = document.getElementById('venue');
      const option = document.createElement('option');
      option.value = newVenue.trim();
      option.textContent = newVenue.trim();
      select.appendChild(option);
      select.value = newVenue.trim();
      
      // Save to database
      saveNewVenue(newVenue.trim());
    }
  });
}

// Save new speaker to database
async function saveNewSpeaker(speaker) {
  try {
    const response = await fetch('/api/speakers/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker_name: speaker })
    });
    const result = await response.json();
    if (result.success) {
      console.log('✅ New speaker added:', speaker);
    }
  } catch (err) {
    console.error('Error saving speaker:', err);
  }
}

// Save new employee to database
async function saveNewEmployee(name) {
  try {
    const response = await fetch('/api/employees/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name })
    });
    const result = await response.json();
    if (result.success) {
      console.log('✅ New employee added:', name);
    }
  } catch (err) {
    console.error('Error saving employee:', err);
  }
}

// Save new position to database
async function saveNewPosition(position) {
  try {
    const response = await fetch('/api/positions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: position })
    });
    const result = await response.json();
    if (result.success) {
      console.log('✅ New position added:', position);
    }
  } catch (err) {
    console.error('Error saving position:', err);
  }
}

// Save new venue to database
async function saveNewVenue(venue) {
  try {
    const response = await fetch('/api/venues/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue: venue })
    });
    const result = await response.json();
    if (result.success) {
      console.log('✅ New venue added:', venue);
      // Reload venues to update the list
      loadVenues();
    }
  } catch (err) {
    console.error('Error saving venue:', err);
  }
}

// Handle form initialization
document.addEventListener('DOMContentLoaded', () => {
  const participantSelect = document.getElementById('participant_name');
  
  // When participant name is selected, auto-fill position
  if (participantSelect) {
    participantSelect.addEventListener('change', function() {
      if (this.value && employeePositionMap[this.value]) {
        document.getElementById('position').value = employeePositionMap[this.value];
      }
    });
  }
  
  loadTrainings();
  loadEmployees();
  loadSpeakers();
  loadVenues();
  setupCheckboxes();
  addPrintButton();
  addSaveButton();
  setupAddButtons();
  loadFormData();
});

// Function to populate form with data
function populateForm(data) {
  if (!data) return;

  // Populate basic info
  const fields = {
    'training_title': data.course_title || data.training_title || '',
    'resource_speaker': data.trainer || data.resource_speaker || '',
    'participant_name': data.full_name || data.employee_name || data.participant_name || '',
    'training_date': formatDateForInput(data.date_from) || data.training_date || '',
    'position': data.position || '',
    'venue': data.venue || ''
  };

  Object.keys(fields).forEach(key => {
    const element = document.getElementById(key);
    if (element) {
      if (element.tagName === 'SELECT') {
        element.value = fields[key];
      } else {
        element.value = fields[key];
      }
    }
  });
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
  const data = {
    training_id: currentTrainingData?.id || null,
    employee_id: currentTrainingData?.employee_id || null,
    course_title: document.getElementById('training_title').options[document.getElementById('training_title').selectedIndex].text,
    resource_speaker: document.getElementById('resource_speaker').value,
    participant_name: document.getElementById('participant_name').value,
    training_date: document.getElementById('training_date').value,
    position: document.getElementById('position').value,
    venue: document.getElementById('venue').value,
    
    // Page 1 ratings
    program_ratings: [],
    trainer_ratings: [],
    transfer_ratings: [],
    
    // Page 1 scores
    overall_score: document.getElementById('overall_score').value,
    total_average_score: document.getElementById('total_average_score').value,
    page1_remarks_1: document.querySelector('.remarks-textarea:nth-of-type(1)')?.value || '',
    page1_remarks_2: document.querySelector('.remarks-textarea:nth-of-type(2)')?.value || '',
    overall_remarks: document.querySelector('.remarks-box textarea')?.value || '',
    
    // Page 2 Applied Skills
    applied_before_ratings: [],
    applied_after_ratings: [],
    applied_before_total: document.getElementById('applied_before_total').value,
    applied_before_avg: document.getElementById('applied_before_avg').value,
    applied_after_total: document.getElementById('applied_after_total').value,
    applied_after_avg: document.getElementById('applied_after_avg').value,
    
    // Page 2 Business Results
    business_ratings: [],
    business_feedbacks: [],
    business_total: document.getElementById('business_total').value,
    business_avg: document.getElementById('business_avg').value,
    page2_remarks_1: document.querySelectorAll('.remarks-textarea')[2]?.value || '',
    page2_remarks_2: document.querySelectorAll('.remarks-textarea')[3]?.value || ''
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

// Save form to database
async function saveForm() {
  try {
    const formData = collectFormData();
    
    if (!formData.training_id || !formData.employee_id) {
      alert('Please select a training first');
      return;
    }
    
    const response = await fetch('/api/evaluation-forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✅ Form saved successfully!');
    } else {
      alert('❌ Error saving form: ' + result.message);
    }
  } catch (err) {
    console.error('Error saving form:', err);
    alert('❌ Error saving form: ' + err.message);
  }
}

// Print function
function printForm() {
  window.print();
}

// Load data from URL parameters or localStorage
function loadFormData() {
  const urlParams = new URLSearchParams(window.location.search);
  const trainingId = urlParams.get('id');

  if (trainingId) {
    // Fetch training data from API
    fetch(`/api/trainings/${trainingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          populateForm(data.data);
        }
      })
      .catch(err => console.error('Error loading training data:', err));
  } else {
    // Try to load from localStorage
    const storedData = localStorage.getItem('evaluationFormData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        populateForm(data);
        // Clear after loading
        localStorage.removeItem('evaluationFormData');
      } catch (e) {
        console.error('Error parsing stored data:', e);
      }
    }
  }
}

// Add print button functionality
function addPrintButton() {
  const printBtn = document.createElement('button');
  printBtn.textContent = 'Print Form';
  printBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 120px;
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
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save Form';
  saveBtn.style.cssText = `
    position: fixed;
    top: 20px;
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

  // Hide button when printing
  window.addEventListener('beforeprint', () => {
    saveBtn.style.display = 'none';
  });
  window.addEventListener('afterprint', () => {
    saveBtn.style.display = 'block';
  });

  document.body.appendChild(saveBtn);
}

// Export functions for external use
window.TrainingEvaluationForm = {
  populateForm,
  printForm,
  saveForm,
  formatDate
};
