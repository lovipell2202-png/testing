# Quick Start - Authentication Setup

## 1. Initialize Authentication Database
```bash
node setup-auth.js
```

Expected output:
```
🔄 Connecting to NSB_Training database...
✅ Connected to NSB_Training database

🔄 Creating Users table...
✅ Users table ready
🔄 Creating Sessions table...
✅ Sessions table ready
🔄 Setting up admin account...
✅ Admin account created for Employee #1

✅ Authentication setup completed successfully!

📋 Summary:
   - Users table created
   - Sessions table created
   - Admin account configured for Employee #1

🔐 Test Credentials:
   - Username: admin
   - Password: ADMIN123
   - Role: admin
   - Employee: [Employee Name]
```

## 2. Start the Server
```bash
node server.js
```

Expected output:
```
✅ Connected to database
🚀 Server running at http://localhost:3001
📊 Database: NSB_Training
```

## 3. Access the Application
Open your browser and go to:
```
http://localhost:3001
```

You'll see the login page.

## 4. Test Login
### Option A: Using Test Dropdown
1. On login page, select "Admin (Employee #1) - Password: ADMIN123" from dropdown
2. Click "Login"
3. You'll be redirected to dashboard

### Option B: Manual Login
1. Enter username: `admin`
2. Enter password: `ADMIN123`
3. Click "Login"

## 5. Create New Account
1. Click "Create one" link
2. Select an employee from dropdown
3. Enter username (e.g., `john_doe`)
4. Enter password (minimum 6 characters)
5. Confirm password
6. Click "Create Account"
7. Login with new credentials

## 6. Test RBAC
After login, you'll have access based on your role:
- **Admin**: Full system access
- **Manager**: Team management features
- **Employee**: Personal dashboard and exams

## Troubleshooting

### Port Already in Use
If port 3001 is already in use:
```bash
# Change port in server.js
const PORT = process.env.PORT || 3002;
```

### Database Connection Error
Check your database credentials in `server.js`:
```javascript
const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',
  server: 'localhost',
  port: 1433,
  database: 'NSB_Training',
};
```

### Admin Account Not Created
Ensure your Employees table has at least one record:
```sql
SELECT TOP 1 * FROM Employees;
```

## File Structure
```
project/
├── server.js                    # Main server with auth endpoints
├── auth-server.js              # Authentication logic
├── auth-middleware.js          # RBAC middleware
├── setup-auth.js               # Database setup script
├── auth-setup.sql              # SQL setup script
├── public/
│   ├── login.html              # Login page
│   ├── js/
│   │   └── login.js            # Login page logic
│   ├── css/
│   │   └── login.css           # Login page styles
│   └── dashboard/
│       └── dashboard.html      # Dashboard (after login)
└── AUTHENTICATION_SETUP.md     # Full documentation
```

## Next Steps
1. Customize login page branding
2. Add more roles as needed
3. Implement RBAC checks in your routes
4. Add password reset functionality
5. Implement email verification for new accounts

## Support
For detailed information, see `AUTHENTICATION_SETUP.md`
