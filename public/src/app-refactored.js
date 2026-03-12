/**
 * Main App Entry Point
 * Imports and initializes all modules
 */

// Global API constant - used by all modules
window.API = '';

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded - initializing app');
  
  // Update dropdown options from localStorage
  await window.DropdownManager.updateDatalistOptions();
  
  // Only load employees if we're on index.html
  const dashboardSection = document.getElementById('dashboardSection');
  const recordsSection = document.getElementById('recordsSection');
  
  if (dashboardSection || recordsSection) {
    console.log('On index.html - loading data...');
    try {
      await window.DataLoader.loadEmployees();
      console.log('Data loaded:', window.employees.length, 'employees,', window.trainings.length, 'trainings');
      
      if (typeof renderDashboard === 'function') {
        renderDashboard();
      }
      
      if (recordsSection) recordsSection.style.display = 'block';
      if (dashboardSection) dashboardSection.style.display = 'none';
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  } else {
    console.log('On dedicated page - skipping app.js loadEmployees()');
  }
});

// Expose global functions for HTML onclick handlers
window.openAddEmp = window.EmployeeManager.openAddEmp;
window.openEditEmp = window.EmployeeManager.openEditEmp;
window.saveEmployee = window.EmployeeManager.saveEmployee;
window.deleteEmployee = window.EmployeeManager.deleteEmployee;
window.selectEmployee = window.EmployeeManager.selectEmployee;

window.openAddTraining = window.TrainingManager.openAddTraining;
window.openAddTrainingForEmployee = window.TrainingManager.openAddTrainingForEmployee;
window.openEditTraining = window.TrainingManager.openEditTraining;
window.openViewTraining = window.TrainingManager.openViewTraining;
window.convertViewToEdit = window.TrainingManager.convertViewToEdit;
window.saveTraining = window.TrainingManager.saveTraining;
window.deleteTraining = window.TrainingManager.deleteTraining;
window.openEmployeeTrainingOverview = window.TrainingManager.openEmployeeTrainingOverview;
window.selectOverviewTrainingRow = window.TrainingManager.selectOverviewTrainingRow;
window.editSelectedOverviewTraining = window.TrainingManager.editSelectedOverviewTraining;
window.deleteSelectedOverviewTraining = window.TrainingManager.deleteSelectedOverviewTraining;
window.deleteTrainingFromOverview = window.TrainingManager.deleteTrainingFromOverview;
window.printEmployeeTraining = window.TrainingManager.printEmployeeTraining;

window.showNotification = window.UIHelpers.showNotification;
window.closeNotification = window.UIHelpers.closeNotification;
window.toast = window.UIHelpers.toast;
window.openModal = window.UIHelpers.openModal;
window.closeModal = window.UIHelpers.closeModal;

window.populateEmployeeDropdown = window.DropdownManager.populateEmployeeDropdown;
window.loadEmployees = window.DataLoader.loadEmployees;
