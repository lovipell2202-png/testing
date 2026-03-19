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
  ['date_from','date_to','duration','course_title']
    .forEach(k => document.getElementById(`t_${k}`).value = '');
  document.getElementById('t_type_tb').value = 'T';
  // Reset provider/venue/trainer selects and hide "other" inputs
  ['training_provider','venue','trainer'].forEach(k => {
    const sel = document.getElementById(`t_${k}`);
    if (sel) sel.value = '';
    const other = document.getElementById(`t_${k}_other`);
    if (other) { other.style.display = 'none'; other.value = ''; }
  });
  
  // Reset effectiveness_form and add change listener for attachment check
  const effectivenessForm = document.getElementById('t_effectiveness_form');
  if (effectivenessForm) {
    effectivenessForm.value = 'N/A';
    
    // Remove existing listener if any to avoid duplicates
    effectivenessForm.onchange = null;
    
    // Add listener for attachment validation
    effectivenessForm.onchange = async function() {
      console.log('📝 Effectiveness form changed to:', this.value);
      
      if (this.value === 'W/EXAM_TEEF') {
        // Show warning for W/EXAM_TEEF
        console.log('⚠️ W/EXAM_TEEF selected - contains both EXAM and TEEF');
        showEffectivenessFormWarning('⚠️ Warning: This training contains BOTH TEEF Form AND EXAM - Please ensure both attachments are uploaded');
      } else if (this.value === 'W/TEEF') {
        // Check for TEEF attachment - just show info message
        console.log('🔎 W/TEEF selected - please upload TEEF attachment');
        showEffectivenessFormWarning('ℹ️ Please upload the Training Effectiveness Evaluation Form (TEEF) for this training.');
      } else if (this.value === 'W/EXAM') {
        // Check for EXAM attachment - just show info message  
        console.log('🔎 W/EXAM selected - please upload EXAM attachment');
        showEffectivenessFormWarning('ℹ️ Please upload the EXAM attachment for this training.');
      }
    };
  }
  
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
  
  // Extract last name for PDF filename
  let empLastName = 'Employee';
  if (emp.last_name) {
    empLastName = emp.last_name;
  } else if (emp.full_name) {
    const nameParts = emp.full_name.split(' ');
    empLastName = nameParts[nameParts.length - 1];
  }
  const sanitizedLastName = empLastName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${sanitizedLastName}_TrainingRecord.pdf`;
  
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
          border-bottom: none;
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
          border: none;
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
            <img src="/images/NSB-LOGO.png" alt="NSB Logo" />
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
        <!-- Sort Controls -->
        <div class="sort-controls" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <button onclick="doPrint()" style="padding: 5px 15px; background: #000; color: #fff; border: none; cursor: pointer; font-size: 11px;">🖨️ Print</button>
          <div>
            <label style="font-size: 9px; margin-right: 5px;">Sort by:</label>
            <select id="printSort" onchange="sortTable()" style="font-size: 9px; padding: 2px 5px;">
              <option value="date_from">Date From (Oldest)</option>
              <option value="date_from_desc">Date From (Newest)</option>
              <option value="date_to">Date To (Oldest)</option>
              <option value="date_to_desc">Date To (Newest)</option>
              <option value="course_title">Course Title (A-Z)</option>
              <option value="course_title_desc">Course Title (Z-A)</option>
              <option value="provider">Provider (A-Z)</option>
              <option value="type">Type (T/B)</option>
            </select>
          </div>
        </div>
        <table id="printTable">
          <thead>
            <tr>
              <th onclick="sortBy('date_from')" style="cursor:pointer;">Date From ⬍</th>
              <th onclick="sortBy('date_to')" style="cursor:pointer;">Date To ⬍</th>
              <th>Duration</th>
              <th onclick="sortBy('course_title')" style="cursor:pointer;">Course Title ⬍</th>
              <th>Provider</th>
              <th>Venue</th>
              <th>Trainer</th>
              <th>Type</th>
              <th>Eff. Form</th>
            </tr>
          </thead>
          <tbody id="printTableBody">
            ${tableRows}
          </tbody>
        </table>
        
        <!-- Footer -->
        <div class="footer">F-HRD03-4/EFF:12-20-2023</div>
      </div>
      
      <script>
        // Get training data from table rows for sorting
        function getTableData() {
          const rows = document.querySelectorAll('#printTableBody tr');
          return Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td');
            return {
              date_from: cells[0].textContent,
              date_to: cells[1].textContent,
              duration: cells[2].textContent,
              course_title: cells[3].textContent,
              training_provider: cells[4].textContent,
              venue: cells[5].textContent,
              trainer: cells[6].textContent,
              type_tb: cells[7].textContent,
              effectiveness_form: cells[8].textContent
            };
          });
        }
        
        function sortTable() {
          const sortBy = document.getElementById('printSort').value;
          const data = getTableData();
          const sorted = data.sort((a, b) => {
            switch(sortBy) {
              case 'date_from': return a.date_from.localeCompare(b.date_from);
              case 'date_from_desc': return b.date_from.localeCompare(a.date_from);
              case 'date_to': return a.date_to.localeCompare(b.date_to);
              case 'date_to_desc': return b.date_to.localeCompare(a.date_to);
              case 'course_title': return a.course_title.localeCompare(b.course_title);
              case 'course_title_desc': return b.course_title.localeCompare(a.course_title);
              case 'provider': return a.training_provider.localeCompare(b.training_provider);
              case 'type': return a.type_tb.localeCompare(b.type_tb);
              default: return 0;
            }
          });
          renderSorted(sorted);
        }
        
        function renderSorted(sorted) {
          const tbody = document.getElementById('printTableBody');
          let html = '';
          sorted.forEach(t => {
            html += '<tr>' +
              '<td>' + t.date_from + '</td>' +
              '<td>' + t.date_to + '</td>' +
              '<td>' + t.duration + '</td>' +
              '<td>' + t.course_title + '</td>' +
              '<td>' + t.training_provider + '</td>' +
              '<td>' + t.venue + '</td>' +
              '<td>' + t.trainer + '</td>' +
              '<td>' + t.type_tb + '</td>' +
              '<td>' + t.effectiveness_form + '</td>' +
            '</tr>';
          });
          tbody.innerHTML = html;
        }
        
        function sortBy(column) {
          const select = document.getElementById('printSort');
          if (column === 'date_from') {
            select.value = select.value === 'date_from' ? 'date_from_desc' : 'date_from';
          } else if (column === 'date_to') {
            select.value = select.value === 'date_to' ? 'date_to_desc' : 'date_to';
          } else if (column === 'course_title') {
            select.value = select.value === 'course_title' ? 'course_title_desc' : 'course_title';
          }
          sortTable();
        }
        
        // Add print button
        function doPrint() {
          window.print();
        }
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
  
  // Set up print with custom filename after window loads
  printWindow.onload = function() {
    // Trigger print - the filename will be set in the print dialog
    printWindow.focus();
    printWindow.print();
  };
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
    
    ['date_from', 'date_to', 'duration', 'course_title', 'type_tb', 'effectiveness_form'].forEach(k => {
      const field = document.getElementById(`t_${k}`);
      if (field) field.value = '';
    });
    // Reset provider/venue/trainer selects and hide "other" inputs
    ['training_provider','venue','trainer'].forEach(k => {
      const sel = document.getElementById(`t_${k}`);
      if (sel) sel.value = '';
      const other = document.getElementById(`t_${k}_other`);
      if (other) { other.style.display = 'none'; other.value = ''; }
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
  console.log('=== openEditTraining called with id:', trainingId);
  
  // Load employees first if not available
  if (!window.employees || window.employees.length === 0) {
    console.log('⏳ Employees not loaded, loading from API...');
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        window.employees = data.data;
        console.log('✅ Loaded employees:', window.employees.length);
      }
    } catch (err) {
      console.error('❌ Error loading employees:', err);
    }
  }
  
  // Use loose equality (==) to match both string and number IDs
  let training = (window.trainings || []).find(t => t.id == trainingId);
  
  // If not found in memory, try to fetch from API
  if (!training) {
    console.log('Training not found in memory, fetching from API...');
    try {
      const res = await fetch(`/api/trainings/${trainingId}`);
      const data = await res.json();
      if (data.success && data.data) {
        training = data.data;
        console.log('✅ Loaded training from API:', training);
      } else {
        console.error('Failed to load training from API:', data);
        window.UIHelpers.showNotification('Error', 'Training record not found.', false);
        return;
      }
    } catch (err) {
      console.error('Error fetching training:', err);
      window.UIHelpers.showNotification('Error', 'Training record not found.', false);
      return;
    }
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
    
    // Helper: set select value, falling back to "Other" if value not in list
    function setSelectOrOther(selId, otherId, val) {
      const sel = document.getElementById(selId);
      const otherInput = document.getElementById(otherId);
      if (!sel || !val) return;
      const exists = Array.from(sel.options).some(o => o.value === val);
      if (exists) {
        sel.value = val;
        if (otherInput) { otherInput.style.display = 'none'; otherInput.value = ''; }
      } else {
        sel.value = '__other__';
        if (otherInput) { otherInput.style.display = 'block'; otherInput.value = val; }
      }
    }
    
    setSelectOrOther('t_training_provider', 't_training_provider_other', training.training_provider || '');
    setSelectOrOther('t_venue', 't_venue_other', training.venue || '');
    setSelectOrOther('t_trainer', 't_trainer_other', training.trainer || '');
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
    training_provider: (() => {
      const sel = document.getElementById('t_training_provider');
      return sel?.value === '__other__'
        ? (document.getElementById('t_training_provider_other')?.value.trim() || '')
        : (sel?.value.trim() || '');
    })(),
    venue: (() => {
      const sel = document.getElementById('t_venue');
      return sel?.value === '__other__'
        ? (document.getElementById('t_venue_other')?.value.trim() || '')
        : (sel?.value.trim() || '');
    })(),
    trainer: (() => {
      const sel = document.getElementById('t_trainer');
      return sel?.value === '__other__'
        ? (document.getElementById('t_trainer_other')?.value.trim() || '')
        : (sel?.value.trim() || '');
    })(),
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
  const fmtLong = window.UIHelpers.formatDateLong;
  
  document.getElementById('overviewModalTitle').textContent = `Training Overview - ${emp.full_name}`;
  
  document.getElementById('overviewEmpInfo').innerHTML = `
    <div>
      <div>
        <label>Employee Name:</label>
        <span>${emp.full_name || emp.employee_name}</span>
      </div>
      <div>
        <label>Department:</label>
        <span>${emp.department}</span>
      </div>
      <div>
        <label>Date Hired:</label>
        <span>${fmtLong(emp.date_hired)}</span>
      </div>
      <div style="flex-basis: 100%; margin-top: 4px;">
        <label>Employee No.:</label>
        <span style="font-size: 11px; font-weight: 600; color: #000;">${emp.employee_no}</span>
      </div>
      <div style="grid-column: span 2;">
        <label style="font-size: 9px; font-weight: 700; color: #666; display: inline; margin-right: 3px;">Position:</label>
        <span style="font-size: 11px; font-weight: 600; color: #000;">${emp.position}</span>
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
