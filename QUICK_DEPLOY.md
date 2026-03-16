# Quick Deployment to Render (5 Minutes)

## Prerequisites
- GitHub account with your code pushed
- Render account (free at https://render.com)

## Step 1: Prepare Your Code (Already Done!)
✅ Environment variables configured
✅ .gitignore created
✅ server.js updated

## Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Click "Sign up"
3. Choose "GitHub" and authorize

### 2.2 Create Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
4. Select the repo with your HR Training System

### 2.3 Configure Service
Fill in these details:
- **Name**: `hr-training-system`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Plan**: `Free`

### 2.4 Add Environment Variables
Click "Environment" and add:
```
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_SERVER=your-azure-server.database.windows.net
DB_PORT=1433
DB_NAME=NSB_Training
NODE_ENV=production
```

### 2.5 Deploy
Click "Create Web Service" and wait for deployment!

## Step 3: Set Up Database (Azure SQL)

### 3.1 Create Azure SQL Database
1. Go to https://portal.azure.com
2. Click "Create a resource"
3. Search for "SQL Database"
4. Create new database:
   - **Server**: Create new
   - **Database name**: NSB_Training
   - **Pricing tier**: Free tier (12 months)

### 3.2 Get Connection String
1. Go to your SQL Database
2. Click "Connection strings"
3. Copy the connection string
4. Update Render environment variables with:
   - DB_SERVER (from connection string)
   - DB_USER (from connection string)
   - DB_PASSWORD (your password)

### 3.3 Run Database Setup
1. Download Azure Data Studio (free)
2. Connect to your Azure SQL Database
3. Run all SQL scripts from your project:
   - Create tables
   - Insert sample data

## Step 4: Test Your Deployment

### 4.1 Get Your App URL
- Go to Render dashboard
- Find your service
- Copy the URL (e.g., https://hr-training-system.onrender.com)

### 4.2 Test API
Open in browser:
```
https://hr-training-system.onrender.com/api/employees
```

Should return JSON with employee data!

### 4.3 Test Frontend
Open in browser:
```
https://hr-training-system.onrender.com
```

Should load your HR Training System!

## Troubleshooting

### Getting 404 Error?
- Check Render logs: Dashboard → Logs
- Make sure server.js is in root directory
- Verify package.json exists

### Database Connection Error?
- Check environment variables in Render
- Verify Azure SQL firewall allows Render IP
- Test connection string locally first

### Files Not Uploading?
- Render uses temporary storage
- Files deleted on app restart
- Solution: Use Azure Blob Storage instead

## Next Steps

1. ✅ Deploy to Render
2. ✅ Set up Azure SQL Database
3. ✅ Test your app
4. 📧 Share URL with team
5. 🔒 Set up authentication (optional)
6. 💾 Configure persistent file storage (optional)

## Cost

- **Render**: Free tier (750 hours/month)
- **Azure SQL**: Free tier (12 months)
- **Total**: $0/month for first year!

After free tier expires:
- Render: ~$7/month
- Azure SQL: ~$15/month
- Total: ~$22/month

## Support

- Render Docs: https://render.com/docs
- Azure SQL Docs: https://learn.microsoft.com/en-us/azure/azure-sql/
- Node.js Docs: https://nodejs.org/docs/

Good luck! 🚀
