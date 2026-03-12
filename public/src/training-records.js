// Training Records Page JavaScript
// Note: API is defined in app.js

// Global variables
let localTrainings = [];
let currentPage = 1;
let rowsPerPage = 10;
let currentFilter = 'all';
let sortField = 'date_from';
let sortDirection = 'desc';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Training Records page loaded');
  await loadTrainings();
  
  // Setup search listener
  const searchInput = document.getElementById('trainingSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentPage = 1;
      filterTrainings();
    });
  }
  
  // Setup type filter listener
  const typeFilter = document.getElementById('typeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      currentPage = 1;
      filterTrainings();
    });
  }
});

// Load all training records
async function loadTrainings() {
  try {
    console.log('Loading trainings from window.trainings...');
    
    // Use global trainings from app.js if available
    if (window.trainings && window.trainings.length > 0) {
      localTrainings = window.trainings;
      console.log('✅ Using global trainings:', localTrainings.length);
      
      // Debug: Log first record to check full_name
      if (localTrainings.length > 0) {
        console.log('First training record:', localTrainings[0]);
        console.log('Full name value:', localTrainings[0].full_name);
      }
    } else {
      // Fallback: Load from API if global not available
      console.log('Global trainings not available, fetching from API...');
      const apiUrl = (typeof API !== 'undefined' ? API : '') + '/api/trainings';
      console.log('Fetching from:', apiUrl);
      
      const res = await fetch(apiUrl);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      
      console.log('API response type:', typeof json, 'Is array:', Array.isArray(json));
      
      // Handle different response formats
      if (Array.isArray(json)) {
        localTrainings = json;
      } else if (json.success && Array.isArray(json.data)) {
        localTrainings = json.data;
      } else if (json.recordset && Array.isArray(json.recordset)) {
        localTrainings = json.recordset;
      } else {
        console.error('Unexpected API response format:', json);
        localTrainings = [];
      }
      
      console.log('✅ Loaded trainings from API:', localTrainings.length);
      
      // Debug: Log first record
      if (localTrainings.length > 0) {
        console.log('First training record:', localTrainings[0]);
        console.log('Full name value:', localTrainings[0].full_name);
      }
    }
    
    // Update global reference
    window.trainings = localTrainings;
    
    filterTrainings();
    renderTrainings();
  } catch (err) {
    console.error('❌ Error loading trainings:', err);
    localTrainings = [];
    window.trainings = [];
    renderTrainings();
  }
}

