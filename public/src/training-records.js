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
  
  tbody.innerHTML = pageData.map(t => {
    // Check what attachments actually exist
    // exam_form_url: must be a real path starting with /
    // eff_form_file: either a real path (starts with /) OR the flag 'W/TEEF' meaning a TEEF form was saved in DB
    const hasExamAttachment = !!(t.exam_form_url && t.exam_form_url.startsWith('/'));
    const hasTeefAttachment = !!(t.eff_form_file && (t.eff_form_file.startsWith('/') || t.eff_form_file === 'W/TEEF'));

    // Helper: render a label span — green+clickable if has file, red if not
    const examSpan = (id) => hasExamAttachment
      ? `<span style="color:#4caf50;font-weight:600;cursor:pointer;text-decoration:underline;" onclick="openPdfPreview(${id})" title="View EXAM attachment">W/EXAM</span>`
      : `<span style="color:#f44336;font-weight:600;" title="No EXAM attachment yet">W/EXAM</span>`;

    // For TEEF: if eff_form_file is the flag 'W/TEEF', open the evaluation form viewer; if it's a real path, open PDF preview
    const teefClickAction = (t.eff_form_file && t.eff_form_file.startsWith('/'))
      ? `openPdfPreview(${t.id}, 'teef')`
      : `openTeefForm(${t.id})`;
    const teefSpan = (id) => hasTeefAttachment
      ? `<span style="color:#4caf50;font-weight:600;cursor:pointer;text-decoration:underline;" onclick="${teefClickAction}" title="View TEEF form">W/TEEF</span>`
      : `<span style="color:#f44336;font-weight:600;" title="No TEEF attachment yet">W/TEEF</span>`;

    let effFormDisplay = '';
    const ef = t.effectiveness_form;

    if (!ef || ef === 'N/A') {
      effFormDisplay = '<span style="color:#999;">N/A</span>';
    } else if (ef === 'W/EXAM') {
      effFormDisplay = examSpan(t.id);
    } else if (ef === 'W/TEEF') {
      effFormDisplay = teefSpan(t.id);
    } else if (ef === 'W/EXAM_TEEF' || (ef.includes('W/EXAM') && ef.includes('W/TEEF'))) {
      effFormDisplay = `<span style="font-weight:600;">${examSpan(t.id)} &amp; ${teefSpan(t.id)}</span>`;
    } else {
      effFormDisplay = `<span style="color:#999;">${ef}</span>`;
    }
    
    return `
    <tr ondblclick="viewTraining(${t.id})" style="cursor:pointer;">
      <td>${t.full_name || 'N/A'}</td>
      <td>${window.UIHelpers ? window.UIHelpers.formatDate(t.date_from) : t.date_from}</td>
      <td>${window.UIHelpers ? window.UIHelpers.formatDate(t.date_to) : t.date_to}</td>
      <td>${t.course_title || 'N/A'}</td>
      <td>${t.venue || 'N/A'}</td>
      <td>${t.trainer || 'N/A'}</td>
      <td style="text-align:center;">${t.type_tb || 'N/A'}</td>
      <td>${t.training_provider || 'N/A'}</td>
      <td style="text-align:center;">
        ${effFormDisplay}
      </td>
    </tr>
  `;
  }).join('');
  
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
  
  // Apply color coding to effectiveness form based on completed assessment
  const completedAssessmentType = sessionStorage.getItem('completedAssessmentType');
  const completedTrainingId = sessionStorage.getItem('completedTrainingId');
  
  if (v_effectiveness_form) {
    const effectivenessText = t.effectiveness_form || 'N/A';
    
    // Apply color coding if this training just had an assessment completed
    // Check both direct ID match and employee+course format
    const isMatch = (completedTrainingId == t.id) || 
                    (completedTrainingId === t.employee_id + '_' + t.course_title);
    
    if (isMatch && completedAssessmentType) {
      if (completedAssessmentType === 'exam') {
        // Exam completed: W/EXAM green, W/TEEF red
        if (effectivenessText.includes('W/EXAM') && effectivenessText.includes('W/TEEF')) {
          v_effectiveness_form.innerHTML = '<span style="color: #28a745; font-weight: 700; white-space: nowrap;">W/EXAM</span><br/><span style="color: #dc3545; font-weight: 700; white-space: nowrap;">W/TEEF</span>';
        } else if (effectivenessText.includes('W/EXAM')) {
          v_effectiveness_form.innerHTML = '<span style="color: #28a745; font-weight: 700;">W/EXAM</span>';
        }
      } else if (completedAssessmentType === 'evaluation') {
        // Evaluation completed: W/TEEF green, W/EXAM red
        if (effectivenessText.includes('W/EXAM') && effectivenessText.includes('W/TEEF')) {
          v_effectiveness_form.innerHTML = '<span style="color: #dc3545; font-weight: 700; white-space: nowrap;">W/EXAM</span><br/><span style="color: #28a745; font-weight: 700; white-space: nowrap;">W/TEEF</span>';
        } else if (effectivenessText.includes('W/TEEF')) {
          v_effectiveness_form.innerHTML = '<span style="color: #28a745; font-weight: 700;">W/TEEF</span>';
        }
      }
      
      // Clear the session storage after applying colors
      sessionStorage.removeItem('completedAssessmentType');
      sessionStorage.removeItem('completedTrainingId');
    } else {
      // No color coding, just display the text
      v_effectiveness_form.textContent = effectivenessText;
    }
  }
  
  console.log('✅ Modal fields populated');
  
  // Store the training ID for edit functionality
  window.currentViewingTrainingId = id;
  
  // Show appropriate button based on effectiveness_form
  const evaluationBtn = document.getElementById('evaluationBtn');
  const examBtn = document.getElementById('examBtn');
  
  if (evaluationBtn) evaluationBtn.style.display = 'none';
  if (examBtn) examBtn.style.display = 'none';
  
  // Show buttons based on effectiveness form type
  // Check if both W/EXAM and W/TEEF are present (handles "W/EXAM TEEF", "W/EXAM & TEEF", "W/EXAM_TEEF", etc.)
  const effectivenessForm = t.effectiveness_form || '';
  const hasExam = effectivenessForm.includes('W/EXAM');
  const hasTeef = effectivenessForm.includes('W/TEEF') || effectivenessForm.includes('TEEF');
  const hasBothExamAndTeef = hasExam && hasTeef;
  
  if (hasBothExamAndTeef) {
    // Show both buttons when both are present
    if (evaluationBtn) evaluationBtn.style.display = 'inline-block';
    if (examBtn) examBtn.style.display = 'inline-block';
    console.log('✅ Showing both Evaluation and Exam buttons for W/EXAM & W/TEEF');
  } else if (hasTeef) {
    if (evaluationBtn) evaluationBtn.style.display = 'inline-block';
    console.log('✅ Showing Evaluation button for W/TEEF');
  } else if (hasExam) {
    if (examBtn) examBtn.style.display = 'inline-block';
    console.log('✅ Showing Exam button for W/EXAM');
  }
  
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
function openPdfPreview(trainingId, fileType) {
  console.log('=== openPdfPreview called with id:', trainingId, 'fileType:', fileType);
  
  // If localTrainings is empty, try to load it first
  if (localTrainings.length === 0 && (!window.filteredTrainings || window.filteredTrainings.length === 0)) {
    console.log('⏳ localTrainings is empty, loading from API...');
    loadTrainings();
  }
  
  // Search in all possible sources
  let t = null;
  
  // Try window.filteredTrainings first
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
    showNotification('Training record not found.', 'error');
    return;
  }
  
  // Determine which file to show based on fileType parameter
  let fileUrl = null;
  
  if (fileType === 'teef') {
    // Show TEEF file (uses eff_form_file column)
    fileUrl = t.eff_form_file;
    if (!fileUrl) {
      showNotification('No TEEF attachment available for this record.', 'error');
      return;
    }
  } else {
    // Show EXAM file (default) - use exam_form_url column
    fileUrl = t.exam_form_url;
    if (!fileUrl) {
      showNotification('No EXAM attachment available for this record.', 'error');
      return;
    }
  }
  
  const iframe = document.getElementById('pdfPreviewFrame');
  const pdfPreviewModal = document.getElementById('pdfPreviewModal');
  const downloadLink = document.getElementById('pdfDownloadLink');
  const pdfPreviewTitle = document.getElementById('pdfPreviewTitle');
  
  if (!iframe) {
    console.error('❌ PDF iframe not found');
    showNotification('Error: PDF viewer not available.', 'error');
    return;
  }
  
  // Set iframe source and download link
  iframe.src = fileUrl;
  downloadLink.href = fileUrl;
  
  // Set custom download filename with employee name and course/exam info
  const employeeName = (t.full_name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const courseName = (t.course_title || 'Exam').replace(/[^a-zA-Z0-9]/g, '_');
  const fileTypeSuffix = fileType === 'teef' ? '_TEEF' : '_EXAM';
  const downloadFileName = `${employeeName}_${courseName}${fileTypeSuffix}.pdf`;
  downloadLink.download = downloadFileName;
  downloadLink.title = `Download ${downloadFileName}`;
  
  // Update modal title to show which file is being viewed
  if (pdfPreviewTitle) {
    const fileTypeLabel = fileType === 'teef' ? 'TEEF Form' : 'EXAM';
    pdfPreviewTitle.textContent = `${fileTypeLabel} - ${courseName}`;
  }
  
  pdfPreviewModal.style.display = 'flex';
}

