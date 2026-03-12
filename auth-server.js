const crypto = require('crypto');
const sql = require('mssql');

let pool;

function setPool(dbPool) {
  pool = dbPool;
}

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Hash password (simple for testing - use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify password
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Login endpoint
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    // Get user from database
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`SELECT u.id, u.employee_id, u.username, u.password_hash, u.role, u.is_active, 
                     e.full_name, e.employee_no, e.department, e.position
              FROM Users u
              LEFT JOIN Employees e ON u.employee_id = e.id
              WHERE u.username = @username`);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = result.recordset[0];

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.request()
      .input('user_id', sql.BigInt, user.id)
      .input('session_token', sql.NVarChar, sessionToken)
      .input('ip_address', sql.NVarChar, req.ip)
      .input('user_agent', sql.NVarChar, req.get('user-agent'))
      .input('expires_at', sql.DateTime, expiresAt)
      .query(`INSERT INTO Sessions (user_id, session_token, ip_address, user_agent, expires_at)
              VALUES (@user_id, @session_token, @ip_address, @user_agent, @expires_at)`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        sessionToken,
        user: {
          id: user.id,
          employee_id: user.employee_id,
          username: user.username,
          role: user.role,
          full_name: user.full_name,
          employee_no: user.employee_no,
          department: user.department,
          position: user.position
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Create account endpoint
async function createAccount(req, res) {
  try {
    const { employee_no, username, password, confirmPassword } = req.body;

    if (!employee_no || !username || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const userExists = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Users WHERE username = @username');

    if (userExists.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Find employee by employee_no
    const empResult = await pool.request()
      .input('employee_no', sql.NVarChar, employee_no)
      .query('SELECT id, full_name, employee_no, department, position FROM Employees WHERE employee_no = @employee_no');

    if (empResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employee = empResult.recordset[0];

    // Check if user already has an account
    const existingUser = await pool.request()
      .input('employee_id', sql.BigInt, employee.id)
      .query('SELECT id FROM Users WHERE employee_id = @employee_id');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'This employee already has an account' });
    }

    // Create new user
    const passwordHash = hashPassword(password);
    const result = await pool.request()
      .input('employee_id', sql.BigInt, employee.id)
      .input('username', sql.NVarChar, username)
      .input('password_hash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, 'employee')
      .query(`INSERT INTO Users (employee_id, username, password_hash, role, is_active)
              VALUES (@employee_id, @username, @password_hash, @role, 1);
              SELECT SCOPE_IDENTITY() as id;`);

    res.json({
      success: true,
      message: 'Account created successfully',
      data: {
        user_id: result.recordset[0].id,
        employee_no: employee.employee_no,
        full_name: employee.full_name,
        department: employee.department,
        position: employee.position
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Logout endpoint
async function logout(req, res) {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ success: false, message: 'Session token required' });
    }

    await pool.request()
      .input('session_token', sql.NVarChar, sessionToken)
      .query('DELETE FROM Sessions WHERE session_token = @session_token');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Verify session
async function verifySession(req, res) {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(401).json({ success: false, message: 'Session token required' });
    }

    const result = await pool.request()
      .input('session_token', sql.NVarChar, sessionToken)
      .query(`SELECT u.id, u.employee_id, u.username, u.role, e.full_name, e.employee_no, e.department, e.position
              FROM Sessions s
              JOIN Users u ON s.user_id = u.id
              LEFT JOIN Employees e ON u.employee_id = e.id
              WHERE s.session_token = @session_token AND s.expires_at > GETDATE()`);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    const user = result.recordset[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        employee_id: user.employee_id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        employee_no: user.employee_no,
        department: user.department,
        position: user.position
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Get all employees for dropdown (for account creation)
async function getEmployeesForSignup(req, res) {
  try {
    const result = await pool.request()
      .query(`SELECT e.id, e.employee_no, e.full_name, e.department, e.position
              FROM Employees e
              LEFT JOIN Users u ON e.id = u.employee_id
              WHERE u.id IS NULL
              ORDER BY e.employee_no`);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  setPool,
  login,
  createAccount,
  logout,
  verifySession,
  getEmployeesForSignup
};
