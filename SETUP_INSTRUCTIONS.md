# Database Setup Instructions for Linux

Since you're on Linux, `sqlcmd` is not available. Follow these steps to set up the MS SQL 2019 database:

## Prerequisites

1. **MS SQL Server 2019** running (via Docker or local installation)
2. **Azure Data Studio** installed (for GUI management)
3. **Node.js** installed (you already have this)

---

## Step 1: Verify SQL Server is Running

Check if SQL Server is accessible:

```bash
# Test connection (you'll need sqlcmd or another tool)
# Or just proceed to Step 2 and the setup script will tell you if it's not running
```

---

## Step 2: Update Database Credentials

Edit `setup-database.js` and update the password to match your SQL Server:

```javascript
const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',  // ← Change this to your actual password
  server: 'localhost',
  port: 1433,
  // ... rest of config
};
```

Also update `server.js` with the same credentials:

```javascript
const dbConfig = {
  user: 'sa',
  password: 'YourPassword123!',  // ← Change this to your actual password
  server: 'localhost',
  port: 1433,
  database: 'NSB_Training',
  // ... rest of config
};
```

---

## Step 3: Install Dependencies

Make sure all npm packages are installed:

```bash
npm install
```

---

## Step 4: Run Database Setup Script

Execute the setup script to create the database and tables:

```bash
node setup-database.js
```

You should see output like:

```
🔄 Connecting to SQL Server...
✅ Connected to SQL Server
🔄 Running 15 SQL batches...
✅ Batch 1/15 completed
✅ Batch 2/15 completed
... (more batches)
✅ Database setup completed successfully!

📊 Database Summary:
   - Employees: 6
   - Training Records: 20

👥 Employees:
   - 000001: ABENOJAR, CHRISTOPHER
   - 000002: CREDO, RYAN
   - 000003: SANTOS, MARIA
   - 000004: REYES, JUAN
   - 000005: GARCIA, ANNA
   - 000006: TORRES, LUIS
```

---

## Step 5: Start the Server

Now start the application:

```bash
npm start
```

You should see:

```
✅ Connected to MS SQL Server database
🚀 Server running at http://localhost:3000
```

---

## Step 6: Open in Browser

Open your browser and go to:

```
http://localhost:3000
```

You should see the dashboard with all employees and training records loaded from the database!

---

## Troubleshooting

### Error: "Cannot connect to server"

**Solution**: Make sure SQL Server is running. If using Docker:

```bash
docker ps  # Check if SQL Server container is running
```

### Error: "Login failed for user 'sa'"

**Solution**: Check your password in both `setup-database.js` and `server.js`. Make sure it matches your SQL Server password.

### Error: "Database already exists"

**Solution**: The database was already created. You can:
- Just proceed (the app will work fine)
- Or drop and recreate it:

```bash
# In Azure Data Studio, run:
DROP DATABASE NSB_Training;
```

Then run `node setup-database.js` again.

### Error: "Port 3000 already in use"

**Solution**: Kill the process using port 3000:

```bash
lsof -i :3000  # Find the process
kill -9 <PID>  # Kill it
```

Then run `npm start` again.

---

## Verify Database Connection

Once the server is running, you can verify the database is working by:

1. Opening the app at `http://localhost:3000`
2. Checking the dashboard - it should show:
   - Total Employees: 6
   - Total Training Records: 20
   - Statistics and charts

3. Or check in Azure Data Studio:
   - Connect to your SQL Server
   - Expand Databases → NSB_Training
   - You should see `Employees` and `TrainingRecords` tables

---

## Next Steps

- Add new employees using the "New Employee" button
- Add training records for employees
- Use the dashboard to view statistics
- Export/print records in A4 landscape format

Enjoy using the Employee Training Record System!