function closePdfPreview() {
  const pdfPreviewModal = document.getElementById('pdfPreviewModal');
  const pdfIframe = document.getElementById('pdfIframe');
  
  if (pdfPreviewModal) {
    pdfPreviewModal.style.display = 'none';
  }
  if (pdfIframe) {
    pdfIframe.src = '';
  }
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
    
    // Add change event listener for attachment validation
    t_effectiveness_form.addEventListener('change', async function() {
      console.log('📝 Effectiveness form changed to:', this.value);
      
      if (this.value === 'W/EXAM_TEEF') {
        // Show warning for W/EXAM_TEEF
        console.log('⚠️ W/EXAM_TEEF selected - contains both EXAM and TEEF');
        showEffectivenessFormWarning('⚠️ Warning: This training contains BOTH TEEF Form AND EXAM - Please ensure both attachments are uploaded');
      } else if (this.value === 'W/TEEF') {
        // Check for TEEF attachment
        const courseTitle = t_course_title ? t_course_title.value : '';
        console.log('🔎 Checking TEEF attachment for:', courseTitle);
        await checkTeefAttachmentModal(courseTitle, trainingId);
      }
    });
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


// Check TEEF attachment and show modal notification
async function checkTeefAttachmentModal(courseTitle, trainingId) {
  try {
    console.log('🔍 Checking TEEF attachment for:', courseTitle);
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('teef_attachment_modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'teef_attachment_modal';
      modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
      `;
      
      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background-color: #fefefe;
        margin: 10% auto;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
      `;
      
      const modalMessage = document.createElement('p');
      modalMessage.id = 'teef_modal_message';
      modalMessage.style.cssText = `
        font-size: 14px;
        margin: 0 0 15px 0;
        font-weight: 500;
      `;
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'OK';
      closeBtn.style.cssText = `
        padding: 8px 20px;
        background-color: #4169e1;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      closeBtn.onclick = function() {
        modal.style.display = 'none';
      };
      
      modalContent.appendChild(modalMessage);
      modalContent.appendChild(closeBtn);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    }
    
    const modalMessage = document.getElementById('teef_modal_message');
    
    // Check for attachment
    const url = `/api/test-form-attachment?title=${encodeURIComponent(courseTitle)}`;
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📥 Response:', data);
    
    if (data.success && data.hasAttachment === true) {
      // Green notification - has attachment
      console.log('✅ GREEN - TEEF Attachment found');
      modalMessage.textContent = '✅ TEEF Form Attachment: Found';
      modalMessage.style.color = '#155724';
      modal.style.display = 'block';
    } else if (data.success && data.hasAttachment === false) {
      // Red notification - no attachment
      console.log('❌ RED - TEEF Attachment not found');
      modalMessage.textContent = '❌ TEEF Form Attachment: Not Found - Please upload TEEF form';
      modalMessage.style.color = '#721c24';
      modal.style.display = 'block';
    } else {
      console.warn('⚠️ Unexpected response format:', data);
    }
  } catch (err) {
    console.error('❌ Error checking TEEF attachment:', err);
  }
}

// Show effectiveness form warning modal
function showEffectivenessFormWarning(message) {
  try {
    console.log('⚠️ Showing effectiveness form warning:', message);
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('effectiveness_warning_modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'effectiveness_warning_modal';
      modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
      `;
      
      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background-color: #fefefe;
        margin: 10% auto;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
      `;
      
      const modalMessage = document.createElement('p');
      modalMessage.id = 'effectiveness_warning_message';
      modalMessage.style.cssText = `
        font-size: 14px;
        margin: 0 0 15px 0;
        font-weight: 500;
        color: #ff9800;
      `;
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'OK';
      closeBtn.style.cssText = `
        padding: 8px 20px;
        background-color: #ff9800;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      closeBtn.onclick = function() {
        modal.style.display = 'none';
      };
      
      modalContent.appendChild(modalMessage);
      modalContent.appendChild(closeBtn);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    }
    
    const modalMessage = document.getElementById('effectiveness_warning_message');
    modalMessage.textContent = message;
    modal.style.display = 'block';
  } catch (err) {
    console.error('❌ Error showing effectiveness form warning:', err);
  }
}


