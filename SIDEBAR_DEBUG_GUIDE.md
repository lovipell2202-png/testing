# Sidebar Not Working - Debug Guide

## Issue
The sidebar menu items are not clickable or not responding when clicked.

## Root Cause Analysis

### 1. Script Loading Issue
The scripts were using incorrect paths:
- ❌ `<script src="../src/app.js"></script>` 
- ✅ `<script src="src/app.js"></script>`

**Fixed**: Changed script paths in `public/index.html`

### 2. Function Scope
Functions need to be in global scope to work with `onclick` attributes:
- `showDashboard()` - in `dashboard.js` ✅
- `showAllEmployees()` - in `app.js` ✅
- `toggleSubmenu()` - in `app.js` ✅
- `showAllTrainingRecords()` - in `app.js` ✅
- `showTrainingByType()` - in `app.js` ✅
- `showTrainingByTrainer()` - in `app.js` ✅

### 3. Load Order
Scripts must load in correct order:
1. `src/app.js` - Main application logic
2. `dashboard/dashboard.js` - Dashboard functions

## How to Debug

### Step 1: Open Browser Console
Press F12 or Right-click → Inspect → Console tab

### Step 2: Check for Errors
Look for:
- ❌ `Uncaught ReferenceError: showDashboard is not defined`
- ❌ `Failed to load resource: net::ERR_FILE_NOT_FOUND`
- ❌ `Uncaught SyntaxError`

### Step 3: Test Functions Manually
In the console, type:
```javascript
typeof showDashboard
typeof showAllEmployees
typeof toggleSubmenu
```

Should return `"function"` for each.

### Step 4: Test Click Handlers
In the console, type:
```javascript
showDashboard()
```

Should show the dashboard section.

### Step 5: Check DOM Elements
```javascript
document.getElementById('dashboardSection')
document.getElementById('recordsSection')
```

Should return the HTML elements, not `null`.

## Common Issues & Fixes

### Issue 1: Functions Not Defined
**Symptom**: `Uncaught ReferenceError: showDashboard is not defined`

**Fix**: 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. Check script paths in HTML

### Issue 2: Scripts Not Loading
**Symptom**: `Failed to load resource: src/app.js net::ERR_FILE_NOT_FOUND`

**Fix**:
1. Verify file exists: `ls -la public/src/app.js`
2. Check server is serving static files from `public/`
3. Restart server: `npm start`

### Issue 3: CSS Blocking Clicks
**Symptom**: Buttons visible but not clickable

**Fix**:
1. Check for `pointer-events: none` in CSS
2. Check for overlaying elements with higher z-index
3. Inspect element in browser DevTools

### Issue 4: JavaScript Errors
**Symptom**: Some functions work, others don't

**Fix**:
1. Check console for syntax errors
2. Verify all required variables are defined
3. Check for typos in function names

## Testing Checklist

After fixing, test each menu item:

- [ ] Click "Dashboard" → Should show dashboard with stats
- [ ] Click "All Employees" → Should show employee list
- [ ] Click "Training Records" → Should expand submenu
  - [ ] Click "All Records" → Should show all training records
  - [ ] Click "Technical (T)" → Should filter technical trainings
  - [ ] Click "Behavioral (B)" → Should filter behavioral trainings
  - [ ] Click "By Trainer" → Should group by trainer

## Current Status

✅ Script paths fixed in `public/index.html`
✅ All functions exist in JavaScript files
✅ HTML onclick handlers are correct
✅ DOM elements have correct IDs

## Next Steps

1. Clear browser cache
2. Hard refresh the page (Ctrl+F5)
3. Open browser console (F12)
4. Check for any errors
5. Test each menu item

If still not working, check the browser console and report the exact error message.
