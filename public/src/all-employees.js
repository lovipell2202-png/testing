// Use global employees and trainings from app.js (loaded via app.js)
let filteredEmployees = [];

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

// Load employees and trainings
async function loadDataForEmployeesPage() {
  try {
    // Use loadEmployees() from app.js which populates window.employees and window.trainings
    await loadEmployees();
    
    if (window.employees && window.employees.length > 0) {
      populateDepartmentFilter();
      filteredEmployees = [...window.employees];
      renderEmployees();
    } else {
      showError('No employees found. Make sure the server is running.');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Error loading data. Please refresh the page.');
  }
}

// Populate department filter
function populateDepartmentFilter() {
  const deptFilter = document.getElementById('deptFilter');
  const departments = [...new Set(window.employees.map(e => e.department))].sort();
  
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    deptFilter.appendChild(option);
  });
}

// Render employees table
function renderEmployees() {
  const tbody = document.getElementById('employeesTableBody');
  const countBadge = document.getElementById('employeeCount');
  
  countBadge.textContent = `(${filteredEmployees.length} employee${filteredEmployees.length !== 1 ? 's' : ''})`;
  
  if (filteredEmployees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">No employees found</div>
          <div class="empty-state-subtext">Try adjusting your search or filter</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filteredEmployees.map(emp => {
    const trainingCount = window.trainings.filter(t => t.employee_id == emp.id).length;
    const hasTrainings = trainingCount > 0;
    
    return `
      <tr class="employee-row" ondblclick="viewEmployeeTrainings(${emp.id})">
        <td class="employee-no">${emp.employee_no}</td>
        <td class="employee-name">${emp.full_name || emp.employee_name}</td>
        <td>${emp.department}</td>
        <td>${emp.position}</td>
        <td>${formatDate(emp.date_hired)}</td>
        <td style="text-align: center;">
          <span class="training-count ${hasTrainings ? 'has-trainings' : 'no-trainings'}">
            ${trainingCount} training${trainingCount !== 1 ? 's' : ''}
          </span>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewEmployeeTrainings(${emp.id})" title="View All Training">
            📋 View All
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Filter employees
function filterEmployees() {
  const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
  const deptFilter = document.getElementById('deptFilter').value;
  
  filteredEmployees = window.employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      (emp.full_name || emp.employee_name || '').toLowerCase().includes(searchTerm) ||
      emp.department.toLowerCase().includes(searchTerm) ||
      emp.employee_no.toLowerCase().includes(searchTerm) ||
      emp.position.toLowerCase().includes(searchTerm);
    
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    
    return matchesSearch && matchesDept;
  });
  
  renderEmployees();
}

// View employee trainings (open modal directly)
function viewEmployeeTrainings(empId) {
  // Call the function from app.js
  if (typeof openEmployeeTrainingOverview === 'function') {
    openEmployeeTrainingOverview(empId);
  } else {
    console.error('openEmployeeTrainingOverview function not found');
  }
}

// Show error message
function showError(message) {
  const tbody = document.getElementById('employeesTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 40px; color: var(--red);">
        <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
        <p>${message}</p>
      </td>
    </tr>
  `;
}

// Event listeners
document.getElementById('employeeSearch').addEventListener('input', filterEmployees);
document.getElementById('deptFilter').addEventListener('change', filterEmployees);

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadDataForEmployeesPage);
