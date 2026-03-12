/**
 * Dropdown Manager Module
 * Handles dropdown options and datalist updates
 */

// API constant - used by all modules
const API = '';

// Load dropdown options from localStorage
function loadDropdownOptions(category) {
  const stored = localStorage.getItem(`dropdown_${category}`);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return defaults if nothing in localStorage
  const defaults = {
    courses: ['COMPANY ORIENTATION', 'PRODUCT SAFETY', 'COUNTERFEIT PARTS', '5S FOD', 'QUALITY MANAGEMENT SYSTEM', 'COMPANY INTRODUCTION', 'TRAINERS TRAINING COURSE', 'ONLINE 8-HOUR ENVIRONMENTAL TRAINING COURSE FOR MANAGING HEADS', 'ROOT-CAUSE ANALYSIS (RCA)'],
    providers: ['NSB ENGINEERING', 'THINKSAFE', 'QUALITEX MANAGEMENT CONSULTANCY', 'ENVIA CONSULTANCY', 'CAAT ENGINEERING SOLUTIONS ASIA', 'BUREAU OF FIRE PROTECTION', 'KEYENCE', 'CYTEK', 'HSSLLC', 'TESDA', 'TUV RHEINLAND'],
    venues: ['NSB CMM AREA', 'CONFERENCE ROOM', 'NSB ENGINEERING', 'NSB CONFERENCE ROOM', 'SAFETY ROOM', 'MAKATI CITY', 'HSSLLC TRAINING CENTER', 'WEBINAR'],
    trainers: ['J. RENZALES', 'S. TORIBIO', 'D. CRUZ', 'M. NONO', 'E. PIKE', 'V. OSORIO', 'EXTERNAL TRAINER']
  };
  return defaults[category] || [];
}

// Load courses from API and merge with dropdown options
async function loadCoursesFromAPI() {
  try {
    const res = await fetch(`${API}/api/courses`);
    const data = await res.json();
    
    if (data.success && Array.isArray(data.data)) {
      const apiCourses = data.data.map(c => c.course_title);
      const existingCourses = loadDropdownOptions('courses');
      const allCourses = [...new Set([...existingCourses, ...apiCourses])];
      
      localStorage.setItem('dropdown_courses', JSON.stringify(allCourses));
      console.log('✅ Loaded courses from API:', apiCourses.length, 'Total courses:', allCourses.length);
      return allCourses;
    }
  } catch (err) {
    console.error('Error loading courses from API:', err);
  }
  return loadDropdownOptions('courses');
}

// Update datalist options
async function updateDatalistOptions() {
  const courses = await loadCoursesFromAPI();
  
  const courseList = document.getElementById('courseList');
  if (courseList) {
    courseList.innerHTML = courses.map(c => `<option value="${c}">`).join('');
  }
  
  const providerList = document.getElementById('providerList');
  if (providerList) {
    const providers = loadDropdownOptions('providers');
    providerList.innerHTML = providers.map(p => `<option value="${p}">`).join('');
  }
  
  const venueList = document.getElementById('venueList');
  if (venueList) {
    const venues = loadDropdownOptions('venues');
    venueList.innerHTML = venues.map(v => `<option value="${v}">`).join('');
  }
  
  const trainerList = document.getElementById('trainerList');
  if (trainerList) {
    const trainers = loadDropdownOptions('trainers');
    trainerList.innerHTML = trainers.map(t => `<option value="${t}">`).join('');
  }
}

// Populate employee dropdown
function populateEmployeeDropdown() {
  const empSelect = document.getElementById('t_employee_id');
  if (!empSelect) return;
  
  const employees = window.employees || [];
  empSelect.innerHTML = `<option value="">-- Select Employee --</option>` + 
    employees.map(e => `<option value="${e.id}">${e.full_name || e.employee_name}</option>`).join('');
}

// Export for use in other modules
window.DropdownManager = {
  loadDropdownOptions,
  loadCoursesFromAPI,
  updateDatalistOptions,
  populateEmployeeDropdown
};
