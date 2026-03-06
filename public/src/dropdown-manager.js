// Default options
const DEFAULT_OPTIONS = {
  courses: [
    'COMPANY ORIENTATION',
    'PRODUCT SAFETY',
    'COUNTERFEIT PARTS',
    '5S FOD',
    'QUALITY MANAGEMENT SYSTEM',
    'COMPANY INTRODUCTION',
    'TRAINERS TRAINING COURSE',
    'ONLINE 8-HOUR ENVIRONMENTAL TRAINING COURSE FOR MANAGING HEADS',
    'ROOT-CAUSE ANALYSIS (RCA)'
  ],
  providers: [
    'NSB ENGINEERING',
    'THINKSAFE',
    'QUALITEX MANAGEMENT CONSULTANCY',
    'ENVIA CONSULTANCY',
    'CAAT ENGINEERING SOLUTIONS ASIA',
    'BUREAU OF FIRE PROTECTION',
    'KEYENCE',
    'CYTEK',
    'HSSLLC',
    'TESDA',
    'TUV RHEINLAND'
  ],
  venues: [
    'NSB CMM AREA',
    'CONFERENCE ROOM',
    'NSB ENGINEERING',
    'NSB CONFERENCE ROOM',
    'SAFETY ROOM',
    'MAKATI CITY',
    'HSSLLC TRAINING CENTER',
    'WEBINAR'
  ],
  trainers: [
    'J. RENZALES',
    'S. TORIBIO',
    'D. CRUZ',
    'M. NONO',
    'E. PIKE',
    'V. OSORIO',
    'EXTERNAL TRAINER'
  ]
};

// Load options from localStorage or use defaults
function loadOptions(category) {
  const stored = localStorage.getItem(`dropdown_${category}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return [...DEFAULT_OPTIONS[category]];
}

// Save options to localStorage
function saveOptions(category, options) {
  localStorage.setItem(`dropdown_${category}`, JSON.stringify(options));
}

// Get all options for a category
function getOptions(category) {
  return loadOptions(category);
}

// Add new option
function addOption(category) {
  const inputId = `new-${category.slice(0, -1)}`;
  const input = document.getElementById(inputId);
  const value = input.value.trim().toUpperCase();
  
  if (!value) {
    alert('Please enter a value');
    return;
  }
  
  const options = loadOptions(category);
  
  if (options.includes(value)) {
    alert('This option already exists');
    return;
  }
  
  options.push(value);
  options.sort();
  saveOptions(category, options);
  
  input.value = '';
  renderList(category);
  
  showNotification('Added successfully!', 'success');
}

// Delete option
function deleteOption(category, value) {
  if (!confirm(`Delete "${value}"?`)) {
    return;
  }
  
  let options = loadOptions(category);
  options = options.filter(opt => opt !== value);
  saveOptions(category, options);
  
  renderList(category);
  showNotification('Deleted successfully!', 'success');
}

// Render list
function renderList(category) {
  const listId = `${category}-list`;
  const list = document.getElementById(listId);
  const options = loadOptions(category);
  const defaults = DEFAULT_OPTIONS[category];
  
  if (options.length === 0) {
    list.innerHTML = '<li class="empty-state">No options available. Add some above!</li>';
    return;
  }
  
  list.innerHTML = options.map(option => {
    const isDefault = defaults.includes(option);
    return `
      <li class="option-item ${isDefault ? 'default' : ''}">
        <span>
          ${option}
          ${isDefault ? '<span class="badge">DEFAULT</span>' : ''}
        </span>
        ${!isDefault ? `<button class="btn-delete" onclick="deleteOption('${category}', '${option.replace(/'/g, "\\'")}')">🗑 Delete</button>` : ''}
      </li>
    `;
  }).join('');
}

// Switch tab
function switchTab(category) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${category}-tab`).classList.add('active');
  
  // Render list
  renderList(category);
}

// Reset to defaults
function resetToDefaults() {
  if (!confirm('Reset all options to defaults? This will remove all custom options.')) {
    return;
  }
  
  Object.keys(DEFAULT_OPTIONS).forEach(category => {
    localStorage.removeItem(`dropdown_${category}`);
  });
  
  // Re-render current tab
  const activeTab = document.querySelector('.tab-content.active').id.replace('-tab', '');
  renderList(activeTab);
  
  showNotification('Reset to defaults successfully!', 'success');
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === 'success' ? '#27ae60' : '#c0392b'};
    color: white;
    border-radius: 8px;
    font-family: 'Barlow', sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderList('courses');
  
  // Add Enter key support for inputs
  ['courses', 'providers', 'venues', 'trainers'].forEach(category => {
    const inputId = `new-${category.slice(0, -1)}`;
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addOption(category);
        }
      });
    }
  });
});

// Export functions for use in main app
window.DropdownManager = {
  getOptions,
  loadOptions
};