// Open evaluation form for a training record
function openEvaluationForm(trainingId) {
  if (!trainingId) {
    showNotification('No training record selected', 'error');
    return;
  }
  
  console.log('Opening evaluation form for training ID:', trainingId);
  
  // Store the training ID in sessionStorage so the evaluation form can access it
  sessionStorage.setItem('evaluationTrainingId', trainingId);
  
  // Close the current modal
  closeModal('viewTrain');
  
  // Redirect to the evaluation form with the training ID
  window.location.href = `/pages/training-evaluation-form.html?id=${trainingId}`;
}

// Open TEEF form in read-only view mode (called from green W/TEEF link in table)
function openTeefForm(trainingId) {
  if (!trainingId) return;
  window.location.href = `/pages/training-evaluation-form.html?id=${trainingId}&view=1`;
}

// Open exam form for a training record
function openExamForm(trainingId) {
  if (!trainingId) {
    showNotification('No training record selected', 'error');
    return;
  }
  
  console.log('🔍 Opening exam form for training ID:', trainingId);
  
  // Find the training record to get the course title
  let trainingRecord = null;
  
  if (window.filteredTrainings && window.filteredTrainings.length > 0) {
    trainingRecord = window.filteredTrainings.find(x => x.id == trainingId);
  }
  
  if (!trainingRecord && localTrainings && localTrainings.length > 0) {
    trainingRecord = localTrainings.find(x => x.id == trainingId);
  }
  
  if (!trainingRecord && window.trainings && window.trainings.length > 0) {
    trainingRecord = window.trainings.find(x => x.id == trainingId);
  }
  
  if (!trainingRecord) {
    console.error('❌ Training record not found');
    showNotification('Training record not found', 'error');
    return;
  }
  
  const courseTitle = trainingRecord.course_title;
  console.log('📚 Opening exam for course:', courseTitle);
  
  // Store the training data in sessionStorage
  sessionStorage.setItem('examTrainingId', trainingId);
  sessionStorage.setItem('examCourseName', courseTitle);
  
  // Close the current modal
  closeModal('viewTrain');
  
  // Fetch exams to find the matching one
  fetch('/api/exams')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.data)) {
        // Try to find exam by course title
        let exam = data.data.find(e => e.title === courseTitle);
        
        if (!exam) {
          exam = data.data.find(e => e.title.toLowerCase() === courseTitle.toLowerCase());
        }
        
        if (!exam) {
          const courseNameLower = courseTitle.toLowerCase();
          exam = data.data.find(e => e.title.toLowerCase().includes(courseNameLower) || courseNameLower.includes(e.title.toLowerCase()));
        }
        
        if (exam) {
          console.log('✅ Found exam ID:', exam.id);
          // Navigate with exam ID
          window.location.href = `/pages/take-exam.html?id=${exam.id}`;
        } else {
          console.log('⚠️ No exact exam match found, navigating with course name');
          // Fall back to course name
          window.location.href = `/pages/take-exam.html?course=${encodeURIComponent(courseTitle)}`;
        }
      }
    })
    .catch(err => {
      console.error('❌ Error fetching exams:', err);
      // Fall back to course name
      window.location.href = `/pages/take-exam.html?course=${encodeURIComponent(courseTitle)}`;
    });
}
