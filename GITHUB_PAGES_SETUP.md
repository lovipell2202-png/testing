# Deploy Frontend to GitHub Pages

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create repository: `your-username.github.io` (replace with your username)
3. Clone it locally:
```bash
git clone https://github.com/your-username/your-username.github.io.git
cd your-username.github.io
```

## Step 2: Copy Frontend Files

Copy only the `public` folder contents to the root:

```bash
# Copy all files from public/ to root
cp -r public/* .

# Remove the public folder
rm -rf public
```

Your repo structure should look like:
```
your-username.github.io/
├── index.html
├── training-records.html
├── all-employees.html
├── exams/
│   ├── all-exams.html
│   └── take-exam.html
├── css/
│   ├── styles.css
│   ├── all-exams.css
│   └── ...
├── src/
│   ├── training-records.js
│   ├── all-employees.js
│   └── ...
├── dashboard/
│   └── dashboard.html
└── NSB-LOGO.png
```

## Step 3: Update API Calls (Important!)

Since GitHub Pages is static, you need to either:

### Option A: Use a Backend Service (Recommended)
Update all API calls to point to your backend server:

In `public/src/modules/data-loader.js` and other files, change:
```javascript
// OLD (won't work on GitHub Pages)
const response = await fetch('/api/employees');

// NEW (point to your backend)
const response = await fetch('https://your-backend.onrender.com/api/employees');
```

### Option B: Use Mock Data (Demo Only)
If you just want to demo the UI without a backend, use mock data.

## Step 4: Push to GitHub

```bash
git add .
git commit -m "Initial commit - HR Training System frontend"
git push origin main
```

## Step 5: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

GitHub will automatically deploy your site!

## Step 6: Access Your Site

Your site will be available at:
```
https://your-username.github.io
```

## Important Notes

⚠️ **API Calls Won't Work Without Backend**
- Database operations will fail
- File uploads won't work
- You need a backend server for full functionality

✅ **What Will Work**
- UI/UX display
- Form layouts
- Print preview
- Navigation

## Solution: Hybrid Approach

1. **Frontend**: GitHub Pages (free, fast)
2. **Backend**: Render or Railway (free tier available)

Update your API URLs to point to your backend:

```javascript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.onrender.com'
  : 'http://localhost:3001';

// Then use:
fetch(`${API_BASE}/api/employees`);
```

## Full Deployment Steps

### For Frontend Only (GitHub Pages):
1. Create `your-username.github.io` repo
2. Copy `public/` contents to root
3. Update API URLs to backend service
4. Push to GitHub
5. Enable Pages in Settings

### For Backend (Render):
1. Create separate repo for backend
2. Deploy to Render (see QUICK_DEPLOY.md)
3. Get your backend URL
4. Update frontend API URLs

## Example: Complete Setup

**Frontend URL**: `https://your-username.github.io`
**Backend URL**: `https://hr-training-system.onrender.com`

**In your JavaScript**:
```javascript
const API_URL = 'https://hr-training-system.onrender.com';

async function loadEmployees() {
  const response = await fetch(`${API_URL}/api/employees`);
  const data = await response.json();
  return data;
}
```

## Troubleshooting

### 404 Error on GitHub Pages?
- Make sure `index.html` is in root directory
- Check that all file paths are correct
- Verify CSS/JS files are loading (check browser console)

### API Calls Failing?
- Check browser console for CORS errors
- Make sure backend URL is correct
- Verify backend is running and accessible

### CSS/Images Not Loading?
- Use relative paths: `./css/styles.css`
- Not absolute paths: `/css/styles.css`
- Check file names match exactly (case-sensitive)

## Next Steps

1. ✅ Create GitHub Pages repo
2. ✅ Copy frontend files
3. ✅ Update API URLs
4. ✅ Push to GitHub
5. ✅ Enable Pages
6. ✅ Deploy backend separately
7. ✅ Test your app

Your site will be live in minutes! 🚀
