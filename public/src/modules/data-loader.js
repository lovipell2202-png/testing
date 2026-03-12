/**
 * Data Loader Module
 * Handles loading employees and trainings from API
 */

// Load employees and trainings
async function loadEmployees() {
  try {
    console.log('=== loadEmployees: Starting ===');
    const timestamp = new Date().getTime();
    console.log('API endpoint:', `${window.API || ''}/api/employees?t=${timestamp}`);
    
    const res = await fetch(`${window.API || ''}/api/employees?t=${timestamp}`);
    console.log('Employee fetch response status:', res.status);
    
    const data = await res.json();
    console.log('Employee data:', data);
    
    if (data.success) {
      window.employees = data.data;
      console.log('✅ Loaded employees:', window.employees.length);
      if (window.employees.length > 0) {
        console.log('Sample employee:', window.employees[0]);
      }
      
      const trainingsRes = await fetch(`${window.API || ''}/api/trainings?t=${timestamp}`);
      console.log('Trainings fetch response status:', trainingsRes.status);
      
      const trainingsData = await trainingsRes.json();
      console.log('Trainings data type:', typeof trainingsData);
      console.log('Trainings data is array?', Array.isArray(trainingsData));
      console.log('Trainings data:', trainingsData);
      
      if (Array.isArray(trainingsData)) {
        window.trainings = trainingsData;
      } else if (trainingsData && trainingsData.success && Array.isArray(trainingsData.data)) {
        window.trainings = trainingsData.data;
      } else if (trainingsData && trainingsData.recordset && Array.isArray(trainingsData.recordset)) {
        window.trainings = trainingsData.recordset;
      } else if (trainingsData && typeof trainingsData === 'object' && !Array.isArray(trainingsData)) {
        console.warn('Trainings data is object, attempting to extract array');
        window.trainings = [];
      } else {
        console.error('Unexpected trainings data format:', trainingsData);
        window.trainings = [];
      }
      
      console.log('✅ Loaded trainings:', window.trainings.length);
      if (window.trainings.length > 0) {
        console.log('Sample training:', window.trainings[0]);
      }
      console.log('=== loadEmployees: Complete ===');
    } else {
      console.error('❌ API error:', data);
    }
  } catch (err) {
    console.error('❌ Failed to load employees:', err);
    throw err;
  }
}

// Export for use in other modules
window.DataLoader = {
  loadEmployees
};
