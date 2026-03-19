# Deployment Guide for HR Training Management System

## Current Setup
- **Backend**: Node.js + Express
- **Database**: MSSQL Server (SQL Server)
- **Frontend**: Static HTML/CSS/JS
- **Issue**: GitHub Pages only hosts static files, not Node.js apps

## Recommended Deployment: Render + Azure SQL

### Option 1: Render (Recommended for Free Tier)

#### Step 1: Prepare Your Project

1. Create a `.gitignore` file:
```
node_modules/
.env
*.log
uploads/
```

2. Create `.env` file (don't commit this):
```
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_SERVER=your-server.database.windows.net
DB_PORT=1433
DB_NAME=NSB_Training
PORT=3001
NODE_ENV=production
```

3. Update `server.js` to use environment variables:
```javascript
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
};
```

4. Create `package.json` if not exists:
```json
{
  "name": "hr-training-system",
  "version": "1.0.0",
  "description": "HR Training Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mssql": "^9.1.1",
    "multer": "^1.4.5-lts.1"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### Step 2: Deploy to Render

1. Push your code to GitHub
2. Go to https://render.com and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Fill in the details:
   - **Name**: hr-training-system
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

6. Add Environment Variables:
   - Click "Environment"
   - Add all variables from `.env` file

7. Deploy!

#### Step 3: Database Setup

For the database, you have options:

**Option A: Azure SQL (Recommended)**
- Free tier available
- Managed SQL Server
- Easy to scale

**Option B: Keep Local Database**
- Use ngrok to expose local database
- Not recommended for production

### Option 2: Railway (Alternative)

1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project
4. Add your GitHub repo
5. Add environment variables
6. Deploy

### Option 3: Heroku (Limited Free Tier)

Heroku's free tier is limited now, but still available:
1. Go to https://www.heroku.com
2. Create account
3. Install Heroku CLI
4. Run: `heroku create your-app-name`
5. Set environment variables: `heroku config:set DB_USER=...`
6. Deploy: `git push heroku main`

## Database Migration

### For Azure SQL:

1. Create Azure SQL Database:
   - Go to https://portal.azure.com
   - Create "SQL Database"
   - Note the connection string

2. Run migration scripts:
   - Connect to Azure SQL
   - Run all SQL scripts from your project

3. Update connection string in environment variables

## Testing Deployment

After deployment:

1. Test API endpoints:
```bash
curl https://your-app.onrender.com/api/employees
```

2. Check logs:
   - Render: Dashboard → Logs
   - Railway: Logs tab
   - Heroku: `heroku logs --tail`

## Troubleshooting

### 404 Error
- Make sure `app.get('/', ...)` is configured
- Check that `public/` folder is included

### Database Connection Error
- Verify environment variables are set
- Check database firewall rules
- Ensure connection string is correct

### File Upload Issues
- Render uses ephemeral storage (files deleted on restart)
- Use cloud storage (AWS S3, Azure Blob) instead
- Or use database to store files

## Next Steps

1. Choose hosting platform (Render recommended)
2. Set up database (Azure SQL recommended)
3. Update environment variables
4. Deploy and test
5. Monitor logs for errors

## Cost Estimate

- **Render**: Free tier (750 hours/month)
- **Azure SQL**: Free tier (12 months)
- **Total**: $0/month for first year

After free tier:
- Render: ~$7/month
- Azure SQL: ~$15/month
- Total: ~$22/month
