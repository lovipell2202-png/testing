// Use local copies for filtering (API constant from app.js)
let localEmployees = [];
let localTrainings = [];
let filteredTrainings = [];
let currentFilter = 'all';
let trainingSortColumn = '';
let trainingSortOrder = 'asc';

// Pagination state
let currentPage = 1;
let rowsPerPage = 10;

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

// Load employees and trainings independently
async function loadDataForTrainingPage() {
  try {
    console.log('=== TRAINING RECORDS PAGE: Starting data load ===');
    
    // Load employees
    const empRes = await fetch(`${API}/api/employees`);
    console.log('Employee response status:', empRes.status);
    
    if (!empRes.ok) {
      throw new Error(`HTTP error! status: ${empRes.status}`);
    }
    
    const empData = await empRes.json();
    console.log('Employee data received:', empData);
    
    if (empData.success && empData.data && Array.isArray(empData.data)) {
      localEmployees = empData.data;
      console.log('Loaded employees:', localEmployees.length);
      
      // Load all trainings
      const allTrainings = [];
      for (const emp of localEmployees) {
        const trainRes = await fetch(`${API}/api/employees/${emp.id}`);
        const trainData = await trainRes.json();
        if (trainData.trainings) {
          allTrainings.push(...trainData.trainings);
        }
      }
      localTrainings = allTrainings;
      console.log('Loaded trainings:', localTrainings.length);
      
      // Update global references for modals and app.js functions
      window.employees = localEmployees;
      window.trainings = localTrainings;
      
      // Also update app.js global variables directly
      if (typeof employees !== 'undefined') employees = localEmployees;
      if (typeof trainings !== 'undefined') trainings = localTrainings;
      
      // Initial render
      filteredTrainings = [...localTrainings];
      renderTrainings();
      
      console.log('=== TRAINING RECORDS PAGE: Data load complete ===');
    } else {
      console.error('API returned invalid data structure');
      console.error('empData:', empData);
      showError('Failed to load data: Invalid data structure');
    }
  } catch (error) {
    console.error('=== TRAINING RECORDS PAGE: Error loading data ===');
    console.error('Error:', error);
    showError(`Error loading data: ${error.message}`);
  }
}

// Change filter
function changeFilter(filter) {
  currentFilter = filter;
  currentPage = 1;
  
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  const activeTab = document.querySelector(`[data-filter="${filter}"]`);
  if (activeTab) activeTab.classList.add('active');
  
  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) {
    typeFilter.style.display = filter === 'trainer' ? 'none' : 'block';
  }
  
  applyFilters();
}

// Apply filters
function applyFilters() {
  const searchTerm = document.getElementById('trainingSearch')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('typeFilter')?.value || 'all';
  
  filteredTrainings = [...localTrainings];
  
  if (currentFilter === 'T' || currentFilter === 'B') {
    filteredTrainings = filteredTrainings.filter(t => t.type_tb === currentFilter);
  }
  
  if (currentFilter !== 'trainer' && typeFilter !== 'all') {
    filteredTrainings = filteredTrainings.filter(t => t.type_tb === typeFilter);
  }
  
  if (searchTerm) {
    filteredTrainings = filteredTrainings.filter(t => {
      const emp = localEmployees.find(e => e.id == t.employee_id);
      const empName = (emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown').toLowerCase();
      return empName.includes(searchTerm) ||
             t.course_title.toLowerCase().includes(searchTerm) ||
             t.training_provider.toLowerCase().includes(searchTerm) ||
             t.trainer.toLowerCase().includes(searchTerm);
    });
  }
  
  currentPage = 1;
  
  if (currentFilter === 'trainer') {
    renderByTrainer();
  } else {
    renderTrainings();
  }
}

// Change rows per page
function changeRowsPerPage(val) {
  rowsPerPage = parseInt(val);
  currentPage = 1;
  renderTrainings();
}

// Go to page
function goToPage(page) {
  const totalPages = Math.ceil(filteredTrainings.length / rowsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTrainings();
}

// Render trainings table
function renderTrainings() {
  const content = document.getElementById('trainingContent');
  
  if (!content) {
    console.error('trainingContent element not found!');
    return;
  }
  
  // Restore table structure if it was replaced by trainer view
  if (!document.getElementById('trainingTableBody')) {
    content.innerHTML = `
      <div class="table-section">
        <div class="table-header">
          <h3>Training Records <span id="recordCount" class="count-badge">(0 records)</span></h3>
          <div class="rows-per-page">
            <label>Show</label>
            <select id="rowsPerPageSelect" onchange="changeRowsPerPage(this.value)">
              <option value="10" ${rowsPerPage === 10 ? 'selected' : ''}>10</option>
              <option value="15" ${rowsPerPage === 15 ? 'selected' : ''}>15</option>
              <option value="20" ${rowsPerPage === 20 ? 'selected' : ''}>20</option>
            </select>
            <label>rows</label>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Employee</th>
                <th style="text-align: left;">Date From</th>
                <th style="text-align: left;">Date To</th>
                <th style="text-align: left;">Course</th>
                <th style="text-align: left;">Trainer</th>
                <th style="text-align: center;">Type</th>
                <th style="text-align: left;">Provider</th>
                <th style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="trainingTableBody"></tbody>
          </table>
        </div>
        <div id="paginationContainer" class="pagination-container"></div>
      </div>
    `;
  }
  
  const tbody = document.getElementById('trainingTableBody');
  const countBadge = document.getElementById('recordCount');
  
  if (!tbody) {
    console.error('trainingTableBody element STILL not found after restore!');
    return;
  }

  // Sync rows per page select
  const rppSelect = document.getElementById('rowsPerPageSelect');
  if (rppSelect) rppSelect.value = rowsPerPage;
  
  if (countBadge) {
    countBadge.textContent = `(${filteredTrainings.length} record${filteredTrainings.length !== 1 ? 's' : ''})`;
  }
  
  if (filteredTrainings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">No training records found</div>
          <div class="empty-state-subtext">Try adjusting your search or filter</div>
        </td>
      </tr>
    `;
    renderPagination(0);
    return;
  }
  
  const totalPages = Math.ceil(filteredTrainings.length / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredTrainings.slice(start, end);
  
  tbody.innerHTML = pageData.map(t => {
    const emp = localEmployees.find(e => e.id == t.employee_id);
    const empName = emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown';
    
    return `
      <tr class="training-row" ondblclick="viewTraining(${t.id})">
        <td class="employee-name-cell">${empName}</td>
        <td>${formatDate(t.date_from)}</td>
        <td>${formatDate(t.date_to)}</td>
        <td class="course-cell">${t.course_title}</td>
        <td>${t.trainer}</td>
        <td style="text-align: center;">
          <span class="badge badge-${t.type_tb}">${t.type_tb}</span>
        </td>
        <td>${t.training_provider}</td>
        <td style="text-align: center; white-space: nowrap;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); viewTraining(${t.id})" title="View">👁️ View</button>
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); editTraining(${t.id})" title="Edit">✏️ Edit</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  renderPagination(totalPages);
}

// Render pagination controls
function renderPagination(totalPages) {
  const container = document.getElementById('paginationContainer');
  if (!container) return;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, filteredTrainings.length);
  
  let pages = '';
  
  // Generate page number buttons (show max 5 around current)
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  if (startPage > 1) {
    pages += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) pages += `<span class="page-ellipsis">…</span>`;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages += `<span class="page-ellipsis">…</span>`;
    pages += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }
  
  container.innerHTML = `
    <div class="pagination-info">Showing ${start}–${end} of ${filteredTrainings.length} records</div>
    <div class="pagination-controls">
      <button class="page-btn nav-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&#8592; Previous</button>
      ${pages}
      <button class="page-btn nav-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &#8594;</button>
    </div>
  `;
}

