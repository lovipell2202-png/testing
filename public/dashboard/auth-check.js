// Authentication check for protected pages
const API_URL = 'http://localhost:3001/api';

async function checkAuthentication() {
  const sessionToken = localStorage.getItem('sessionToken');
  const user = localStorage.getItem('user');

  if (!sessionToken || !user) {
    // Not logged in, redirect to login
    window.location.href = '/login.html';
    return null;
  }

  try {
    // Verify session is still valid
    const response = await fetch(`${API_URL}/auth/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken })
    });

    const result = await response.json();

    if (!result.success) {
      // Session expired or invalid
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return null;
    }

    // Session valid, return user data
    return JSON.parse(user);
  } catch (err) {
    console.error('Authentication check failed:', err);
    window.location.href = '/login.html';
    return null;
  }
}

// Logout function
async function logout() {
  const sessionToken = localStorage.getItem('sessionToken');

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken })
    });
  } catch (err) {
    console.error('Logout error:', err);
  }

  // Clear storage and redirect
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Check role
function hasRole(requiredRole) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === requiredRole;
}

// Check if user is admin or manager
function isAdminOrManager() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return ['admin', 'manager'].includes(user.role);
}

// Get current user
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

// Get session token
function getSessionToken() {
  return localStorage.getItem('sessionToken');
}

// Make authenticated API call
async function authenticatedFetch(url, options = {}) {
  const sessionToken = getSessionToken();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return null;
  }

  return response;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuthentication();
  
  if (user) {
    // User is authenticated
    // Update UI with user info
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userDepartmentEl = document.getElementById('userDepartment');

    if (userNameEl) userNameEl.textContent = user.full_name;
    if (userRoleEl) userRoleEl.textContent = user.role.toUpperCase();
    if (userDepartmentEl) userDepartmentEl.textContent = user.department;

    // Show/hide elements based on role
    const adminElements = document.querySelectorAll('[data-role="admin"]');
    const managerElements = document.querySelectorAll('[data-role="manager"]');

    if (user.role === 'admin') {
      adminElements.forEach(el => el.style.display = '');
      managerElements.forEach(el => el.style.display = '');
    } else if (user.role === 'manager') {
      adminElements.forEach(el => el.style.display = 'none');
      managerElements.forEach(el => el.style.display = '');
    } else {
      adminElements.forEach(el => el.style.display = 'none');
      managerElements.forEach(el => el.style.display = 'none');
    }
  }
});

// Add logout button listener
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
