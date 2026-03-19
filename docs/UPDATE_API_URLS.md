# Update API URLs for GitHub Pages

Since GitHub Pages is static hosting, you need to update all API calls to point to your backend server.

## Quick Fix

### Option 1: Create API Configuration File

Create `public/src/config.js`:

```javascript
// API Configuration
const API_CONFIG = {
  // For local development
  development: 'http://localhost:3001',
  
  // For production (GitHub Pages)
  production: 'https://your-backend.onrender.com'
};

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

const API_BASE_URL = isDevelopment 
  ? API_CONFIG.development 
  : API_CONFIG.production;

// Export for use in other files
window.API_BASE_URL = API_BASE_URL;
```

### Option 2: Update All API Calls

Find and replace in your JavaScript files:

**Before:**
```javascript
fetch('/api/employees')
fetch('/api/trainings')
fetch('/api/exams')
```

**After:**
```javascript
fetch(`${API_BASE_URL}/api/employees`)
fetch(`${API_BASE_URL}/api/trainings`)
fetch(`${API_BASE_URL}/api/exams`)
```

## Files to Update

### 1. `public/src/modules/data-loader.js`
```javascript
// OLD
const response = await fetch('/api/employees');

// NEW
const response = await fetch(`${API_BASE_URL}/api/employees`);
```

### 2. `public/src/modules/training-manager.js`
```javascript
// OLD
const response = await fetch('/api/trainings');

// NEW
const response = await fetch(`${API_BASE_URL}/api/trainings`);
```

### 3. `public/src/all-exams.js`
```javascript
// OLD
const response = await fetch('/api/exams');

// NEW
const response = await fetch(`${API_BASE_URL}/api/exams`);
```

### 4. `public/src/upload-test-result.js`
```javascript
// OLD
const response = await fetch('/api/tests/upload', {

// NEW
const response = await fetch(`${API_BASE_URL}/api/tests/upload`, {
```

## Step-by-Step Instructions

### Step 1: Add Config File

Create `public/src/config.js` with the content above.

### Step 2: Include Config in HTML

Add this to the `<head>` of all HTML files BEFORE other scripts:

```html
<script src="src/config.js"></script>
```

Example in `public/index.html`:
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HR Training Management System</title>
  
  <!-- Add this line -->
  <script src="src/config.js"></script>
  
  <!-- Other scripts -->
  <script src="src/modules/ui-helpers.js"></script>
  ...
</head>
```

### Step 3: Update All fetch() Calls

Use find and replace in your editor:

**Find**: `fetch('/api/`
**Replace**: `fetch(\`${API_BASE_URL}/api/`

### Step 4: Test Locally

1. Start your backend: `node server.js`
2. Open `http://localhost:3001` in browser
3. Test that API calls work

### Step 5: Deploy to GitHub Pages

1. Update `API_CONFIG.production` with your backend URL
2. Push to GitHub
3. Test at `https://your-username.github.io`

## Example: Complete Update

### Before (Won't work on GitHub Pages):
```javascript
// public/src/all-employees.js
async function loadEmployees() {
  const response = await fetch('/api/employees');
  const data = await response.json();
  return data;
}
```

### After (Works everywhere):
```javascript
// public/src/all-employees.js
async function loadEmployees() {
  const response = await fetch(`${API_BASE_URL}/api/employees`);
  const data = await response.json();
  return data;
}
```

## Verification Checklist

- [ ] Created `public/src/config.js`
- [ ] Added `<script src="src/config.js"></script>` to all HTML files
- [ ] Updated all `fetch('/api/` calls to use `API_BASE_URL`
- [ ] Tested locally with backend running
- [ ] Updated `API_CONFIG.production` URL
- [ ] Pushed to GitHub
- [ ] Tested on GitHub Pages URL

## Troubleshooting

### CORS Error?
Make sure your backend has CORS enabled:
```javascript
app.use(cors());
```

### 404 on API calls?
- Check that backend URL is correct
- Verify backend is running
- Check browser console for exact error

### Works locally but not on GitHub Pages?
- Make sure `API_CONFIG.production` has correct URL
- Check that backend is accessible from internet
- Verify CORS headers are set

## Support

- GitHub Pages Docs: https://pages.github.com
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
