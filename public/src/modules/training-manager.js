/**
 * Training Manager Module
 * Handles training CRUD operations and rendering
 */

let editTrainId = null;
let currentOverviewEmpId = null;
let currentOverviewSelectedTrainId = null;

// Open add training modal
function openAddTraining() {
  editTrainId = null;
  document.getElementById('trainModalTitle').textContent = 'Add Training Record';
  ['date_from','date_to','duration','course_title','training_provider','venue','trainer']
    .forEach(k => document.getElementById(`t_${k}`).value = '');
  document.getElementById('t_type_tb').value = 'T';
  window.UIHelpers.openModal('train');
}

// Print employee training
function printEmployeeTraining() {
  if (!currentOverviewEmpId) {
    window.UIHelpers.showNotification('Error', 'No employee selected.', false);
    return;
  }
  
  const emp = (window.employees || []).find(e => e.id == currentOverviewEmpId);
  if (!emp) {
    window.UIHelpers.showNotification('Error', 'Employee not found.', false);
    return;
  }
  
  console.log('🖨️ Print - Employee object:', emp);
  console.log('🖨️ Print - Employee object keys:', Object.keys(emp));
  console.log('🖨️ Print - date_hired value:', emp.date_hired);
  console.log('🖨️ Print - Full employee data:', JSON.stringify(emp, null, 2));
  
  const empTrainings = (window.trainings || []).filter(t => t.employee_id == currentOverviewEmpId);
  
  // Custom date formatter for print (MMM DD, YYYY)
  const formatPrintDate = (dateStr) => {
    if (!dateStr) {
      console.warn('⚠️ formatPrintDate: dateStr is empty or null');
      return '';
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ formatPrintDate: Invalid date:', dateStr);
        return dateStr;
      }
      const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
      console.log('✅ formatPrintDate:', dateStr, '->', formatted);
      return formatted;
    } catch (e) {
      console.error('❌ formatPrintDate error:', e);
      return dateStr;
    }
  };
  
  const fmt = formatPrintDate;
  
  let tableRows = '';
  if (empTrainings.length === 0) {
    tableRows = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No training records found</td></tr>';
  } else {
    tableRows = empTrainings.map(t => `
      <tr>
        <td>${fmt(t.date_from)}</td>
        <td>${fmt(t.date_to)}</td>
        <td>${t.duration}</td>
        <td>${t.course_title}</td>
        <td>${t.training_provider}</td>
        <td>${t.venue}</td>
        <td>${t.trainer}</td>
        <td>${t.type_tb}</td>
        <td>${t.effectiveness_form || 'N/A'}</td>
      </tr>
    `).join('');
  }
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Employee Training Record - ${emp.full_name}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 0.4in 0.3in;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
          width: 100%; 
          font-family: Arial, sans-serif; 
          background: white; 
          color: #000;
        }
        body { 
          padding: 0.4in 0.3in;
          font-size: 10px;
        }
        .container { width: 100%; }
        
        /* Header with logo only */
        .header { 
          text-align: center; 
          margin-bottom: 8px; 
          padding-bottom: 6px;
          border-bottom: 2px solid #000;
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-section img {
          height: 35px;
          width: auto;
        }
        .company-info {
          display: none;
        }
        
        /* Title box */
        .title { 
          text-align: center; 
          font-size: 11px; 
          font-weight: 700; 
          margin: 0 0 6px 0; 
          border: 2px solid #000; 
          padding: 4px; 
          letter-spacing: 1px;
        }
        
        /* Employee info section - 2 rows */
        .emp-info { 
          display: grid; 
          grid-template-columns: 1fr 1fr 1fr; 
          gap: 20px;
          margin-bottom: 0; 
          padding: 4px 6px; 
          border: 1px solid #000;
          border-top: none;
          font-size: 8px;
        }
        .info-field { 
          display: block;
          line-height: 1.3;
        }
        .info-field label { 
          font-size: 7px; 
          font-weight: 700; 
          color: #000;
          display: block;
          margin-bottom: 1px;
        }
        .info-field span { 
          font-size: 7px; 
          font-weight: 600; 
          color: #000;
          display: block;
        }
        
        /* Table */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 8px; 
          margin-top: 0;
          border: 1px solid #000;
          border-top: none;
        }
        thead { 
          background: #000; 
          color: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        th { 
          padding: 3px 2px; 
          text-align: center; 
          font-weight: 700; 
          border: 1px solid #000;
          font-size: 7px;
          text-transform: uppercase;
          line-height: 1.2;
        }
        td { 
          padding: 2px 2px; 
          border: 1px solid #000; 
          text-align: center;
          font-size: 7px;
          line-height: 1.2;
        }
        td:nth-child(4) {
          text-align: left;
        }
        td:nth-child(8) {
          text-align: center;
          color: #000;
          background: #fff;
        }
        
        /* Footer */
        .footer { 
          font-size: 7px; 
          text-align: left; 
          margin-top: 4px; 
          color: #000;
        }
        
        @media print {
          body { padding: 0.4in 0.3in; }
          .container { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <img src="NSB-LOGO.png" alt="NSB Logo" />
            <div class="company-info">
              <p class="company-name">NSB ENGINEERING</p>
              <p class="company-sub">DESIGN AND FABRICATION</p>
            </div>
          </div>
        </div>
        
        <!-- Title -->
        <div class="title">EMPLOYEE TRAINING RECORD</div>
        
        <!-- Employee Info -->
        <div class="emp-info">
          <div class="info-field">
            <label>Employee Name:</label> <span>${emp.full_name || emp.employee_name}</span>
          </div>
          <div class="info-field">
            <label>Department:</label> <span>${emp.department}</span>
          </div>
          <div class="info-field">
            <label>Date Hired:</label> <span>${emp.date_hired ? fmt(emp.date_hired) : 'N/A'}</span>
          </div>
          <div class="info-field">
            <label>Employee No.:</label> <span>${emp.employee_no}</span>
          </div>
          <div class="info-field">
            <label>Position:</label> <span>${emp.position}</span>
          </div>
        </div>
        
        <!-- Training Table -->
        <table>
          <thead>
            <tr>
              <th>Date From</th>
              <th>Date To</th>
              <th>Duration</th>
              <th>Course Title</th>
              <th>Provider</th>
              <th>Venue</th>
              <th>Trainer</th>
              <th>Type</th>
              <th>Eff. Form</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <!-- Footer -->
        <div class="footer">F-HRD03-4/EFF:12-20-2023</div>
      </div>
      
      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
          }, 300);
        });
      </script>
    </body>
    </html>
  `;
  
  // Create print window with specific features
  const printWindow = window.open('', 'PrintWindow', 'width=1200,height=800');
  if (!printWindow) {
    window.UIHelpers.showNotification('Error', 'Could not open print window. Please check your popup blocker.', false);
    return;
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

// Open add training for employee
function openAddTrainingForEmployee() {
  if (!currentOverviewEmpId) {
    window.UIHelpers.showNotification('Error', 'No employee selected.', false);
    return;
  }
  
  window.UIHelpers.closeModal('empTrainingOverview');
  
  setTimeout(() => {
    editTrainId = null;
    document.getElementById('trainingModalTitle').textContent = 'Add Training Record';
    
    window.DropdownManager.populateEmployeeDropdown();
    
    ['date_from', 'date_to', 'duration', 'course_title', 'training_provider', 'venue', 'trainer', 'type_tb', 'effectiveness_form'].forEach(k => {
      const field = document.getElementById(`t_${k}`);
      if (field) field.value = '';
    });
    
    const empSelect = document.getElementById('t_employee_id');
    if (empSelect) {
      empSelect.value = currentOverviewEmpId;
    }
    
    window.UIHelpers.openModal('train');
  }, 150);
}

// Open edit training modal
async function openEditTraining(trainingId) {
  const training = (window.trainings || []).find(t => t.id === trainingId);
  if (!training) {
    window.UIHelpers.showNotification('Error', 'Training record not found.', false);
    return;
  }
  
  window.UIHelpers.closeModal('empTrainingOverview');
  
  setTimeout(() => {
    editTrainId = trainingId;
    document.getElementById('trainingModalTitle').textContent = 'Edit Training Record';
    
    window.DropdownManager.populateEmployeeDropdown();
    
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
    
    window.UIHelpers.openModal('train');
  }, 150);
}

// Open view training modal
function openViewTraining(trainingId) {
  const t = (window.trainings || []).find(x => x.id == trainingId);
  if (!t) {
    console.error('Training record not found:', trainingId);
    window.UIHelpers.showNotification('Error', 'Training record not found.', false);
    return;
  }
  
  window.currentViewTrainId = trainingId;
  
  const fmt = window.UIHelpers.formatDate;
  
  const v_date_from = document.getElementById('v_date_from');
  const v_date_to = document.getElementById('v_date_to');
  const v_duration = document.getElementById('v_duration');
  const v_type_tb = document.getElementById('v_type_tb');
  const v_course_title = document.getElementById('v_course_title');
  const v_training_provider = document.getElementById('v_training_provider');
  const v_venue = document.getElementById('v_venue');
  const v_trainer = document.getElementById('v_trainer');
  const v_effectiveness_form = document.getElementById('v_effectiveness_form');
  
  if (v_date_from) v_date_from.textContent = fmt(t.date_from);
  if (v_date_to) v_date_to.textContent = fmt(t.date_to);
  if (v_duration) v_duration.textContent = t.duration || 'N/A';
  if (v_type_tb) v_type_tb.textContent = t.type_tb === 'T' ? 'Technical (T)' : 'Behavioral (B)';
  if (v_course_title) v_course_title.textContent = t.course_title || 'N/A';
  if (v_training_provider) v_training_provider.textContent = t.training_provider || 'N/A';
  if (v_venue) v_venue.textContent = t.venue || 'N/A';
  if (v_trainer) v_trainer.textContent = t.trainer || 'N/A';
  if (v_effectiveness_form) v_effectiveness_form.textContent = t.effectiveness_form || 'N/A';
  
  const modal = document.getElementById('viewTrainModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Convert view to edit
function convertViewToEdit() {
  const trainId = window.currentViewTrainId;
  window.UIHelpers.closeModal('viewTrain');
  if (trainId) {
    openEditTraining(trainId);
  }
}

// Save training
async function saveTraining() {
  let employeeId = document.getElementById('t_employee_id')?.value;
  
  if (!employeeId && window.EmployeeManager.currentEmp) {
    employeeId = window.EmployeeManager.currentEmp.id;
  }
  
  if (!employeeId && currentOverviewEmpId) {
    employeeId = currentOverviewEmpId;
  }
  
  if (!employeeId) {
    window.UIHelpers.showNotification('Error', 'Please select an employee.', false);
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
    window.UIHelpers.showNotification('Validation Error', 'Please fill in all required fields.', false);
    return;
  }

  const trainingId = editTrainId || window.currentEditingTrainingId;
  const url = trainingId ? `${window.API || ''}/api/trainings/${trainingId}` : `${window.API || ''}/api/trainings`;
  const method = trainingId ? 'PUT' : 'POST';
  const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  
  if (!data.success) {
    window.UIHelpers.showNotification('Error', data.message || 'Error saving training.', false);
    return;
  }

  window.UIHelpers.closeModal('train');
  const isEdit = trainingId ? true : false;
  
  editTrainId = null;
  window.currentEditingTrainingId = null;
  
  window.UIHelpers.showNotification(
    isEdit ? 'Training Updated' : 'Training Added',
    isEdit ? 'Training record has been updated successfully!' : 'Training record has been added successfully!',
    true
  );
  
  await window.DataLoader.loadEmployees();
  
  if (currentOverviewEmpId) {
    openEmployeeTrainingOverview(currentOverviewEmpId);
  }
  
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
  
  if (typeof loadDataForTrainingPage === 'function') {
    await loadDataForTrainingPage();
  } else if (window.EmployeeManager.currentEmp) {
    window.EmployeeManager.selectEmployee(window.EmployeeManager.currentEmp.id);
  } else if (typeof showAllTrainingRecords === 'function') {
    showAllTrainingRecords();
  }
}

// Delete training
async function deleteTraining(id) {
  if (!confirm('Delete this training record?')) return;
  
  const res = await fetch(`${window.API || ''}/api/trainings/${id}`, { method: 'DELETE' });
  const data = await res.json();
  
  if (!data.success) {
    window.UIHelpers.showNotification('Error', 'Error deleting training record.', false);
    return;
  }
  
  window.UIHelpers.showNotification('Training Deleted', 'Training record has been deleted successfully.', true);
  
  await window.DataLoader.loadEmployees();
  
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
  
  if (window.EmployeeManager.currentEmp) {
    window.EmployeeManager.selectEmployee(window.EmployeeManager.currentEmp.id);
  } else {
    if (typeof showAllTrainingRecords === 'function') showAllTrainingRecords();
  }
}

// Open employee training overview modal
function openEmployeeTrainingOverview(empId) {
  const emp = (window.employees || []).find(e => e.id == empId);
  if (!emp) {
    window.UIHelpers.showNotification('Error', 'Employee not found.', false);
    return;
  }
  
  currentOverviewEmpId = empId;
  currentOverviewSelectedTrainId = null;
  const empTrainings = (window.trainings || []).filter(t => t.employee_id == empId);
  
  const fmt = window.UIHelpers.formatDate;
  
  document.getElementById('overviewModalTitle').textContent = `Training Overview - ${emp.full_name}`;
  
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
  
  const printFooter = document.querySelector('#empTrainingOverviewModal .print-modal-footer');
  if (printFooter) {
    printFooter.textContent = `F-HRD03-4/EFF:12-20-2023`;
  }
  
  window.UIHelpers.openModal('empTrainingOverview');
}

// Select overview training row
function selectOverviewTrainingRow(id) {
  document.querySelectorAll('[id^="overview-row-"]').forEach(row => {
    row.style.background = 'white';
    row.style.fontWeight = 'normal';
  });
  currentOverviewSelectedTrainId = id;
  const row = document.getElementById(`overview-row-${id}`);
  if (row) {
    row.style.background = '#e8f0fe';
    row.style.fontWeight = '600';
  }
}

// Edit selected overview training
function editSelectedOverviewTraining() {
  if (!currentOverviewSelectedTrainId) {
    window.UIHelpers.showNotification('No Record Selected', 'Please click a training record row to select it, then click Edit.', false);
    return;
  }
  openEditTraining(currentOverviewSelectedTrainId);
}

// Delete selected overview training
async function deleteSelectedOverviewTraining() {
  if (!currentOverviewSelectedTrainId) {
    window.UIHelpers.showNotification('No Record Selected', 'Please click a training record row to select it, then click Delete.', false);
    return;
  }
  
  if (!confirm('Delete this training record?')) return;
  
  const res = await fetch(`${window.API || ''}/api/trainings/${currentOverviewSelectedTrainId}`, { method: 'DELETE' });
  const data = await res.json();
  
  if (!data.success) {
    window.UIHelpers.showNotification('Error', 'Error deleting training record.', false);
    return;
  }
  
  window.UIHelpers.showNotification('Training Deleted', 'Training record has been deleted successfully.', true);
  
  await window.DataLoader.loadEmployees();
  
  if (currentOverviewEmpId) {
    openEmployeeTrainingOverview(currentOverviewEmpId);
  }
  
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

// Delete training from overview
async function deleteTrainingFromOverview(id) {
  if (!confirm('Delete this training record?')) return;
  
  const res = await fetch(`${window.API || ''}/api/trainings/${id}`, { method: 'DELETE' });
  const data = await res.json();
  
  if (!data.success) {
    window.UIHelpers.showNotification('Error', 'Error deleting training record.', false);
    return;
  }
  
  window.UIHelpers.showNotification('Training Deleted', 'Training record has been deleted successfully.', true);
  
  await window.DataLoader.loadEmployees();
  
  if (currentOverviewEmpId) {
    openEmployeeTrainingOverview(currentOverviewEmpId);
  }
  
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection && dashboardSection.style.display !== 'none') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

// Export for use in other modules
window.TrainingManager = {
  openAddTraining,
  openAddTrainingForEmployee,
  openEditTraining,
  openViewTraining,
  convertViewToEdit,
  saveTraining,
  deleteTraining,
  openEmployeeTrainingOverview,
  selectOverviewTrainingRow,
  editSelectedOverviewTraining,
  deleteSelectedOverviewTraining,
  deleteTrainingFromOverview,
  printEmployeeTraining,
  get currentOverviewEmpId() { return currentOverviewEmpId; },
  set currentOverviewEmpId(val) { currentOverviewEmpId = val; }
};
