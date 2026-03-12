const sql = require('mssql');

let pool;

function setPool(dbPool) {
  pool = dbPool;
}

// Middleware to verify session and attach user to request
async function verifySession(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({ success: false, message: 'No session token provided' });
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

    req.user = result.recordset[0];
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Middleware to check if user has required role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    next();
  };
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  next();
}

// Middleware to check if user is admin or manager
function requireAdminOrManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin or Manager access required' });
  }

  next();
}

module.exports = {
  setPool,
  verifySession,
  requireRole,
  requireAdmin,
  requireAdminOrManager
};
