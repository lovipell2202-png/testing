const API_URL = 'http://localhost:3001/api';

// Switch between login and signup forms
function switchForm(formId) {
    document.querySelectorAll('.form-section').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(formId).classList.add('active');
    clearMessages();
}

// Clear all messages
function clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
        msg.classList.remove('show');
        msg.textContent = '';
    });
}

// Show error message
function showError(formType, message) {
    const errorEl = document.getElementById(`${formType}Error`);
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

// Show success message
function showSuccess(formType, message) {
    const successEl = document.getElementById(`${formType}Success`);
    successEl.textContent = message;
    successEl.classList.add('show');
}

// Load employees for signup dropdown
async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/auth/employees-for-signup`);
        const result = await response.json();

        if (result.success) {
            const dropdown = document.getElementById('employeeDropdown');
            dropdown.innerHTML = '<option value="">-- Select an employee --</option>';

            result.data.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.employee_no;
                option.textContent = `${emp.employee_no} - ${emp.full_name} (${emp.department})`;
                option.dataset.employeeNo = emp.employee_no;
                dropdown.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading employees:', err);
        showError('signup', 'Failed to load employees');
    }
}

// Handle test admin dropdown
document.getElementById('testAdminDropdown').addEventListener('change', function() {
    if (this.value === 'admin') {
        document.getElementById('loginUsername').value = 'admin';
        document.getElementById('loginPassword').value = 'ADMIN123';
    }
});

// Handle login form submission
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showError('login', 'Please enter username and password');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            // Store session token and user info
            localStorage.setItem('sessionToken', result.data.sessionToken);
            localStorage.setItem('user', JSON.stringify(result.data.user));

            showSuccess('login', 'Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        } else {
            showError('login', result.message || 'Login failed');
        }
    } catch (err) {
        showError('login', 'Connection error: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// Handle signup form submission
document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const employeeNo = document.getElementById('employeeDropdown').value;
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!employeeNo || !username || !password || !confirmPassword) {
        showError('signup', 'Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        showError('signup', 'Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showError('signup', 'Password must be at least 6 characters');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        const response = await fetch(`${API_URL}/auth/create-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_no: employeeNo, username, password, confirmPassword })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('signup', `Account created successfully for ${result.data.full_name}! You can now login.`);
            
            // Reset form and switch to login
            document.getElementById('signupFormElement').reset();
            setTimeout(() => {
                switchForm('loginForm');
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').focus();
            }, 2000);
        } else {
            showError('signup', result.message || 'Account creation failed');
        }
    } catch (err) {
        showError('signup', 'Connection error: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();

    // Check if already logged in
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
        // Verify session is still valid
        verifySession(sessionToken);
    }
});

// Verify session
async function verifySession(sessionToken) {
    try {
        const response = await fetch(`${API_URL}/auth/verify-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken })
        });

        const result = await response.json();

        if (result.success) {
            // Already logged in, redirect to dashboard
            window.location.href = '/index.html';
        } else {
            // Session expired, clear storage
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('user');
        }
    } catch (err) {
        console.error('Session verification error:', err);
    }
}
