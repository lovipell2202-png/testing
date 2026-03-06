const API = '';   // same origin
let employees = [];
let trainings = [];
let currentEmp = null;
let editEmpId = null;
let editTrainId = null;
let sortColumn = 'date_from';
let sortOrder = 'desc';
let filterType = 'all';

// Expose to window for other scripts
window.employees = employees;
window.trainings = trainings;

// Dropdown Manager - Load options from localStorage
function loadDropdownOptions(category) {
  const stored = localStorage.getItem(`dropdown_${category}`);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return defaults if nothing in localStorage
  const defaults = {
    courses: ['COMPANY ORIENTATION', 'PRODUCT SAFETY', 'COUNTERFEIT PARTS', '5S FOD', 'QUALITY MANAGEMENT SYSTEM', 'COMPANY INTRODUCTION', 'TRAINERS TRAINING COURSE', 'ONLINE 8-HOUR ENVIRONMENTAL TRAINING COURSE FOR MANAGING HEADS', 'ROOT-CAUSE ANALYSIS (RCA)'],
    providers: ['NSB ENGINEERING', 'THINKSAFE', 'QUALITEX MANAGEMENT CONSULTANCY', 'ENVIA CONSULTANCY', 'CAAT ENGINEERING SOLUTIONS ASIA', 'BUREAU OF FIRE PROTECTION', 'KEYENCE', 'CYTEK', 'HSSLLC', 'TESDA', 'TUV RHEINLAND'],
    venues: ['NSB CMM AREA', 'CONFERENCE ROOM', 'NSB ENGINEERING', 'NSB CONFERENCE ROOM', 'SAFETY ROOM', 'MAKATI CITY', 'HSSLLC TRAINING CENTER', 'WEBINAR'],
    trainers: ['J. RENZALES', 'S. TORIBIO', 'D. CRUZ', 'M. NONO', 'E. PIKE', 'V. OSORIO', 'EXTERNAL TRAINER']
  };
  return defaults[category] || [];
}

// Update datalist options
function updateDatalistOptions() {
  // Update Course Titles
  const courseList = document.getElementById('courseList');
  if (courseList) {
    const courses = loadDropdownOptions('courses');
    courseList.innerHTML = courses.map(c => `<option value="${c}">`).join('');
  }
  
  // Update Training Providers
  const providerList = document.getElementById('providerList');
  if (providerList) {
    const providers = loadDropdownOptions('providers');
    providerList.innerHTML = providers.map(p => `<option value="${p}">`).join('');
  }
  
  // Update Venues
  const venueList = document.getElementById('venueList');
  if (venueList) {
    const venues = loadDropdownOptions('venues');
    venueList.innerHTML = venues.map(v => `<option value="${v}">`).join('');
  }
  
  // Update Trainers
  const trainerList = document.getElementById('trainerList');
  if (trainerList) {
    const trainers = loadDropdownOptions('trainers');
    trainerList.innerHTML = trainers.map(t => `<option value="${t}">`).join('');
  }
}

// Notification system
function showNotification(title, message, isSuccess = true) {
  const modal = document.getElementById('notificationModal');
  const head = document.getElementById('notificationHead');
  const titleEl = document.getElementById('notificationTitle');
  const icon = document.getElementById('notificationIcon');
  const msgEl = document.getElementById('notificationMessage');
  
  titleEl.textContent = title;
  msgEl.textContent = message;
  
  if (isSuccess) {
    icon.textContent = '✅';
    head.style.background = '#27ae60';
    modal.classList.remove('error');
  } else {
    icon.textContent = '❌';
    head.style.background = '#c0392b';
    modal.classList.add('error');
  }
  
  modal.classList.add('open');
}

function closeNotification() {
  const modal = document.getElementById('notificationModal');
  modal.classList.remove('open');
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded - initializing app');
  
  // Update dropdown options from localStorage
  updateDatalistOptions();
  
  // Only load employees if we're on index.html (has dashboardSection or recordsSection)
  const dashboardSection = document.getElementById('dashboardSection');
  const recordsSection = document.getElementById('recordsSection');
  
  if (dashboardSection || recordsSection) {
    // We're on index.html
    console.log('On index.html - loading employees for dashboard');
    await loadEmployees();
    console.log('Employees loaded:', employees.length);
    console.log('Trainings loaded:', trainings.length);
    
    // Show dashboard by default
    if (recordsSection) recordsSection.style.display = 'none';
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
      // Render dashboard after data is loaded
      if (typeof renderDashboard === 'function') {
        renderDashboard();
      }
    }
  } else {
    // We're on a dedicated page (all-employees.html, training-records.html)
    console.log('On dedicated page - skipping app.js loadEmployees()');
  }
});

/* ════════════════════════════════
   EMPLOYEES
════════════════════════════════ */
async function loadEmployees() {
  try {
    const res = await fetch(`${API}/api/employees`);
    const data = await res.json();
    if (data.success) {
      employees = data.data;
      window.employees = employees; // Update global reference
      console.log('Loaded employees:', employees.length);
      // Load all trainings for dashboard
      const allTrainings = [];
      for (const emp of employees) {
        const empRes = await fetch(`${API}/api/employees/${emp.id}`);
        const empData = await empRes.json();
        if (empData.trainings) {
          allTrainings.push(...empData.trainings);
        }
      }
      trainings = allTrainings;
      window.trainings = trainings; // Update global reference
      console.log('Loaded trainings:', trainings.length);
    } else {
      console.error('API error:', data);
    }
  } catch (err) {
    console.error('Failed to load employees:', err);
  }
}

function toggleSubmenu(menuId) {
  const menu = document.getElementById(menuId);
  const toggle = document.getElementById(menuId === 'employeesMenu' ? 'employeesToggle' : 'trainingToggle');
  
  if (menu.style.display === 'none') {
    menu.style.display = 'block';
    toggle.textContent = '▲';
  } else {
    menu.style.display = 'none';
    toggle.textContent = '▼';
  }
}

function showAllTrainingRecords() {
  console.log('showAllTrainingRecords called with', trainings.length, 'trainings');
  const dashboardSection = document.getElementById('dashboardSection');
  
  if (dashboardSection) {
    dashboardSection.style.display = 'none';
  }
  
  renderAllTrainingRecords(trainings);
}

function showAllEmployees() {
  const dashboardSection = document.getElementById('dashboardSection');
  const recordsSection = document.getElementById('recordsSection');
  
  if (!dashboardSection || !recordsSection) {
    console.error('ERROR: Required elements not found in showAllEmployees!');
    return;
  }
  
  dashboardSection.style.display = 'none';
  recordsSection.style.display = 'block';
  renderAllEmployees();
}

