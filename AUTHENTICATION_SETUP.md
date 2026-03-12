# Authentication & RBAC Setup Guide

## Overview
This guide explains how to set up and use the authentication system with Role-Based Access Control (RBAC) for the NSB Training system.

## Database Adaptation

The authentication system has been adapted to work with your existing NSB_Training database:

### New Tables Created

#### 1. Users Table
```sql
CREATE TABLE Users (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    employee_id BIGINT NOT NULL,
    username NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'employee',
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (employee_id) REFERENCES Employees(id)
);
```

**Columns:**
- `id`: Unique user identifier
- `employee_id`: Links to Employees table
- `username`: Unique login username
- `password_hash`: SHA256 hashed password
- `role`: User role (admin, manager, employee)
- `is_active`: Account status
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

#### 2. Sessions Table
```sql
CREATE TABLE Sessions (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    session_token NVARCHAR(255) UNIQUE NOT NULL,
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
```

**Columns:**
- `id`: Unique session identifier
- `user_id`: Links to Users table
- `session_token`: Unique session token (32-byte hex)
- `ip_address`: Client IP address
- `user_agent`: Browser/client information
- `created_at`: Session creation timestamp
- `expires_at`: Session expiration time (24 hours)

## Setup Instructions

### Step 1: Run Authentication Setup
```bash
node setup-auth.js
```

This script will:
- Create the Users table
- Create the Sessions table
- Create the admin account for Employee #1
- Set up all necessary indexes

### Step 2: Update Server Configuration
The server.js has been updated to include:
- Authentication endpoints
- Session management
- RBAC middleware

### Step 3: Start the Server
```bash
node server.js
```

The server will now:
- Redirect root path (/) to login page
- Provide authentication endpoints
- Support session-based access control

## Authentication Endpoints

### 1. Login
**POST** `/api/auth/login`

Request:
```json
{
  "username": "admin",
  "password": "ADMIN123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "sessionToken": "hex_string_token",
    "user": {
      "id": 1,
      "employee_id": 1,
      "username": "admin",
      "role": "admin",
      "full_name": "Employee Name",
      "employee_no": "001",
      "department": "Engineering",
      "position": "Manager"
    }
  }
}
```

### 2. Create Account
**POST** `/api/auth/create-account`

Request:
```json
{
  "employee_no": "002",
  "username": "john_doe",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user_id": 2,
    "employee_no": "002",
    "full_name": "John Doe",
    "department": "Engineering",
    "position": "Technician"
  }
}
```

### 3. Verify Session
**POST** `/api/auth/verify-session`

Request:
```json
{
  "sessionToken": "hex_string_token"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_id": 1,
    "username": "admin",
    "role": "admin",
    "full_name": "Employee Name",
    "employee_no": "001",
    "department": "Engineering",
    "position": "Manager"
  }
}
```

### 4. Logout
**POST** `/api/auth/logout`

Request:
```json
{
  "sessionToken": "hex_string_token"
}
```

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 5. Get Employees for Signup
**GET** `/api/auth/employees-for-signup`

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "employee_no": "002",
      "full_name": "John Doe",
      "department": "Engineering",
      "position": "Technician"
    }
  ]
}
```

## Login Page Features

### Testing Dropdown
The login page includes a dropdown for testing purposes:
- Select "Admin (Employee #1) - Password: ADMIN123"
- Username and password fields auto-populate
- Click Login to test

### Account Creation
Users can create accounts by:
1. Clicking "Create one" link on login page
2. Selecting their employee number from dropdown
3. Choosing a username
4. Setting a password (minimum 6 characters)
5. Confirming password
6. Clicking "Create Account"

## Role-Based Access Control (RBAC)

### Available Roles

#### 1. Admin
- Full system access
- Can manage users and roles
- Can view all training records and exams
- Can create and modify courses
- Can manage employee accounts

#### 2. Manager
- Can view team training records
- Can assign training to employees
- Can view exam results
- Can generate reports

#### 3. Employee
- Can view own training records
- Can take exams
- Can view own exam results
- Can access personal dashboard

## Client-Side Implementation

### Storing Session Token
```javascript
// After successful login
localStorage.setItem('sessionToken', result.data.sessionToken);
localStorage.setItem('user', JSON.stringify(result.data.user));
```

### Using Session Token in Requests
```javascript
const sessionToken = localStorage.getItem('sessionToken');
const response = await fetch('/api/protected-endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
});
```

### Checking User Role
```javascript
const user = JSON.parse(localStorage.getItem('user'));
if (user.role === 'admin') {
  // Show admin features
}
```

## Server-Side Protection

### Using Middleware
```javascript
const authMiddleware = require('./auth-middleware');

// Protect a route
app.get('/api/admin/users', 
  authMiddleware.verifySession,
  authMiddleware.requireAdmin,
  (req, res) => {
    // req.user contains user information
  }
);
```

### Available Middleware Functions
- `verifySession`: Verifies session token and attaches user to request
- `requireRole(...roles)`: Checks if user has required role
- `requireAdmin`: Checks if user is admin
- `requireAdminOrManager`: Checks if user is admin or manager

## Testing Credentials

### Admin Account
- **Username:** admin
- **Password:** ADMIN123
- **Role:** admin
- **Employee:** #1 (First employee in database)

### Creating Test Accounts
1. Go to login page
2. Click "Create one"
3. Select any employee from dropdown
4. Create account with test credentials
5. Login with new account

## Security Notes

### Password Hashing
- Passwords are hashed using SHA256
- For production, use bcrypt or similar
- Never store plain text passwords

### Session Management
- Sessions expire after 24 hours
- Session tokens are 32-byte hex strings
- Sessions are stored in database
- Expired sessions are automatically cleaned up

### CORS Configuration
- CORS is enabled for development
- Update CORS settings for production
- Restrict to specific domains

## Troubleshooting

### Admin Account Not Created
- Ensure Employees table has at least one record
- Run `setup-auth.js` again
- Check database connection

### Login Fails
- Verify username and password
- Check if account is active (is_active = 1)
- Verify employee_id exists in Employees table

### Session Expires Too Quickly
- Check database server time
- Verify expires_at is set correctly
- Check session cleanup logic

## Next Steps

1. Run `node setup-auth.js` to initialize authentication
2. Start server with `node server.js`
3. Navigate to `http://localhost:3001`
4. Login with admin credentials
5. Create test accounts for other employees
6. Implement RBAC checks in your routes

## Files Modified/Created

- `auth-server.js` - Authentication logic
- `auth-middleware.js` - RBAC middleware
- `setup-auth.js` - Database setup script
- `auth-setup.sql` - SQL setup script
- `public/login.html` - Login page UI
- `public/css/login.css` - Login page styles
- `public/js/login.js` - Login page logic
- `server.js` - Updated with auth endpoints