// Filter trainings based on search and type
function filterTrainings() {
  const searchTerm = document.getElementById('trainingSearch')?.value.toLowerCase() || '';
  const typeValue = document.getElementById('typeFilter')?.value || 'all';
  
  let filtered = localTrainings.filter(t => {
    // Search filter
    const matchesSearch = !searchTerm || 
      (t.full_name || '').toLowerCase().includes(searchTerm) ||
      (t.course_title || '').toLowerCase().includes(searchTerm) ||
      (t.training_provider || '').toLowerCase().includes(searchTerm) ||
      (t.trainer || '').toLowerCase().includes(searchTerm) ||
      (t.venue || '').toLowerCase().includes(searchTerm);
    
    // Type filter
    let matchesType = true;
    if (typeValue === 'T') matchesType = t.type_tb === 'T';
    else if (typeValue === 'B') matchesType = t.type_tb === 'B';
    
    return matchesSearch && matchesType;
  });
  
  // Sort
  filtered.sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    if (sortField.includes('date')) {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  window.filteredTrainings = filtered;
  renderTrainings();
  updateRecordCount();
}

// Update record count display
function updateRecordCount() {
  const countEl = document.getElementById('recordCount');
  if (countEl) {
    const total = window.filteredTrainings?.length || 0;
    countEl.textContent = `${total} record${total !== 1 ? 's' : ''}`;
  }
}

// Render trainings table
function renderTrainings() {
  const tbody = document.getElementById('trainingTableBody');
  if (!tbody) {
    console.error('trainingTableBody element not found!');
    return;
  }
  
  const data = window.filteredTrainings || localTrainings || [];
  console.log('Rendering trainings:', data.length);
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
          <div style="font-size: 48px; margin-bottom: 10px;">📭</div>
          <p>No training records found</p>
        </td>
      </tr>
    `;
    renderPagination(0);
    return;
  }
  
  const start = (currentPage - 1) * rowsPerPage;
  const pageData = data.slice(start, start + rowsPerPage);
  
  tbody.innerHTML = pageData.map(t => `
    <tr ondblclick="viewTraining(${t.id})" style="cursor:pointer;">
      <td>${t.full_name || 'N/A'}</td>
      <td>${window.UIHelpers ? window.UIHelpers.formatDate(t.date_from) : t.date_from}</td>
      <td>${window.UIHelpers ? window.UIHelpers.formatDate(t.date_to) : t.date_to}</td>
      <td>${t.course_title || 'N/A'}</td>
      <td>${t.venue || 'N/A'}</td>
      <td>${t.trainer || 'N/A'}</td>
      <td style="text-align:center;">${t.type_tb || 'N/A'}</td>
      <td>${t.training_provider || 'N/A'}</td>
      <td style="text-align:center; cursor:pointer;" ${t.eff_form_file ? `ondblclick="openPdfPreview(${t.id})" title="Double-click to preview attachment"` : ''}>
        ${t.eff_form_file
          ? `<span style="display:inline-flex;align-items:center;gap:4px;">
              <a href="${t.eff_form_file}" target="_blank" style="color:var(--red);font-weight:600;text-decoration:none;" title="View attachment">📎 ${t.effectiveness_form || 'N/A'}</a>
              <button onclick="event.preventDefault();event.stopPropagation();removeEffFormFile(${t.id});return false;" style="border:none;background:none;color:#999;cursor:pointer;font-size:14px;padding:0;margin:0;line-height:1;" title="Remove attachment">✕</button>
            </span>`
          : t.effectiveness_form
            ? `<span>${t.effectiveness_form}</span>
               <label style="cursor:pointer;color:var(--red);font-size:11px;" title="Upload attachment">
                 📎<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="display:none;" onchange="uploadEffForm(event,${t.id})">
               </label>`
            : '<span style="color:#999;">N/A</span>'}
      </td>
    </tr>
  `).join('');
  
  renderPagination(data.length);
}

// Render pagination
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  
  let html = '';
  if (currentPage > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})">← Prev</button>`;
  }
  html += `<span>Page ${currentPage} of ${totalPages || 1}</span>`;
  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})">Next →</button>`;
  }
  pagination.innerHTML = html;
}

// Go to page
function goToPage(page) {
  currentPage = page;
  renderTrainings();
}

// Change rows per page
function changeRowsPerPage(value) {
  rowsPerPage = parseInt(value);
  currentPage = 1;
  renderTrainings();
}

// Change filter
function changeFilter(filter) {
  currentFilter = filter;
  currentPage = 1;
  
  // Update tab UI
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });
  
  filterTrainings();
}

// Sort trainings
function sortTrainings(field) {
  // Handle employee name field - API returns 'full_name'
  if (field === 'employee_name') {
    field = 'full_name';
  }
  
  if (sortField === field) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDirection = 'asc';
  }
  filterTrainings();
}