// Render by trainer
function renderByTrainer() {
  const content = document.getElementById('trainingContent');
  
  if (!content) {
    console.error('trainingContent element not found!');
    return;
  }
  
  const trainerMap = {};
  filteredTrainings.forEach(t => {
    if (!trainerMap[t.trainer]) {
      trainerMap[t.trainer] = [];
    }
    trainerMap[t.trainer].push(t);
  });
  
  if (Object.keys(trainerMap).length === 0) {
    content.innerHTML = `
      <div class="empty-state" style="padding: 80px 20px;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">No training records found</div>
        <div class="empty-state-subtext">Try adjusting your search</div>
      </div>
    `;
    return;
  }
  
  let html = '';
  Object.entries(trainerMap).forEach(([trainer, records]) => {
    html += `
      <div class="trainer-section">
        <div class="trainer-card">
          <div class="trainer-header">
            <span>${trainer}</span>
            <span class="trainer-count">${records.length} training${records.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Employee</th>
                  <th style="text-align: left;">Date From</th>
                  <th style="text-align: left;">Course</th>
                  <th style="text-align: center;">Type</th>
                  <th style="text-align: left;">Duration</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(t => {
                  const emp = localEmployees.find(e => e.id === t.employee_id);
                  const empName = emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown';
                  return `
                    <tr class="training-row" ondblclick="viewTraining(${t.id})">
                      <td class="employee-name-cell">${empName}</td>
                      <td>${formatDate(t.date_from)}</td>
                      <td class="course-cell">${t.course_title}</td>
                      <td style="text-align: center;">
                        <span class="badge badge-${t.type_tb}">${t.type_tb}</span>
                      </td>
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
  
  content.innerHTML = html;
}

// View training - delegates to app.js openViewTraining
function viewTraining(trainingId) {
  if (typeof openViewTraining === 'function') {
    openViewTraining(trainingId);
  } else {
    console.error('openViewTraining function not found');
  }
}

// Edit training - delegates to app.js openEditTraining
function editTraining(trainingId) {
  if (typeof openEditTraining === 'function') {
    openEditTraining(trainingId);
  } else {
    console.error('openEditTraining function not found');
  }
}

// Show error message
function showError(message) {
  const tbody = document.getElementById('trainingTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--red);">
          <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
          <p>${message}</p>
        </td>
      </tr>
    `;
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Training Records Page');
  
  const searchInput = document.getElementById('trainingSearch');
  const typeFilter = document.getElementById('typeFilter');
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', applyFilters);
  }
  
  loadDataForTrainingPage();
});


// Sort training records table
function sortTrainings(column) {
  if (trainingSortColumn === column) {
    trainingSortOrder = trainingSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    trainingSortColumn = column;
    trainingSortOrder = 'asc';
  }
  
  filteredTrainings.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    // Handle employee name
    if (column === 'employee_name') {
      const empA = localEmployees.find(e => e.id == a.employee_id);
      const empB = localEmployees.find(e => e.id == b.employee_id);
      aVal = empA ? (empA.full_name || empA.employee_name) : '';
      bVal = empB ? (empB.full_name || empB.employee_name) : '';
    }
    
    // Handle dates
    if (column === 'date_from' || column === 'date_to') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    // Handle strings
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return trainingSortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return trainingSortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  renderTrainings();
}
