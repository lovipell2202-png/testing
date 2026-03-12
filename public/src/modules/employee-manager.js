/**
 * Employee Manager Module
 * Handles employee CRUD operations and rendering
 */

let currentEmp = null;
let editEmpId = null;

// Open add employee modal
function openAddEmp() {
  editEmpId = null;
  document.getElementById('empModalTitle').textContent = 'Add Employee';
  ['employee_no', 'employee_name', 'department', 'position', 'date_hired'].forEach(k => {
    const field = document.getElementById(`f_${k}`);
    if (field) field.value = '';
  });
  window.UIHelpers.openModal('emp');
}

// Open edit employee modal
function openEditEmp() {
  if (!currentEmp) return;
  editEmpId = currentEmp.id;
  document.getElementById('empModalTitle').textContent = 'Edit Employee';
  document.getElementById('f_employee_no').value = currentEmp.employee_no;
  document.getElementById('f_employee_name').value = currentEmp.full_name || currentEmp.employee_name || '';
  document.getElementById('f_department').value = currentEmp.department;
  document.getElementById('f_position').value = currentEmp.position;
  document.getElementById('f_date_hired').value = currentEmp.date_hired?.split('T')[0] || '';
  window.UIHelpers.openModal('emp');
}

// Save employee
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
    window.UIHelpers.showNotification('Validation Error', 'Please fill in all fields.', false);
    return;
  }

  const url = editEmpId ? `${window.API || ''}/api/employees/${editEmpId}` : `${window.API || ''}/api/employees`;
  const method = editEmpId ? 'PUT' : 'POST';
  const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  
  if (!data.success) {
    window.UIHelpers.showNotification('Error', data.message || 'Error saving employee.', false);
    return;
  }

  window.UIHelpers.closeModal('emp');
  const isEdit = editEmpId ? true : false;
  
  window.UIHelpers.showNotification(
    isEdit ? 'Employee Updated' : 'Employee Created',
    isEdit ? 'Employee has been updated successfully!' : 'Employee has been created successfully!',
    true
  );
  
  await window.DataLoader.loadEmployees();
  
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
  
  const id = editEmpId || data.id;
  selectEmployee(id);
}

// Delete employee
async function deleteEmployee(id) {
  if (!confirm('Delete this employee and all their training records?')) return;
  
  const res = await fetch(`${window.API || ''}/api/employees/${id}`, { method: 'DELETE' });
  const data = await res.json();
  
  if (!data.success) {
    window.UIHelpers.showNotification('Error', 'Error deleting employee.', false);
    return;
  }
  
  currentEmp = null;
  window.UIHelpers.showNotification('Employee Deleted', 'Employee has been deleted successfully.', true);
  
  await window.DataLoader.loadEmployees();
  
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
  
  document.getElementById('main').innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">📋</div>
      <h2>Employee Training Record</h2>
      <p>Create a new employee to get started.</p>
      <button class="btn btn-primary" onclick="openAddEmp()">＋ Add New Employee</button>
    </div>`;
}

// Select employee
async function selectEmployee(id) {
  const res = await fetch(`${window.API || ''}/api/employees/${id}`);
  const data = await res.json();
  
  if (!data.success) {
    window.UIHelpers.toast('Failed to load employee.', true);
    return;
  }
  
  currentEmp = data.employee;
  const empTrainings = data.trainings || [];
  const empName = currentEmp.full_name || currentEmp.employee_name || 'Unknown';
  console.log(`Selected employee ${id} (${empName}): ${empTrainings.length} trainings`);
  
  if (typeof renderRecord === 'function') {
    renderRecord(currentEmp, empTrainings);
  }
  
  const dashboardSection = document.getElementById('dashboardSection');
  const recordsSection = document.getElementById('recordsSection');
  if (dashboardSection && recordsSection) {
    dashboardSection.style.display = 'none';
    recordsSection.style.display = 'block';
  }
}

// Export for use in other modules
window.EmployeeManager = {
  openAddEmp,
  openEditEmp,
  saveEmployee,
  deleteEmployee,
  selectEmployee,
  get currentEmp() { return currentEmp; },
  set currentEmp(val) { currentEmp = val; }
};