// View training details
async function viewTraining(id) {
  console.log('=== viewTraining called with id:', id);
  
  // If localTrainings is empty, try to load it first
  if (localTrainings.length === 0 && (!window.filteredTrainings || window.filteredTrainings.length === 0)) {
    console.log('⏳ localTrainings is empty, loading from API...');
    await loadTrainings();
  }
  
  // Search in all possible sources
  let t = null;
  
  // Try window.filteredTrainings first (current filtered view)
  if (window.filteredTrainings && window.filteredTrainings.length > 0) {
    t = window.filteredTrainings.find(x => x.id == id);
    if (t) console.log('✅ Found in window.filteredTrainings');
  }
  
  // Try localTrainings
  if (!t && localTrainings.length > 0) {
    t = localTrainings.find(x => x.id == id);
    if (t) console.log('✅ Found in localTrainings');
  }
  
  // Try window.trainings
  if (!t && window.trainings && window.trainings.length > 0) {
    t = window.trainings.find(x => x.id == id);
    if (t) console.log('✅ Found in window.trainings');
  }
  
  if (!t) {
    console.error('❌ Training record not found');
    console.log('Debug info:', {
      id,
      filteredTrainings: window.filteredTrainings ? window.filteredTrainings.length : 0,
      localTrainings: localTrainings.length,
      windowTrainings: window.trainings ? window.trainings.length : 0
    });
    return;
  }
  
  console.log('Training data found:', t);
  
  // Format date helper
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  // Populate modal with training data
  const v_employee_name = document.getElementById('v_employee_name');
  const v_date_from = document.getElementById('v_date_from');
  const v_date_to = document.getElementById('v_date_to');
  const v_duration = document.getElementById('v_duration');
  const v_type_tb = document.getElementById('v_type_tb');
  const v_course_title = document.getElementById('v_course_title');
  const v_training_provider = document.getElementById('v_training_provider');
  const v_venue = document.getElementById('v_venue');
  const v_trainer = document.getElementById('v_trainer');
  const v_effectiveness_form = document.getElementById('v_effectiveness_form');
  
  // Set values with fallback to placeholder
  if (v_employee_name) v_employee_name.textContent = t.full_name || t.employee_name || 'N/A';
  if (v_date_from) v_date_from.textContent = formatDateForDisplay(t.date_from);
  if (v_date_to) v_date_to.textContent = formatDateForDisplay(t.date_to);
  if (v_duration) v_duration.textContent = t.duration || 'N/A';
  if (v_type_tb) v_type_tb.textContent = t.type_tb || 'N/A';
  if (v_course_title) v_course_title.textContent = t.course_title || 'N/A';
  if (v_training_provider) v_training_provider.textContent = t.training_provider || 'N/A';
  if (v_venue) v_venue.textContent = t.venue || 'N/A';
  if (v_trainer) v_trainer.textContent = t.trainer || 'N/A';
  if (v_effectiveness_form) v_effectiveness_form.textContent = t.effectiveness_form || 'N/A';
  
  console.log('✅ Modal fields populated');
  
  // Store the training ID for edit functionality
  window.currentViewingTrainingId = id;
  
  // Show modal
  const modal = document.getElementById('viewTrainModal');
  if (modal) {
    modal.style.display = 'flex';
    console.log('✅ Modal displayed');
  }
}

// Close modal
function closeModal(type) {
  document.getElementById(type + 'Modal').style.display = 'none';
}

// Notification System - Modal Style
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existing = document.getElementById('notification-modal');
  if (existing) existing.remove();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'notification-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  `;
  
  // Create notification card
  const card = document.createElement('div');
  card.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px 40px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    max-width: 500px;
    min-width: 350px;
    text-align: center;
    animation: scaleIn 0.3s ease-out;
  `;
  
  // Set icon and color based on type
  let icon = '⏳';
  let iconColor = '#3b82f6';
  let title = 'Processing...';
  
  if (type === 'success') {
    icon = '✅';
    iconColor = '#10b981';
    title = 'Success!';
  } else if (type === 'error') {
    icon = '❌';
    iconColor = '#ef4444';
    title = 'Error';
  }
  
  card.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 20px;">${icon}</div>
    <h3 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 700; color: ${iconColor};">${title}</h3>
    <p style="margin: 0; font-size: 16px; color: #666; line-height: 1.5;">${message}</p>
    ${type !== 'info' ? `
      <button onclick="document.getElementById('notification-modal').remove()" 
        style="margin-top: 25px; padding: 12px 30px; background: ${iconColor}; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;"
        onmouseover="this.style.opacity='0.9'" 
        onmouseout="this.style.opacity='1'">
        OK
      </button>
    ` : ''}
  `;
  
  overlay.appendChild(card);
  
  // Add animation keyframes if not already added
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.8);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(overlay);
  return overlay;
}

// Upload EFF form attachment with improved UX
async function uploadEffForm(event, trainingId) {
  const file = event.target.files[0];
  if (!file) return;
  
  console.log('📤 Upload started:', { trainingId, fileName: file.name });
  
  // Show loading notification
  const loadingModal = showNotification('⏳ Uploading ' + file.name + '...', 'info');
  
  try {
    // Upload file
    const res = await fetch(`${API}/api/trainings/${trainingId}/upload`, {
      method: 'POST',
      headers: { 'X-Filename': file.name },
      body: file
    });
    
    const data = await res.json();
    console.log('📤 Upload response:', data);
    
    // Remove loading notification
    if (loadingModal) loadingModal.remove();
    
    if (data.success) {
      console.log('✅ Upload successful, refreshing data...');
      
      // Wait a moment for server to process
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch ALL trainings fresh from server
      const freshRes = await fetch(`${API}/api/trainings`);
      const freshJson = await freshRes.json();
      const freshData = freshJson.success ? freshJson.data : (Array.isArray(freshJson) ? freshJson : freshJson.recordset);
      
      console.log('📊 Fresh data received:', freshData.length || 'unknown');
      
      // Update arrays
      localTrainings = freshData;
      window.trainings = freshData;
      
      // Force complete re-render
      currentPage = 1;
      filterTrainings();
      renderTrainings();
      
      console.log('✅ Table refreshed');
      
      // Show success notification with auto-close
      showNotification('✅ File uploaded successfully! ' + file.name + ' has been attached.', 'success');
      
      // Auto-close notification after 3 seconds
      setTimeout(() => {
        const modal = document.getElementById('notification-modal');
        if (modal) modal.remove();
      }, 3000);
    } else {
      showNotification('❌ Upload failed: ' + (data.message || 'Unknown error'), 'error');
    }
  } catch (err) {
    console.error('❌ Upload error:', err);
    if (loadingModal) loadingModal.remove();
    showNotification('❌ Upload error: ' + err.message, 'error');
  }
  
  event.target.value = '';
}

