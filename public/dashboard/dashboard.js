// Dashboard functions
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
  renderDashboard();
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
  console.log('renderDashboard called');
  console.log('employees:', employees.length);
  console.log('trainings:', trainings.length);
  
  // Calculate statistics
  const totalEmployees = employees.length;
  const allTrainings = trainings;
  const technicalCount = allTrainings.filter(t => t.type_tb === 'T').length;
  const behavioralCount = allTrainings.filter(t => t.type_tb === 'B').length;

  // Update stat cards
  document.getElementById('totalEmployees').textContent = totalEmployees;
  document.getElementById('totalTrainings').textContent = allTrainings.length;
  document.getElementById('technicalTrainings').textContent = technicalCount;
  document.getElementById('behavioralTrainings').textContent = behavioralCount;

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