function renderAllEmployees() {
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  
  document.getElementById('main').innerHTML = `
    <div style="padding: 20px 32px; border-bottom: 2px solid var(--border);">
      <h2 style="margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; color: var(--navy); letter-spacing: 1px;">ALL EMPLOYEES</h2>
    </div>

    <!-- SEARCH BAR -->
    <div style="padding: 20px 32px; display: flex; gap: 15px; align-items: center; background: #f7f9fd; border-bottom: 1px solid var(--border);">
      <input type="text" id="employeeSearch" placeholder="Search by name, department, or employee number..." 
        style="flex: 1; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px;"
        oninput="filterAllEmployees()" />
      <select id="deptFilter" style="padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px;"
        onchange="filterAllEmployees()">
        <option value="all">All Departments</option>
        ${[...new Set(employees.map(e => e.department))].sort().map(dept => 
          `<option value="${dept}">${dept}</option>`
        ).join('')}
      </select>
    </div>

    <!-- EMPLOYEES TABLE -->
    <div class="table-section">
      <div class="table-header">
        <h3>Employee List <span style="color:var(--muted);font-size:13px;font-weight:400;">(${employees.length} employees)</span></h3>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="text-align: center;">Employee No.</th>
              <th style="text-align: center;">Full Name</th>
              <th style="text-align: center">Department</th>
              <th style="text-align: center;">Position</th>
              <th style="text-align: center;">Date Hired</th>
              <th style="text-align: center;">Training Count</th>
              <th style="text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody id="allEmployeesBody">
            ${employees.map(emp => {
              const trainingCount = trainings.filter(t => t.employee_id == emp.id).length;
              return `
                <tr style="cursor: pointer;" ondblclick="openEmployeeTrainingOverview(${emp.id})">
                  <td style="font-weight: 600; color: var(--navy);">${emp.employee_no}</td>
                  <td style="font-weight: 600;">${emp.full_name || emp.employee_name}</td>
                  <td>${emp.department}</td>
                  <td>${emp.position}</td>
                  <td>${fmt(emp.date_hired)}</td>
                  <td style="text-align: center;">
                    <span style="background: ${trainingCount > 0 ? '#e8f4fd' : '#f0f0f0'}; color: ${trainingCount > 0 ? '#1a78c2' : '#999'}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                      ${trainingCount} training${trainingCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openEmployeeTrainingOverview(${emp.id})" title="View All Training">📋 View All</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function filterAllEmployees() {
  const searchTerm = document.getElementById('employeeSearch')?.value.toLowerCase() || '';
  const deptFilter = document.getElementById('deptFilter')?.value || 'all';
  
  let filtered = employees;
  
  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(emp => 
      (emp.full_name || emp.employee_name || '').toLowerCase().includes(searchTerm) ||
      emp.department.toLowerCase().includes(searchTerm) ||
      emp.employee_no.toLowerCase().includes(searchTerm) ||
      emp.position.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by department
  if (deptFilter !== 'all') {
    filtered = filtered.filter(emp => emp.department === deptFilter);
  }
  
  // Re-render table body
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  const tbody = document.getElementById('allEmployeesBody');
  
  if (tbody) {
    tbody.innerHTML = filtered.map(emp => {
      const trainingCount = trainings.filter(t => t.employee_id == emp.id).length;
      return `
        <tr style="cursor: pointer;" ondblclick="selectEmployee(${emp.id})">
          <td style="font-weight: 600; color: var(--navy);">${emp.employee_no}</td>
          <td style="font-weight: 600;">${emp.full_name || emp.employee_name}</td>
          <td>${emp.department}</td>
          <td>${emp.position}</td>
          <td>${fmt(emp.date_hired)}</td>
          <td style="text-align: center;">
            <span style="background: ${trainingCount > 0 ? '#e8f4fd' : '#f0f0f0'}; color: ${trainingCount > 0 ? '#1a78c2' : '#999'}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${trainingCount} training${trainingCount !== 1 ? 's' : ''}
            </span>
          </td>
          <td style="text-align: center;">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openEmployeeTrainingOverview(${emp.id})" title="View All Training">📋 View All</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function showTrainingByType(type) {
  const dashboardSection = document.getElementById('dashboardSection');
  
  if (dashboardSection) {
    dashboardSection.style.display = 'none';
  }
  
  const filtered = trainings.filter(t => t.type_tb === type);
  renderAllTrainingRecords(filtered, `${type === 'T' ? 'Technical' : 'Behavioral'} Training Records`);
}

function showTrainingByTrainer() {
  const dashboardSection = document.getElementById('dashboardSection');
  
  if (dashboardSection) {
    dashboardSection.style.display = 'none';
  }
  
  renderTrainingByTrainer();
}

function renderAllTrainingRecords(records, title = 'All Training Records') {
  console.log('renderAllTrainingRecords called with', records.length, 'records');
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  
  // Store records globally for filtering
  window.allTrainingRecordsData = records;
  window.allTrainingSortColumn = 'date_from';
  window.allTrainingSortOrder = 'desc';
  
  const html = `
    <div style="padding: 20px 32px; border-bottom: 2px solid var(--border);">
      <h2 style="margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; color: var(--navy); letter-spacing: 1px;">${title}</h2>
    </div>

    <!-- SEARCH & FILTER -->
    <div style="padding: 20px 32px; display: flex; gap: 15px; align-items: center; background: #f7f9fd; border-bottom: 1px solid var(--border);">
      <input type="text" id="allTrainSearch" placeholder="Search by employee, course, provider, or trainer..." 
        style="flex: 1; padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px;"
        oninput="filterAllTrainingRecords()" />
      <select id="allTrainTypeFilter" style="padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px;"
        onchange="filterAllTrainingRecords()">
        <option value="all">All Types</option>
        <option value="T">Technical (T)</option>
        <option value="B">Behavioral (B)</option>
      </select>
    </div>

    <div class="table-section" style="margin: 20px 32px;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th onclick="sortAllTrainingRecords('employee_id')" style="cursor: pointer;">Employee ${window.allTrainingSortColumn === 'employee_id' ? (window.allTrainingSortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortAllTrainingRecords('date_from')" style="cursor: pointer;">Date From ${window.allTrainingSortColumn === 'date_from' ? (window.allTrainingSortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortAllTrainingRecords('date_to')" style="cursor: pointer;">Date To ${window.allTrainingSortColumn === 'date_to' ? (window.allTrainingSortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortAllTrainingRecords('course_title')" style="cursor: pointer;">Course ${window.allTrainingSortColumn === 'course_title' ? (window.allTrainingSortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortAllTrainingRecords('trainer')" style="cursor: pointer;">Trainer ${window.allTrainingSortColumn === 'trainer' ? (window.allTrainingSortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortAllTrainingRecords('type_tb')" style="cursor: pointer;">Type ${window.allTrainingSortColumn === 'type_tb' ? (window.allTrainingSortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortAllTrainingRecords('training_provider')" style="cursor: pointer;">Provider ${window.allTrainingSortColumn === 'training_provider' ? (window.allTrainingSortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="allTrainBody">
            ${records.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--muted);">No training records found</td></tr>
            ` : records.map(t => {
              const emp = employees.find(e => e.id == t.employee_id);
              const empName = emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown';
              return `
                <tr style="cursor: pointer;" ondblclick="openViewTraining('${t.id}')">
                  <td><strong>${empName}</strong></td>
                  <td>${fmt(t.date_from)}</td>
                  <td>${fmt(t.date_to)}</td>
                  <td style="text-align: left;">${t.course_title}</td>
                  <td>${t.trainer}</td>
                  <td><span class="badge badge-${t.type_tb}">${t.type_tb}</span></td>
                  <td>${t.training_provider}</td>
                  <td>
                    <div class="row-actions" style="pointer-events: auto;">
                      <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openViewTraining('${t.id}')" title="View">👁️</button>
                      <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openEditTraining('${t.id}')" title="Edit">✏️</button>
                      <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteTraining('${t.id}')" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  console.log('Setting main HTML for training records');
  document.getElementById('main').innerHTML = html;
}

function filterAllTrainingRecords() {
  const searchTerm = document.getElementById('allTrainSearch')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('allTrainTypeFilter')?.value || 'all';
  
  let filtered = window.allTrainingRecordsData || [];
  
  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(t => {
      const emp = employees.find(e => e.id == t.employee_id);
      const empName = (emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown').toLowerCase();
      return empName.includes(searchTerm) ||
             t.course_title.toLowerCase().includes(searchTerm) ||
             t.training_provider.toLowerCase().includes(searchTerm) ||
             t.trainer.toLowerCase().includes(searchTerm);
    });
  }
  
  // Filter by type
  if (typeFilter !== 'all') {
    filtered = filtered.filter(t => t.type_tb === typeFilter);
  }
  
  // Sort
  filtered.sort((a, b) => {
    let aVal = a[window.allTrainingSortColumn];
    let bVal = b[window.allTrainingSortColumn];
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (window.allTrainingSortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  // Render filtered results
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  const tbody = document.getElementById('allTrainBody');
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--muted);">No training records found</td></tr>';
  } else {
    tbody.innerHTML = filtered.map(t => {
      const emp = employees.find(e => e.id == t.employee_id);
      const empName = emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown';
      return `
        <tr style="cursor: pointer;" ondblclick="openViewTraining('${t.id}')">
          <td><strong>${empName}</strong></td>
          <td>${fmt(t.date_from)}</td>
          <td>${fmt(t.date_to)}</td>
          <td style="text-align: left;">${t.course_title}</td>
          <td>${t.trainer}</td>
          <td><span class="badge badge-${t.type_tb}">${t.type_tb}</span></td>
          <td>${t.training_provider}</td>
          <td>
            <div class="row-actions" style="pointer-events: auto;">
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openViewTraining('${t.id}')" title="View">👁️</button>
              <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openEditTraining('${t.id}')" title="Edit">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteTraining('${t.id}')" title="Delete">🗑</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function sortAllTrainingRecords(column) {
  if (window.allTrainingSortColumn === column) {
    window.allTrainingSortOrder = window.allTrainingSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    window.allTrainingSortColumn = column;
    window.allTrainingSortOrder = 'asc';
  }
  filterAllTrainingRecords();
}

function renderTrainingByTrainer() {
  const trainerMap = {};
  trainings.forEach(t => {
    if (!trainerMap[t.trainer]) {
      trainerMap[t.trainer] = [];
    }
    trainerMap[t.trainer].push(t);
  });

  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  
  let html = `
    <div style="padding: 20px 32px; border-bottom: 2px solid var(--border);">
      <h2 style="margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; color: var(--navy); letter-spacing: 1px;">Training Records by Trainer</h2>
    </div>
  `;

  Object.entries(trainerMap).forEach(([trainer, records]) => {
    html += `
      <div style="margin: 20px 32px;">
        <div style="background: var(--white); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow);">
          <div style="background: var(--navy); color: #fff; padding: 15px 20px; font-weight: 600; font-size: 14px;">
            ${trainer} (${records.length} trainings)
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date From</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(t => {
                  const emp = employees.find(e => e.id === t.employee_id);
                  const empName = emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown';
                  return `
                    <tr style="cursor: pointer;" ondblclick="openViewTraining(${t.id})">
                      <td><strong>${empName}</strong></td>
                      <td>${fmt(t.date_from)}</td>
                      <td style="text-align: left;">${t.course_title}</td>
                      <td><span class="badge badge-${t.type_tb}">${t.type_tb}</span></td>
                      <td>${t.duration}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById('main').innerHTML = html;
}

function initials(name) {
  const parts = name.replace(',', '').split(' ').filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function filterEmployees() {
  // Sidebar removed - not needed
}

async function selectEmployee(id) {
  const res = await fetch(`${API}/api/employees/${id}`);
  const data = await res.json();
  if (!data.success) return toast('Failed to load employee.', true);
  currentEmp = data.employee;
  
  // Use the trainings from the API response for this employee
  const empTrainings = data.trainings || [];
  const empName = currentEmp.full_name || currentEmp.employee_name || 'Unknown';
  console.log(`Selected employee ${id} (${empName}): ${empTrainings.length} trainings`);
  renderRecord(currentEmp, empTrainings);
  
  // Only hide/show sections if they exist
  const dashboardSection = document.getElementById('dashboardSection');
  const recordsSection = document.getElementById('recordsSection');
  if (dashboardSection && recordsSection) {
    dashboardSection.style.display = 'none';
    recordsSection.style.display = 'block';
  }
}


async function loadSampleEmployee() {
  selectEmployee(1);
}

function sortBy(column) {
  if (sortColumn === column) {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortOrder = 'desc';
  }
  refreshTrainingTable();
}

function refreshTrainingTable() {
  if (currentEmp) {
    renderRecord(currentEmp, trainings.filter(t => t.employee_id === currentEmp.id));
  }
}

function renderRecord(emp, trainings) {
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  const fmtShort = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';

  // Filter trainings
  let filtered = trainings;
  const searchTerm = document.getElementById('trainSearch')?.value.toLowerCase() || '';
  if (searchTerm) {
    filtered = filtered.filter(t =>
      t.course_title.toLowerCase().includes(searchTerm) ||
      t.training_provider.toLowerCase().includes(searchTerm) ||
      t.trainer.toLowerCase().includes(searchTerm)
    );
  }

  if (filterType !== 'all') {
    filtered = filtered.filter(t => t.type_tb === filterType);
  }

  // Sort trainings
  filtered.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  document.getElementById('main').innerHTML = `
    <!-- PRINT HEADER (hidden on screen, visible on print) -->
    <div class="print-header" style="display: none;">
      <img class="print-logo" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23c0392b' stroke='%231a2340' stroke-width='2'/%3E%3Ctext x='50' y='60' font-size='40' font-weight='bold' fill='white' text-anchor='middle' font-family='Arial'%3ENSB%3C/text%3E%3C/svg%3E" alt="NSB Logo" />
      <div class="print-company-info">
        <h1>NSB ENGINEERING</h1>
        <p>Design and Fabrication</p>
      </div>
    </div>
    <div class="print-title" style="display: none;">Employee Training Record</div>

    <!-- TITLE -->
    <div style="padding: 20px 32px; border-bottom: 2px solid var(--border);">
      <h2 style="margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; color: var(--navy); letter-spacing: 1px;">EMPLOYEE TRAINING RECORD</h2>
    </div>

    <!-- ACTION BUTTONS -->
    <div style="padding: 20px 32px; display: flex; gap: 10px; justify-content: flex-end;">
      <button class="btn btn-sm btn-primary" onclick="openEmployeeTrainingOverview(${emp.id})">📋 View All in Modal</button>
      <button class="btn btn-sm btn-outline btn-secondary" onclick="openEditEmp()">✏️ Edit</button>
      <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})">� Delete</button>
      <button class="btn btn-sm btn-primary" onclick="downloadPDF(${emp.id})">📥 Download PDF</button>
      <button class="btn btn-sm btn-primary" onclick="window.print()">🖨 Print</button>
    </div>

    <!-- EMPLOYEE INFO -->
    <div class="emp-info-grid">
      <div class="info-field"><label>Employee Name</label><span>${emp.full_name || emp.employee_name}</span></div>
      <div class="info-field"><label>Department</label><span>${emp.department}</span></div>
      <div class="info-field"><label>Employee No.</label><span>${emp.employee_no}</span></div>
      <div class="info-field"><label>Date Hired</label><span>${fmt(emp.date_hired)}</span></div>
      <div class="info-field"><label>Position</label><span>${emp.position}</span></div>
    </div>

    <!-- SEARCH & FILTER -->
    <div style="padding: 20px 32px; display: flex; gap: 15px; align-items: center; background: #f7f9fd; border-bottom: 1px solid var(--border);">
      <input type="text" id="trainSearch" placeholder="Search by course, provider, or trainer..." 
        style="flex: 1; padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px;"
        oninput="refreshTrainingTable()" />
      <select id="typeFilter" style="padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 13px;"
        onchange="filterType = this.value; refreshTrainingTable()">
        <option value="all">All Types</option>
        <option value="T">Technical (T)</option>
        <option value="B">Behavioral (B)</option>
      </select>
    </div>

    <!-- TRAINING TABLE -->
    <div class="table-section">
      <div class="table-header">
        <h3>Training Records <span style="color:var(--muted);font-size:13px;font-weight:400;">(${filtered.length} entries)</span></h3>
        <button class="btn btn-sm btn-primary" onclick="openAddTraining()">＋ Add Training</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th onclick="sortBy('date_from')" style="cursor: pointer;">Date From ${sortColumn === 'date_from' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortBy('date_to')" style="cursor: pointer;">Date To ${sortColumn === 'date_to' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortBy('duration')" style="cursor: pointer;">Duration ${sortColumn === 'duration' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortBy('course_title')" style="cursor: pointer;">Course / Title Description ${sortColumn === 'course_title' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortBy('training_provider')" style="cursor: pointer;">Training Provider ${sortColumn === 'training_provider' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortBy('venue')" style="cursor: pointer;">Venue ${sortColumn === 'venue' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onclick="sortBy('trainer')" style="cursor: pointer;">Trainer ${sortColumn === 'trainer' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Type T/B</th>
              <th>Eff. Form</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="trainBody">
            ${filtered.length === 0 ? `
              <tr><td colspan="10">
                <div class="no-data">
                  <div class="no-data-icon">📂</div>
                  No training records found. Click <strong>+ Add Training</strong> to begin.
                </div>
              </td></tr>
            ` : filtered.map(t => `
              <tr ondblclick="openEditTraining(${t.id})" style="cursor: pointer;">
                <td>${fmtShort(t.date_from)}</td>
                <td>${fmtShort(t.date_to)}</td>
                <td>${t.duration}</td>
                <td style="text-align:left;">${t.course_title}</td>
                <td>${t.training_provider}</td>
                <td>${t.venue}</td>
                <td>${t.trainer}</td>
                <td><span class="badge badge-${t.type_tb}">${t.type_tb}</span></td>
                <td>${t.effectiveness_form}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openViewTraining(${t.id})" title="View">👁️</button>
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openEditTraining(${t.id})" title="Edit">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteTraining(${t.id})" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding:14px 28px;font-size:11px;color:var(--muted);border-top:1px solid var(--border);">
        F-HRD03-4/EFF:${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
      </div>
    </div>
  `;
}

/* ════════════════════════════════
   EMPLOYEE MODAL
════════════════════════════════ */
function openModal(type) {
  document.getElementById(`${type}Modal`).classList.add('open');
}
function closeModal(type) {
  document.getElementById(`${type}Modal`).classList.remove('open');
  if (type === 'train') {
    editTrainId = null;
  }
  if (type === 'viewTrain') {
    window.currentViewTrainId = null;
  }
}

/* ════════════════════════════════
   EMPLOYEE TRAINING OVERVIEW MODAL
════════════════════════════════ */
let currentOverviewEmpId = null;
let currentOverviewSelectedTrainId = null;

function openEmployeeTrainingOverview(empId) {
  const emp = employees.find(e => e.id == empId);
  if (!emp) {
    showNotification('Error', 'Employee not found.', false);
    return;
  }
  
  currentOverviewEmpId = empId;
  currentOverviewSelectedTrainId = null;
  const empTrainings = trainings.filter(t => t.employee_id == empId);
  
  // Format date helper
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  
  // Update modal title
  document.getElementById('overviewModalTitle').textContent = `Training Overview - ${emp.full_name}`;
  
  // Render employee info - 3 column layout like the reference image
  document.getElementById('overviewEmpInfo').innerHTML = `
    <div style="display: grid; grid-template-columns: 2fr 1.5fr 1.5fr; gap: 15px;">
      <div>
        <label style="font-size: 11px; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Employee Name:</label>
        <span style="font-size: 14px; font-weight: 700; color: var(--navy);">${emp.full_name || emp.employee_name}</span>
      </div>
      <div>
        <label style="font-size: 11px; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Department:</label>
        <span style="font-size: 14px; font-weight: 700; color: var(--navy);">${emp.department}</span>
      </div>
      <div>
        <label style="font-size: 11px; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Date Hired:</label>
        <span style="font-size: 14px; font-weight: 700; color: var(--navy);">${fmt(emp.date_hired)}</span>
      </div>
      <div>
        <label style="font-size: 11px; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Employee No.:</label>
        <span style="font-size: 14px; font-weight: 700; color: var(--navy);">${emp.employee_no}</span>
      </div>
      <div style="grid-column: span 2;">
        <label style="font-size: 11px; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Position:</label>
        <span style="font-size: 14px; font-weight: 700; color: var(--navy);">${emp.position}</span>
      </div>
    </div>
  `;
  
  // Render training records table
  if (empTrainings.length === 0) {
    document.getElementById('overviewTrainingTable').innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--muted);">
        <div style="font-size: 48px; margin-bottom: 10px;">📂</div>
        <p style="font-size: 14px;">No training records found for this employee.</p>
      </div>
    `;
  } else {
    document.getElementById('overviewTrainingTable').innerHTML = `
      <div style="margin-bottom: 10px; padding: 10px 0; border-bottom: 2px solid var(--border);">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--navy);">Training Records (${empTrainings.length})</h4>
        <p style="font-size: 11px; color: var(--muted); margin-top: 4px;">Double-click any row to view/edit details</p>
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: var(--navy); color: white;">
              <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 700;">Date From</th>
              <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 700;">Date To</th>
              <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 700;">Duration</th>
              <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700;">Course Title</th>
              <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700;">Provider</th>
              <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700;">Venue</th>
              <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700;">Trainer</th>
              <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700;">Type</th>
              <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700;">Eff. Form</th>
            </tr>
          </thead>
          <tbody>
            ${empTrainings.map(t => `
              <tr id="overview-row-${t.id}" onclick="selectOverviewTrainingRow(${t.id})" style="border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s;" onmouseover="if(currentOverviewSelectedTrainId!=${t.id})this.style.background='#f7f9fd'" onmouseout="if(currentOverviewSelectedTrainId!=${t.id})this.style.background='white'">
                <td style="padding: 10px; font-size: 12px;">${fmt(t.date_from)}</td>
                <td style="padding: 10px; font-size: 12px;">${fmt(t.date_to)}</td>
                <td style="padding: 10px; font-size: 12px;">${t.duration}</td>
                <td style="padding: 10px; font-size: 12px;">${t.course_title}</td>
                <td style="padding: 10px; font-size: 12px;">${t.training_provider}</td>
                <td style="padding: 10px; font-size: 12px;">${t.venue}</td>
                <td style="padding: 10px; font-size: 12px;">${t.trainer}</td>
                <td style="padding: 10px; text-align: center;">
                  <span class="badge badge-${t.type_tb}" style="padding: 4px 10px; font-size: 10px; border-radius: 4px;">${t.type_tb}</span>
                </td>
                <td style="padding: 10px; text-align: center; font-size: 12px;">${t.effectiveness_form || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Update print footer with current date
  const printFooter = document.querySelector('#empTrainingOverviewModal .print-modal-footer');
  if (printFooter) {
    const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    printFooter.textContent = `F-HRD03-4/EFF:${currentDate}`;
  }
  
  openModal('empTrainingOverview');
}

function selectOverviewTrainingRow(id) {
  // Deselect all rows
  document.querySelectorAll('[id^="overview-row-"]').forEach(row => {
    row.style.background = 'white';
    row.style.fontWeight = 'normal';
  });
  // Select clicked row
  currentOverviewSelectedTrainId = id;
  const row = document.getElementById(`overview-row-${id}`);
  if (row) {
    row.style.background = '#e8f0fe';
    row.style.fontWeight = '600';
  }
}

function editSelectedOverviewTraining() {
  if (!currentOverviewSelectedTrainId) {
    showNotification('No Record Selected', 'Please click a training record row to select it, then click Edit.', false);
    return;
  }
  openEditTraining(currentOverviewSelectedTrainId);
}

async function deleteTrainingFromOverview(id) {
  if (!confirm('Delete this training record?')) return;
  
  const res = await fetch(`${API}/api/trainings/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) {
    showNotification('Error', 'Error deleting training record.', false);
    return;
  }
  
  showNotification('Training Deleted', 'Training record has been deleted successfully.', true);
  
  // Real-time update
  await loadEmployees();
  
  // Refresh the overview modal
  if (currentOverviewEmpId) {
    openEmployeeTrainingOverview(currentOverviewEmpId);
  }
  
  // Refresh dashboard if it's open
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    renderDashboard();
  }
}

function printEmployeeTraining() {
  if (!currentOverviewEmpId) {
    showNotification('Error', 'No employee selected.', false);
    return;
  }
  
  // Add print class to modal for styling
  const modal = document.getElementById('empTrainingOverviewModal');
  modal.classList.add('printing');
  
  // Hide main content
  const mainContent = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  if (mainContent) mainContent.style.display = 'none';
  if (sidebar) sidebar.style.display = 'none';
  
  // Trigger print
  window.print();
  
  // Restore after printing
  setTimeout(() => {
    modal.classList.remove('printing');
    if (mainContent) mainContent.style.display = 'block';
    if (sidebar) sidebar.style.display = 'block';
  }, 100);
}

// Add training for current employee in overview
function openAddTrainingForEmployee() {
  if (!currentOverviewEmpId) {
    showNotification('Error', 'No employee selected.', false);
    return;
  }
  
  // Close the overview modal first to avoid z-index issues
  closeModal('empTrainingOverview');
  
  // Small delay to ensure smooth transition
  setTimeout(() => {
    // Open the add training modal with pre-selected employee
    editTrainingId = null;
    document.getElementById('trainingModalTitle').textContent = 'Add Training Record';
    
    // Populate employee dropdown
    populateEmployeeDropdown();
    
    // Clear all fields
    ['date_from', 'date_to', 'duration', 'course_title', 'training_provider', 'venue', 'trainer', 'type_tb', 'effectiveness_form'].forEach(k => {
      const field = document.getElementById(`t_${k}`);
      if (field) field.value = '';
    });
    
    // Pre-select the current employee
    const empSelect = document.getElementById('t_employee_id');
    if (empSelect) {
      empSelect.value = currentOverviewEmpId;
    }
    
    openModal('train');
  }, 150);
}

// Edit training from overview modal
function openEditTraining(trainingId) {
  const training = trainings.find(t => t.id === trainingId);
  if (!training) {
    showNotification('Error', 'Training record not found.', false);
    return;
  }
  
  // Close the overview modal first to avoid z-index issues
  closeModal('empTrainingOverview');
  
  // Small delay to ensure smooth transition
  setTimeout(() => {
    editTrainingId = trainingId;
    document.getElementById('trainingModalTitle').textContent = 'Edit Training Record';
    
    // Populate employee dropdown
    populateEmployeeDropdown();
    
    // Populate form fields
    document.getElementById('t_employee_id').value = training.employee_id;
    document.getElementById('t_date_from').value = training.date_from?.split('T')[0] || '';
    document.getElementById('t_date_to').value = training.date_to?.split('T')[0] || '';
    document.getElementById('t_duration').value = training.duration || '';
    document.getElementById('t_course_title').value = training.course_title || '';
    document.getElementById('t_training_provider').value = training.training_provider || '';
    document.getElementById('t_venue').value = training.venue || '';
    document.getElementById('t_trainer').value = training.trainer || '';
    document.getElementById('t_type_tb').value = training.type_tb || '';
    document.getElementById('t_effectiveness_form').value = training.effectiveness_form || '';
    
    openModal('train');
  }, 150);
}

// Populate employee dropdown
function populateEmployeeDropdown() {
  const empSelect = document.getElementById('t_employee_id');
  if (!empSelect) return;
  
  const employeeList = window.employees || employees;
  empSelect.innerHTML = '<option value="">Select Employee</option>';
  employeeList.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.id;
    option.textContent = `${emp.full_name || emp.employee_name} - ${emp.employee_no}`;
    empSelect.appendChild(option);
  });
}

/* ════════════════════════════════
   EMPLOYEE MODAL
════════════════════════════════ */
function openAddEmp() {
  editEmpId = null;
  document.getElementById('empModalTitle').textContent = 'New Employee';
  ['employee_no','employee_name','department','position'].forEach(k => document.getElementById(`f_${k}`).value = '');
  document.getElementById('f_date_hired').value = '';
  openModal('emp');
}

function openEditEmp() {
  if (!currentEmp) return;
  editEmpId = currentEmp.id;
  document.getElementById('empModalTitle').textContent = 'Edit Employee';
  document.getElementById('f_employee_no').value = currentEmp.employee_no;
  document.getElementById('f_employee_name').value = currentEmp.full_name || currentEmp.employee_name || '';
  document.getElementById('f_department').value = currentEmp.department;
  document.getElementById('f_position').value = currentEmp.position;
  document.getElementById('f_date_hired').value = currentEmp.date_hired?.split('T')[0] || '';
  openModal('emp');
}

// Override the "New Employee" button in header (if it exists)
// document.querySelector('button[onclick="openModal(\'emp\')"]').onclick = openAddEmp;

async function saveEmployee() {
  const fullName = document.getElementById('f_employee_name').value.trim();
  const nameParts = fullName.split(',').map(p => p.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1] || '';
  
  const body = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    department: document.getElementById('f_department').value.trim(),
    date_hired: document.getElementById('f_date_hired').value,
    position: document.getElementById('f_position').value.trim(),
  };
  if (!body.first_name || !body.last_name || !body.full_name || !body.department || !body.date_hired || !body.position) {
    showNotification('Validation Error', 'Please fill in all fields.', false);
    return;
  }

  const url = editEmpId ? `${API}/api/employees/${editEmpId}` : `${API}/api/employees`;
  const method = editEmpId ? 'PUT' : 'POST';
  const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  if (!data.success) {
    showNotification('Error', data.message || 'Error saving employee.', false);
    return;
  }

  closeModal('emp');
  const isEdit = editEmpId ? true : false;
  
  // Show success notification
  showNotification(
    isEdit ? 'Employee Updated' : 'Employee Created',
    isEdit ? 'Employee has been updated successfully!' : 'Employee has been created successfully!',
    true
  );
  
  // Real-time update
  await loadEmployees();
  
  // Refresh dashboard if it's open
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    renderDashboard();
  }
  
  const id = editEmpId || data.id;
  selectEmployee(id);
}

async function deleteEmployee(id) {
  if (!confirm('Delete this employee and all their training records?')) return;
  const res = await fetch(`${API}/api/employees/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) {
    showNotification('Error', 'Error deleting employee.', false);
    return;
  }
  currentEmp = null;
  
  // Show success notification
  showNotification('Employee Deleted', 'Employee has been deleted successfully.', true);
  
  // Real-time update
  await loadEmployees();
  
  // Refresh dashboard if it's open
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    renderDashboard();
  }
  
  document.getElementById('main').innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">📋</div>
      <h2>Employee Training Record</h2>
      <p>Create a new employee to get started.</p>
      <button class="btn btn-primary" onclick="openModal('emp')">＋ Add New Employee</button>
    </div>`;
}

/* ════════════════════════════════
   TRAINING MODAL
════════════════════════════════ */
function openAddTraining() {
  editTrainId = null;
  document.getElementById('trainModalTitle').textContent = 'Add Training Record';
  ['date_from','date_to','duration','course_title','training_provider','venue','trainer']
    .forEach(k => document.getElementById(`t_${k}`).value = '');
  document.getElementById('t_type_tb').value = 'T';
  openModal('train');
}

function openViewTraining(id) {
  // Find the training record from the global trainings array
  const t = (window.trainings || trainings).find(x => x.id == id);
  if (!t) {
    console.error('Training record not found:', id);
    return;
  }
  
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  
  // Populate view modal
  document.getElementById('v_date_from').textContent = fmt(t.date_from);
  document.getElementById('v_date_to').textContent = fmt(t.date_to);
  document.getElementById('v_duration').textContent = t.duration;
  document.getElementById('v_type_tb').textContent = t.type_tb === 'T' ? 'Technical (T)' : 'Behavioral (B)';
  document.getElementById('v_course_title').textContent = t.course_title;
  document.getElementById('v_training_provider').textContent = t.training_provider;
  document.getElementById('v_venue').textContent = t.venue;
  document.getElementById('v_trainer').textContent = t.trainer;
  document.getElementById('v_effectiveness_form').textContent = t.effectiveness_form;
  
  // Store ID for edit conversion
  window.currentViewTrainId = id;
  
  openModal('viewTrain');
}

function convertViewToEdit() {
  // Store the ID before closing the modal
  const trainId = window.currentViewTrainId;
  closeModal('viewTrain');
  // Now open the edit modal with the stored ID
  if (trainId) {
    openEditTraining(trainId);
  }
}

// Dashboard functions are now in dashboard.js

async function openEditTraining(id) {
  // Find the training record from the global trainings array
  const t = (window.trainings || trainings).find(x => x.id == id);
  if (!t) {
    console.error('Training record not found:', id);
    return;
  }
  editTrainId = id;
  const trainModalTitleEl = document.getElementById('trainingModalTitle') || document.getElementById('trainModalTitle');
  if (trainModalTitleEl) trainModalTitleEl.textContent = 'Edit Training Record';
  
  // Populate employee dropdown first
  populateEmployeeDropdown();
  
  // Set all form values including employee
  document.getElementById('t_employee_id').value = t.employee_id;
  document.getElementById('t_date_from').value = t.date_from?.split('T')[0] || '';
  document.getElementById('t_date_to').value = t.date_to?.split('T')[0] || '';
  document.getElementById('t_duration').value = t.duration;
  document.getElementById('t_course_title').value = t.course_title;
  document.getElementById('t_training_provider').value = t.training_provider;
  document.getElementById('t_venue').value = t.venue;
  document.getElementById('t_trainer').value = t.trainer;
  document.getElementById('t_type_tb').value = t.type_tb;
  document.getElementById('t_effectiveness_form').value = t.effectiveness_form;
  openModal('train');
}

async function saveTraining() {
  // Get employee_id from the dropdown
  let employeeId = document.getElementById('t_employee_id')?.value;
  
  // Fallback to currentEmp if no selection
  if (!employeeId && currentEmp) {
    employeeId = currentEmp.id;
  }
  
  // Fallback to currentOverviewEmpId if available
  if (!employeeId && currentOverviewEmpId) {
    employeeId = currentOverviewEmpId;
  }
  
  if (!employeeId) {
    showNotification('Error', 'Please select an employee.', false);
    return;
  }
  
  const body = {
    employee_id: employeeId,
    date_from: document.getElementById('t_date_from').value,
    date_to: document.getElementById('t_date_to').value,
    duration: document.getElementById('t_duration').value.trim(),
    course_title: document.getElementById('t_course_title').value.trim(),
    training_provider: document.getElementById('t_training_provider').value.trim(),
    venue: document.getElementById('t_venue').value.trim(),
    trainer: document.getElementById('t_trainer').value.trim(),
    type_tb: document.getElementById('t_type_tb').value,
    effectiveness_form: document.getElementById('t_effectiveness_form').value.trim() || 'N/A',
  };
  if (!body.date_from || !body.date_to || !body.duration || !body.course_title ||
      !body.training_provider || !body.venue || !body.trainer) {
    showNotification('Validation Error', 'Please fill in all required fields.', false);
    return;
  }

  const url = editTrainId ? `${API}/api/trainings/${editTrainId}` : `${API}/api/trainings`;
  const method = editTrainId ? 'PUT' : 'POST';
  const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  if (!data.success) {
    showNotification('Error', data.message || 'Error saving training.', false);
    return;
  }

  closeModal('train');
  const isEdit = editTrainId ? true : false;
  
  // Show success notification
  showNotification(
    isEdit ? 'Training Updated' : 'Training Added',
    isEdit ? 'Training record has been updated successfully!' : 'Training record has been added successfully!',
    true
  );
  
  // Real-time update
  await loadEmployees();
  
  // Refresh the overview modal if it's open
  if (currentOverviewEmpId) {
    openEmployeeTrainingOverview(currentOverviewEmpId);
  }
  
  // Refresh dashboard if it's open
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    renderDashboard();
  }
  
  // If we have a currentEmp, refresh their view, otherwise refresh all trainings
  if (typeof loadDataForTrainingPage === 'function') {
    // On training-records.html page - refresh the list
    await loadDataForTrainingPage();
  } else if (currentEmp) {
    selectEmployee(currentEmp.id);
  } else if (typeof showAllTrainingRecords === 'function') {
    showAllTrainingRecords();
  }
}


async function deleteTraining(id) {
  if (!confirm('Delete this training record?')) return;
  const res = await fetch(`${API}/api/trainings/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) {
    showNotification('Error', 'Error deleting training record.', false);
    return;
  }
  
  // Show success notification
  showNotification('Training Deleted', 'Training record has been deleted successfully.', true);
  
  // Real-time update
  await loadEmployees();
  
  // Refresh dashboard if it's open
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    renderDashboard();
  }
  
  // Refresh the view
  if (currentEmp) {
    selectEmployee(currentEmp.id);
  } else {
    showAllTrainingRecords();
  }
}

/* ════════════════════════════════
   TOAST
════════════════════════════════ */
let toastTimer;
function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = (isError ? '❌ ' : '✅ ') + msg;
  el.className = 'show' + (isError ? ' toast-error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = '', 3000);
}

/* ════════════════════════════════
   PDF DOWNLOAD
════════════════════════════════ */
async function downloadPDF(empId) {
  const emp = employees.find(e => e.id == empId);
  if (!emp) return showNotification('Error', 'Employee not found.', false);
  
  // Get employee trainings
  const empTrainings = trainings.filter(t => t.employee_id == empId);
  
  // Create HTML content for PDF
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  
  let tableRows = '';
  if (empTrainings.length === 0) {
    tableRows = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No training records found</td></tr>';
  } else {
    tableRows = empTrainings.map(t => `
      <tr>
        <td>${fmt(t.date_from)}</td>
        <td>${fmt(t.date_to)}</td>
        <td>${t.duration}</td>
        <td class="left">${t.course_title}</td>
        <td>${t.training_provider}</td>
        <td>${t.venue}</td>
        <td>${t.trainer}</td>
        <td><span class="badge badge-${t.type_tb}">${t.type_tb}</span></td>
        <td>${t.effectiveness_form}</td>
      </tr>
    `).join('');
  }
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Employee Training Record - ${emp.full_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    @page { size: A4 landscape; margin: 8mm; }
    .container { width: 100%; padding: 10mm; }
    .header { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #000; }
    .logo { width: 60px; height: 60px; margin-right: 12px; }
    .company-info { text-align: center; }
    .company-info h1 { font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 0; }
    .company-info p { font-size: 10px; margin: 2px 0; }
    .title { text-align: center; font-size: 13px; font-weight: 700; margin: 8px 0; border: 2px solid #000; padding: 4px; }
    .emp-info { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; padding: 8px 0; }
    .info-field { }
    .info-field label { font-size: 9px; font-weight: 700; display: block; }
    .info-field span { font-size: 10px; font-weight: 600; display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    thead { background: #1a2340; color: white; }
    th { font-size: 13px; padding: 4px 3px; font-weight: 700; border: 1px solid #000; text-align: center; }
    td { padding: 3px 2px; font-size: 13px; border: 1px solid #ccc; text-align: center; }
    td.left { text-align: left; }
    .badge { padding: 2px 4px; font-size: 7px; border-radius: 3px; }
    .badge-T { background: #e8f4fd; color: #1a78c2; }
    .badge-B { background: #eafaf1; color: #1e8449; }
    .footer { font-size: 9px; text-align: left; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="NSB Logo" class="logo" style="width: 60px; height: 60px; margin-right: 12px;">
      <div class="company-info">
        <h1>NSB ENGINEERING</h1>
        <p>Design and Fabrication</p>
      </div>
    </div>
    
    <div class="title">Employee Training Record</div>
    
    <div class="emp-info">
      <div class="info-field">
        <label>Employee Name</label>
        <span>${emp.full_name || emp.employee_name}</span>
      </div>
      <div class="info-field">
        <label>Department</label>
        <span>${emp.department}</span>
      </div>
      <div class="info-field">
        <label>Employee No.</label>
        <span>${emp.employee_no}</span>
      </div>
      <div class="info-field">
        <label>Date Hired</label>
        <span>${fmt(emp.date_hired)}</span>
      </div>
      <div class="info-field">
        <label>Position</label>
        <span>${emp.position}</span>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Date From</th>
          <th>Date To</th>
          <th>Duration / No. of Hours</th>
          <th>Course / Title Description</th>
          <th>Training Provider</th>
          <th>Venue</th>
          <th>Trainer</th>
          <th>Type T/B</th>
          <th>Training Effectiveness Evaluation Form</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    
    <div class="footer">F-HRD03-4/EFF:${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</div>
  </div>
</body>
</html>`;
  
  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = 'Employee_Training_Record_' + emp.full_name.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.html';
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  showNotification('PDF Downloaded', 'Training record for ' + emp.full_name + ' has been downloaded.', true);
}

/* ════════════════════════════════
   DOWNLOAD SINGLE TRAINING RECORD PDF
════════════════════════════════ */
async function downloadSingleTrainingPDF() {
  const trainId = window.currentViewTrainId;
  if (!trainId) {
    showNotification('Error', 'Training record not found.', false);
    return;
  }
  
  const t = (window.trainings || trainings).find(x => x.id == trainId);
  if (!t) {
    showNotification('Error', 'Training record not found.', false);
    return;
  }
  
  const emp = (window.employees || employees).find(e => e.id == t.employee_id);
  if (!emp) {
    showNotification('Error', 'Employee not found.', false);
    return;
  }
  
  // Format date helper
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  
  // Create HTML content for single training record
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Training Record - ${emp.full_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    @page { size: A4 landscape; margin: 8mm; }
    .container { width: 100%; padding: 10mm; }
    .header { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #000; }
    .logo { width: 60px; height: 60px; margin-right: 12px; }
    .company-info { text-align: center; }
    .company-info h1 { font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 0; }
    .company-info p { font-size: 10px; margin: 2px 0; }
    .title { text-align: center; font-size: 13px; font-weight: 700; margin: 8px 0; border: 2px solid #000; padding: 4px; }
    .emp-info { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; padding: 8px 0; }
    .info-field { }
    .info-field label { font-size: 9px; font-weight: 700; display: block; }
    .info-field span { font-size: 10px; font-weight: 600; display: block; }
    .training-details { margin-top: 12px; }
    .detail-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
    .detail-field { }
    .detail-field label { font-size: 9px; font-weight: 700; color: #1a2340; display: block; margin-bottom: 2px; }
    .detail-field span { font-size: 10px; padding: 6px; background: #f7f9fd; border: 1px solid #ddd; border-radius: 3px; display: block; }
    .footer { font-size: 9px; text-align: left; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="NSB Logo" class="logo" style="width: 60px; height: 60px; margin-right: 12px;">
      <div class="company-info">
        <h1>NSB ENGINEERING</h1>
        <p>Design and Fabrication</p>
      </div>
    </div>
    
    <div class="title">Training Record Details</div>
    
    <div class="emp-info">
      <div class="info-field">
        <label>Employee Name</label>
        <span>${emp.full_name || emp.employee_name}</span>
      </div>
      <div class="info-field">
        <label>Department</label>
        <span>${emp.department}</span>
      </div>
      <div class="info-field">
        <label>Employee No.</label>
        <span>${emp.employee_no}</span>
      </div>
      <div class="info-field">
        <label>Date Hired</label>
        <span>${fmt(emp.date_hired)}</span>
      </div>
      <div class="info-field">
        <label>Position</label>
        <span>${emp.position}</span>
      </div>
    </div>
    
    <div class="training-details">
      <div class="detail-row">
        <div class="detail-field">
          <label>Date From</label>
          <span>${fmt(t.date_from)}</span>
        </div>
        <div class="detail-field">
          <label>Date To</label>
          <span>${fmt(t.date_to)}</span>
        </div>
      </div>
      
      <div class="detail-row">
        <div class="detail-field">
          <label>Duration / No. of Hours</label>
          <span>${t.duration}</span>
        </div>
        <div class="detail-field">
          <label>Type (T/B)</label>
          <span>${t.type_tb === 'T' ? 'Technical (T)' : 'Behavioral (B)'}</span>
        </div>
      </div>
      
      <div class="detail-row">
        <div class="detail-field">
          <label>Course / Title Description</label>
          <span>${t.course_title}</span>
        </div>
        <div class="detail-field">
          <label>Training Provider</label>
          <span>${t.training_provider}</span>
        </div>
      </div>
      
      <div class="detail-row">
        <div class="detail-field">
          <label>Venue</label>
          <span>${t.venue}</span>
        </div>
        <div class="detail-field">
          <label>Trainer</label>
          <span>${t.trainer}</span>
        </div>
      </div>
      
      <div class="detail-row">
        <div class="detail-field">
          <label>Training Effectiveness Form</label>
          <span>${t.effectiveness_form}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">F-HRD03-4/EFF:${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</div>
  </div>
</body>
</html>`;
  
  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = 'Training_Record_' + emp.full_name.replace(/\s+/g, '_') + '_' + t.course_title.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.html';
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  showNotification('PDF Downloaded', 'Training record has been downloaded.', true);
}

/* ════════════════════════════════
   CLOSE MODAL ON BACKDROP
════════════════════════════════ */
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
});

/* ════════════════════════════════
   INIT
════════════════════════════════ */
// Only auto-load dashboard on index.html
if (document.getElementById('dashboardSection') || document.getElementById('recordsSection')) {
  loadEmployees().then(() => {
    if (typeof showDashboard === 'function') {
      showDashboard();
    }
  });
}