// Remove EFF form attachment with improved UX
async function removeEffFormFile(trainingId) {
  console.log('🗑️ Remove started:', trainingId);
  
  if (!confirm('Remove this attachment?')) {
    console.log('Remove cancelled');
    return;
  }
  
  // Show loading notification
  const loadingModal = showNotification('⏳ Removing attachment...', 'info');
  
  try {
    // Delete file
    const res = await fetch(`${API}/api/trainings/${trainingId}/upload`, { 
      method: 'DELETE' 
    });
    
    const data = await res.json();
    console.log('🗑️ Remove response:', data);
    
    // Remove loading notification
    if (loadingModal) loadingModal.remove();
    
    if (data.success) {
      console.log('✅ Remove successful, refreshing data...');
      
      // Wait a moment for server to process
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch ALL trainings fresh from server
      const freshRes = await fetch(`${API}/api/trainings`);
      const freshJson = await freshRes.json();
      const freshData = freshJson.success ? freshJson.data : (Array.isArray(freshJson) ? freshJson : freshJson.recordset);
      
      console.log('📊 Fresh data received:', freshData.length || 'unknown');
      
      // Update arrays
      localTrainings = freshData;
      window.trainings = freshData;
      
      // Force complete re-render
      currentPage = 1;
      filterTrainings();
      renderTrainings();
      
      console.log('✅ Table refreshed');
      
      // Show success notification
      showNotification('✅ Attachment removed successfully!', 'success');
      
      // Auto-close notification after 3 seconds
      setTimeout(() => {
        const modal = document.getElementById('notification-modal');
        if (modal) modal.remove();
      }, 3000);
    } else {
      showNotification('❌ Remove failed: ' + (data.message || 'Unknown error'), 'error');
    }
  } catch (err) {
    console.error('❌ Remove error:', err);
    if (loadingModal) loadingModal.remove();
    showNotification('❌ Remove error: ' + err.message, 'error');
  }
}

// PDF Preview functions
function openPdfPreview(trainingId) {
  const t = localTrainings.find(x => x.id === trainingId);
  if (!t || !t.eff_form_file) {
    showNotification('No attachment available for this record.', 'error');
    return;
  }
  
  const iframe = document.getElementById('pdfIframe');
  const pdfPreviewModal = document.getElementById('pdfPreviewModal');
  const downloadLink = document.getElementById('pdfDownloadLink');
  
  // Set iframe source and download link
  iframe.src = t.eff_form_file;
  downloadLink.href = t.eff_form_file;
  
  pdfPreviewModal.style.display = 'flex';
}

function closePdfPreview() {
  document.getElementById('pdfPreviewModal').style.display = 'none';
  document.getElementById('pdfIframe').src = '';
}

// Convert view modal to edit modal
function convertViewToEdit() {
  const trainingId = window.currentViewingTrainingId;
  if (!trainingId) {
    console.error('No training ID to edit');
    return;
  }
  
  // Close view modal
  closeModal('viewTrain');
  
  // Open edit modal with the training data
  openEditTraining(trainingId);
}

