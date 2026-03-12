// Dashboard functions
// Use global employees and trainings from app.js
function getEmployees() {
  return window.employees || [];
}

function getTrainings() {
  return window.trainings || [];
}

async function loadDashboardData() {
  // Data is loaded by app.js, just use window.employees and window.trainings
  console.log('Dashboard using data from app.js');
}

function showDashboard() {
  const recordsSection = document.getElementById('recordsSection');
  const dashboardSection = document.getElementById('dashboardSection');
  
  if (!recordsSection || !dashboardSection) {
    console.error('ERROR: Required elements not found in showDashboard!');
    console.error('recordsSection:', recordsSection);
    console.error('dashboardSection:', dashboardSection);
    return;
  }
  
  recordsSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  
  // Scroll to top to show Employee Analytics section
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Load data and render
  loadDashboardData().then(() => renderDashboard());
}

function hideDashboard() {
  const dashboardSection = document.getElementById('dashboardSection');
  const recordsSection = document.getElementById('recordsSection');
  
  if (!dashboardSection || !recordsSection) {
    console.error('ERROR: Required elements not found in hideDashboard!');
    return;
  }
  
  dashboardSection.style.display = 'none';
  recordsSection.style.display = 'block';
}

function renderDashboard() {
  const employees = getEmployees();
  const trainings = getTrainings();
  
  console.log('=== renderDashboard called ===');
  console.log('window.employees:', window.employees);
  console.log('window.trainings:', window.trainings);
  console.log('employees from getter:', employees.length);
  console.log('trainings from getter:', trainings.length);
  
  // Calculate statistics
  const totalEmployees = employees.length;
  const allTrainings = trainings;
  const technicalCount = allTrainings.filter(t => t.type_tb === 'T').length;
  const behavioralCount = allTrainings.filter(t => t.type_tb === 'B').length;
  const attachmentCount = allTrainings.filter(t => t.eff_form_file).length;

  console.log('Stats calculated:', { totalEmployees, totalTrainings: allTrainings.length, technicalCount, behavioralCount });

  // Update stat cards
  const totalEmployeesEl = document.getElementById('totalEmployees');
  const totalTrainingsEl = document.getElementById('totalTrainings');
  
  if (totalEmployeesEl) totalEmployeesEl.textContent = totalEmployees;
  if (totalTrainingsEl) totalTrainingsEl.textContent = allTrainings.length;
  
  const attachmentsEl = document.getElementById('totalAttachments');
  if (attachmentsEl) attachmentsEl.textContent = attachmentCount;
  
  const technicalEl = document.getElementById('technicalTrainings');
  if (technicalEl) technicalEl.textContent = technicalCount;
  
  const behavioralEl = document.getElementById('behavioralTrainings');
  if (behavioralEl) behavioralEl.textContent = behavioralCount;

  // Average trainings per employee
  const avgTrainings = totalEmployees > 0 ? (allTrainings.length / totalEmployees).toFixed(1) : 0;
  document.getElementById('avgTrainingsPerEmp').textContent = avgTrainings;

  // Most trained employee
  const empTrainingCounts = {};
  allTrainings.forEach(t => {
    empTrainingCounts[t.employee_id] = (empTrainingCounts[t.employee_id] || 0) + 1;
  });
  
  let mostTrainedName = '-';
  if (Object.keys(empTrainingCounts).length > 0) {
    const mostTrainedId = Object.entries(empTrainingCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
    const mostTrainedEmp = employees.find(e => e.id == mostTrainedId);
    mostTrainedName = mostTrainedEmp ? (mostTrainedEmp.full_name || mostTrainedEmp.employee_name || 'Unknown') : 'Unknown';
  }
  document.getElementById('mostTrainedEmp').textContent = mostTrainedName;

  // Top training provider
  const providerCounts = {};
  allTrainings.forEach(t => {
    providerCounts[t.training_provider] = (providerCounts[t.training_provider] || 0) + 1;
  });
  
  let topProviderName = '-';
  if (Object.keys(providerCounts).length > 0) {
    topProviderName = Object.entries(providerCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  document.getElementById('topProvider').textContent = topProviderName;

  // Training completion rate (assuming all trainings are completed)
  document.getElementById('completionRate').textContent = '100%';

  // Draw pie chart for training types
  drawTypeChart(technicalCount, behavioralCount);

  // Get top trainers
  const trainerCounts = {};
  allTrainings.forEach(t => {
    trainerCounts[t.trainer] = (trainerCounts[t.trainer] || 0) + 1;
  });
  
  const topTrainers = Object.entries(trainerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topTrainersHtml = topTrainers.map(([trainer, count]) => `
    <div class="trainer-item">
      <span class="trainer-name">${trainer}</span>
      <span class="trainer-count">${count}</span>
    </div>
  `).join('');
  
  document.getElementById('topTrainers').innerHTML = topTrainersHtml || '<p style="color: var(--muted);">No trainers yet</p>';

  // Trainings by department
  const deptCounts = {};
  employees.forEach(emp => {
    const empTrainings = allTrainings.filter(t => t.employee_id == emp.id).length;
    if (empTrainings > 0) {
      deptCounts[emp.department] = (deptCounts[emp.department] || 0) + empTrainings;
    }
  });
  
  const deptHtml = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([dept, count]) => `
      <div class="dept-item">
        <span class="dept-name">${dept}</span>
        <span class="dept-count">${count}</span>
      </div>
    `).join('');
  
  document.getElementById('deptTrainings').innerHTML = deptHtml || '<p style="color: var(--muted);">No departments</p>';

  // Top training providers
  const topProviders = Object.entries(providerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topProvidersHtml = topProviders.map(([provider, count]) => `
    <div class="provider-item">
      <span class="provider-name">${provider}</span>
      <span class="provider-count">${count}</span>
    </div>
  `).join('');
  
  document.getElementById('topProviders').innerHTML = topProvidersHtml || '<p style="color: var(--muted);">No providers</p>';

  // Recent trainings
  const recent = allTrainings
    .sort((a, b) => new Date(b.date_from) - new Date(a.date_from))
    .slice(0, 10);

  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  const recentHtml = recent.map(t => {
    const emp = employees.find(e => e.id === t.employee_id);
    const empName = emp ? (emp.full_name || emp.employee_name || 'Unknown') : 'Unknown';
    return `
      <tr>
        <td>${empName}</td>
        <td>${fmt(t.date_from)}</td>
        <td style="text-align: left;">${t.course_title}</td>
        <td>${t.trainer}</td>
        <td><span class="badge badge-${t.type_tb}">${t.type_tb}</span></td>
      </tr>
    `;
  }).join('');

  document.getElementById('recentTrainingsBody').innerHTML = recentHtml || '<tr><td colspan="5" style="text-align: center; color: var(--muted);">No training records</td></tr>';
}

function drawTypeChart(technical, behavioral) {
  const canvas = document.getElementById('typeChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const total = technical + behavioral;
  
  if (total === 0) {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const technicalPercent = (technical / total) * 100;
  const behavioralPercent = (behavioral / total) * 100;
  
  // Simple pie chart
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
  
  // Technical (blue)
  ctx.fillStyle = '#1a78c2';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, 0, (technicalPercent / 100) * 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
  
  // Behavioral (green)
  ctx.fillStyle = '#1e8449';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, (technicalPercent / 100) * 2 * Math.PI, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
  
  // Labels
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`T: ${technical}`, centerX - radius / 2, centerY - radius / 4);
  ctx.fillText(`B: ${behavioral}`, centerX + radius / 2, centerY + radius / 4);
}

/* ════════════════════════════════
   EMPLOYEE SEARCH FUNCTIONS
════════════════════════════════ */
let selectedEmployeeId = null;

function searchEmployee() {
  const employees = getEmployees();
  const input = document.getElementById('empSearchInput');
  const results = document.getElementById('empSearchResults');
  const searchTerm = input.value.toLowerCase().trim();
  
  if (searchTerm.length < 1) {
    results.style.display = 'none';
    return;
  }
  
  // Filter employees by name OR employee number
  const matches = employees.filter(emp => {
    const name = (emp.full_name || emp.employee_name || '').toLowerCase();
    const empNo = (emp.employee_no || '').toLowerCase();
    return name.includes(searchTerm) || empNo.includes(searchTerm);
  }).slice(0, 10);
  
  if (matches.length === 0) {
    results.innerHTML = '<div style="padding: 15px; color: #666; text-align: center;">❌ No employees found</div>';
  } else {
    results.innerHTML = matches.map(emp => `
      <div style="padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #eee; transition: all 0.2s;" 
        onclick="selectEmployee(${emp.id}, '${(emp.full_name || emp.employee_name).replace(/'/g, "\\'")}')"
        onmouseover="this.style.background='#f0f4ff'; this.style.paddingLeft='20px'" 
        onmouseout="this.style.background='white'; this.style.paddingLeft='15px'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: var(--navy); font-size: 15px;">${emp.full_name || emp.employee_name}</strong><br>
            <small style="color: #666;">ID: ${emp.employee_no} • ${emp.department || ''} • ${emp.position || ''}</small>
          </div>
          <span style="background: var(--navy); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">SELECT</span>
        </div>
      </div>
    `).join('');
  }
  
  results.style.display = 'block';
}

function selectEmployee(empId, empName) {
  const employees = getEmployees();
  const trainings = getTrainings();
  
  console.log('=== SELECT EMPLOYEE DEBUG ===');
  console.log('Selected empId:', empId, 'Type:', typeof empId);
  console.log('Total trainings available:', trainings.length);
  console.log('Sample training employee_ids:', trainings.slice(0, 3).map(t => ({ id: t.employee_id, type: typeof t.employee_id })));
  
  selectedEmployeeId = empId;
  const results = document.getElementById('empSearchResults');
  const input = document.getElementById('empSearchInput');
  
  input.value = empName;
  results.style.display = 'none';
  
  // Get employee's training records - try both string and number comparison
  const empTrainings = trainings.filter(t => t.employee_id == empId || t.employee_id === empId);
  console.log('Filtered trainings for employee:', empTrainings.length);
  
  const emp = employees.find(e => e.id === empId);
  
  // Calculate stats based on effectiveness form type
  const totalTrainings = empTrainings.length;
  const withAttachments = empTrainings.filter(t => t.eff_form_file).length;
  
  // W/EXAM = PDF files, W/TEEF = Certificate files
  const examCount = empTrainings.filter(t => t.effectiveness_form === 'W/EXAM').length;
  const teefCount = empTrainings.filter(t => t.effectiveness_form === 'W/TEEF').length;
  const pdfCount = examCount; // W/EXAM uses PDF files
  const certCount = teefCount; // W/TEEF uses Certificate files
  
  console.log('Stats:', { totalTrainings, withAttachments, examCount, teefCount });
  
  // Update display with enhanced formatting
  document.getElementById('empDetailsName').textContent = empName + (emp ? ` - ${emp.department || ''}` : '');
  document.getElementById('empTotalTrainings').textContent = totalTrainings;
  
  // Show "X out of Y" format for attachments
  document.getElementById('empWithAttachments').innerHTML = `${withAttachments}<br><small style="font-size: 12px; color: var(--muted);">out of ${totalTrainings}</small>`;
  document.getElementById('empPdfCount').innerHTML = `${pdfCount}<br><small style="font-size: 12px; color: var(--muted);">W/EXAM (PDF)</small>`;
  document.getElementById('empCertCount').innerHTML = `${certCount}<br><small style="font-size: 12px; color: var(--muted);">W/TEEF (Cert)</small>`;
  document.getElementById('empExamCount').innerHTML = `${examCount}<br><small style="font-size: 12px; color: var(--muted);">out of ${totalTrainings}</small>`;
  document.getElementById('empTeefCount').innerHTML = `${teefCount}<br><small style="font-size: 12px; color: var(--muted);">out of ${totalTrainings}</small>`;
  
  // Render training list
  const tbody = document.getElementById('empTrainingsList');
  tbody.innerHTML = empTrainings.map(t => {
    const hasAttachment = t.eff_form_file ? '✅' : '❌';
    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 10px;">${formatDate(t.date_from)}</td>
        <td style="padding: 8px 10px;">${t.course_title}</td>
        <td style="padding: 8px 10px; text-align: center;"><span class="badge badge-${t.type_tb}">${t.type_tb}</span></td>
        <td style="padding: 8px 10px; text-align: center;">${t.effectiveness_form || 'N/A'}</td>
        <td style="padding: 8px 10px; text-align: center;">${hasAttachment}</td>
      </tr>
    `;
  }).join('');
  
  // Show employee details
  document.getElementById('employeeDetails').style.display = 'block';
}

function clearEmployeeSearch() {
  document.getElementById('empSearchInput').value = '';
  document.getElementById('empSearchResults').style.display = 'none';
  document.getElementById('employeeDetails').style.display = 'none';
  selectedEmployeeId = null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

// Add global employees and trainings references
if (typeof window.employees === 'undefined') {
  window.employees = [];
  window.trainings = [];
}

// Expose functions globally for HTML onclick handlers
window.searchEmployee = searchEmployee;
window.selectEmployee = selectEmployee;
window.clearEmployeeSearch = clearEmployeeSearch;
window.showDashboard = showDashboard;
window.hideDashboard = hideDashboard;
window.renderDashboard = renderDashboard;
