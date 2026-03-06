# Quick Fix Guide - Data Not Loading

## The Problem
Pages show "Loading employees..." and "Loading training records..." but never load data.

## Quick Diagnosis

### Step 1: Check if Server is Running
Run this command in terminal:
```bash
node check-server.js
```

**If you see:**
- ✅ "Server is responding!" → Server is working, go to Step 2
- ❌ "CONNECTION FAILED!" → Server is NOT running, go to Step 1b

### Step 1b: Start the Server
```bash
node server.js
```

**Expected output:**
```
✅ Connected to MS SQL Server database
🚀 Server running at http://localhost:3001
📊 Database: NSB_Training
🔗 API Base: http://localhost:3001/api
```

**If you see database connection error:**
1. Make sure SQL Server is running
2. Check credentials in server.js (user: 'sa', password: 'YourPassword123!')
3. Verify database 'NSB_Training' exists

### Step 2: Test in Browser
1. Open: `http://localhost:3001/test-server-connection.html`
2. Look for green success messages
3. If you see errors, check the error message

### Step 3: Clear Browser Cache
Sometimes old JavaScript is cached:
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page with `Ctrl + F5`

### Step 4: Check Browser Console
1. Open the All Employees or Training Records page
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for these messages:

**Success looks like:**
```
=== INLINE TEST: Checking if fetch works ===
Inline test - Response received: 200
Inline test - Data: {success: true, data: Array(50)}
=== ALL EMPLOYEES PAGE: Starting data load ===
Employee response status: 200
Loaded employees: 50
```

**Error looks like:**
```
=== INLINE TEST: Checking if fetch works ===
Inline test - Error: Failed to fetch
```

## Common Fixes

### Fix 1: Server Not Running
```bash
# Terminal 1 - Start server
node server.js

# Keep this terminal open!
```

### Fix 2: Database Not Connected
Check server.js has correct credentials:
```javascript
const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',  // ← Check this
  server: 'localhost',
  database: 'NSB_Training',      // ← Check this exists
  port: 1433,
};
```

### Fix 3: Port Already in Use
```bash
# Linux/Mac - Find what's using port 3001
lsof -i :3001

# Windows - Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process or change port in server.js
```

### Fix 4: CORS Issue
If you see CORS error in console, check server.js has:
```javascript
const cors = require('cors');
app.use(cors());
```

### Fix 5: Clear Cache and Reload
```
Ctrl + Shift + Delete → Clear cache
Ctrl + F5 → Hard reload
```

## Testing Commands

### Test 1: Check Server
```bash
node check-server.js
```

### Test 2: Test API Directly
```bash
# Linux/Mac
curl http://localhost:3001/api/employees

# Windows PowerShell
Invoke-WebRequest http://localhost:3001/api/employees
```

### Test 3: Check Database
```bash
node test-db.js
```

## What the Inline Test Does

I added an inline test to both pages that runs immediately when the page loads. This test:
1. Tries to fetch from `/api/employees`
2. Logs the response status
3. Logs the data received
4. Logs any errors

Look for "=== INLINE TEST ===" in the console to see if the basic fetch works.

## If Still Not Working

1. **Check server terminal** - Look for error messages
2. **Check browser console** - Look for the inline test results
3. **Run check-server.js** - See if server responds
4. **Share the console output** - I can help debug further

## Expected Flow

1. Page loads
2. Inline test runs → Should see "Response received: 200"
3. DOMContentLoaded fires
4. loadDataForEmployeesPage() or loadDataForTrainingPage() runs
5. Data fetches from API
6. Table renders with data
7. "Loading..." message disappears

If any step fails, the console will show where it stopped.