// Open edit training modal
async function openEditTraining(trainingId) {
  console.log('=== openEditTraining called with id:', trainingId);
  
  // If localTrainings is empty, try to load it first
  if (localTrainings.length === 0 && (!window.filteredTrainings || window.filteredTrainings.length === 0)) {
    console.log('⏳ localTrainings is empty, loading from API...');
    await loadTrainings();
  }
  
  // If employees not loaded, load them
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
  
  // Search in all possible sources
  let t = null;
  
  // Try window.filteredTrainings first (current filtered view)
  if (window.filteredTrainings && window.filteredTrainings.length > 0) {
    t = window.filteredTrainings.find(x => x.id == trainingId);
    if (t) console.log('✅ Found in window.filteredTrainings');
  }
  
  // Try localTrainings
  if (!t && localTrainings.length > 0) {
    t = localTrainings.find(x => x.id == trainingId);
    if (t) console.log('✅ Found in localTrainings');
  }
  
  // Try window.trainings
  if (!t && window.trainings && window.trainings.length > 0) {
    t = window.trainings.find(x => x.id == trainingId);
    if (t) console.log('✅ Found in window.trainings');
  }
  
  if (!t) {
    console.error('❌ Training record not found:', trainingId);
    return;
  }
  
  console.log('Training data found:', t);
  
  // Populate employee dropdown first
  const t_employee_id = document.getElementById('t_employee_id');
  if (t_employee_id) {
    // Clear existing options except the first one
    t_employee_id.innerHTML = '<option value="">Select Employee</option>';
    
    // Add all employees to dropdown
    const employees = window.employees || [];
    console.log('Available employees:', employees.length);
    
    if (employees.length > 0) {
      employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.full_name || emp.employee_name;
        t_employee_id.appendChild(option);
      });
      console.log('✅ Employee dropdown populated with', employees.length, 'employees');
    } else {
      console.warn('⚠️ No employees available to populate dropdown');
    }
    
    // Set the current employee
    t_employee_id.value = t.employee_id || '';
    console.log('✅ Employee dropdown set to:', t.employee_id);
  }
  
  // Populate other form fields
  const t_date_from = document.getElementById('t_date_from');
  const t_date_to = document.getElementById('t_date_to');
  const t_duration = document.getElementById('t_duration');
  const t_type_tb = document.getElementById('t_type_tb');
  const t_course_title = document.getElementById('t_course_title');
  const t_training_provider = document.getElementById('t_training_provider');
  const t_venue = document.getElementById('t_venue');
  const t_trainer = document.getElementById('t_trainer');
  const t_effectiveness_form = document.getElementById('t_effectiveness_form');
  
  // Set values
  if (t_date_from) {
    t_date_from.value = t.date_from ? t.date_from.split('T')[0] : '';
    console.log('✅ Set date_from:', t_date_from.value);
  }
  if (t_date_to) {
    t_date_to.value = t.date_to ? t.date_to.split('T')[0] : '';
    console.log('✅ Set date_to:', t_date_to.value);
  }
  if (t_duration) {
    t_duration.value = t.duration || '';
    console.log('✅ Set duration:', t_duration.value);
  }
  if (t_type_tb) {
    t_type_tb.value = t.type_tb || 'T';
    console.log('✅ Set type_tb:', t_type_tb.value);
  }
  if (t_course_title) {
    t_course_title.value = t.course_title || '';
    console.log('✅ Set course_title:', t_course_title.value);
  }
  if (t_training_provider) {
    t_training_provider.value = t.training_provider || '';
    console.log('✅ Set training_provider:', t_training_provider.value);
  }
  if (t_venue) {
    t_venue.value = t.venue || '';
    console.log('✅ Set venue:', t_venue.value);
  }
  if (t_trainer) {
    t_trainer.value = t.trainer || '';
    console.log('✅ Set trainer:', t_trainer.value);
  }
  if (t_effectiveness_form) {
    t_effectiveness_form.value = t.effectiveness_form || 'N/A';
    console.log('✅ Set effectiveness_form:', t_effectiveness_form.value);
  }
  
  console.log('✅ Edit form fully populated');
  
  // Set modal title
  const trainingModalTitle = document.getElementById('trainingModalTitle');
  if (trainingModalTitle) {
    trainingModalTitle.textContent = 'Edit Training Record';
  }
  
  // Store the training ID for save functionality
  window.currentEditingTrainingId = trainingId;
  
  // Show modal
  const trainModal = document.getElementById('trainModal');
  if (trainModal) {
    trainModal.style.display = 'flex';
    console.log('✅ Edit modal displayed');
  }
}

// Close notification modal
function closeNotification() {
  const modal = document.getElementById('notificationModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

