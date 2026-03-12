/**
 * UI Helpers Module
 * Handles notifications, modals, and UI utilities
 */

// Notification system
function showNotification(title, message, isSuccess = true) {
  const modal = document.getElementById('notificationModal');
  const head = document.getElementById('notificationHead');
  const titleEl = document.getElementById('notificationTitle');
  const icon = document.getElementById('notificationIcon');
  const msgEl = document.getElementById('notificationMessage');
  
  titleEl.textContent = title;
  msgEl.textContent = message;
  
  if (isSuccess) {
    icon.textContent = '✅';
    head.style.background = '#27ae60';
    modal.classList.remove('error');
  } else {
    icon.textContent = '❌';
    head.style.background = '#c0392b';
    modal.classList.add('error');
  }
  
  modal.classList.add('open');
}

function closeNotification() {
  const modal = document.getElementById('notificationModal');
  modal.classList.remove('open');
}

// Toast notifications
let toastTimer;
function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = (isError ? '❌ ' : '✅ ') + msg;
  el.className = 'show' + (isError ? ' toast-error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = '', 3000);
}

// Modal management
function openModal(type) {
  document.getElementById(`${type}Modal`).classList.add('open');
}

function closeModal(type) {
  document.getElementById(`${type}Modal`).classList.remove('open');
  if (type === 'train') {
    window.editTrainId = null;
  }
  if (type === 'viewTrain') {
    window.currentViewTrainId = null;
  }
}

// Helper functions
function initials(name) {
  const parts = name.replace(',', '').split(' ').filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
}

function formatDateLong(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
}

// Expose functions globally for use in other scripts
window.formatDate = formatDate;
window.formatDateLong = formatDateLong;

// Export for use in other modules
window.UIHelpers = {
  showNotification,
  closeNotification,
  toast,
  openModal,
  closeModal,
  initials,
  formatDate,
  formatDateLong
};
