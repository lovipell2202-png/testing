# How to Add Identification Items JSON Column to Your Database

You have two options to add the `identification_items_json` column to your database:

## Option 1: Using SQL Server Management Studio (Recommended for beginners)

### Step 1: Open SQL Server Management Studio
1. Open SQL Server Management Studio
2. Connect to your server (localhost)
3. Select your database: `NSB_Training`

### Step 2: Run the SQL Script
1. Click **File** → **Open** → **File**
2. Select `ADD_IDENTIFICATION_COLUMNS.sql`
3. Click **Execute** (or press F5)
4. Wait for the script to complete

### Step 3: Verify the Columns Were Added
You should see output like:
```
✅ Column identification_items_json added successfully
✅ Column identification_image_url already exists
✅ Column identification_title already exists
✅ Column identification_instruction already exists
✅ Column identification_answer already exists

📋 All Identification Columns in ExamQuestions Table:
================================================
identification_answer          VARCHAR(MAX)      NULL
identification_image_url       VARCHAR(MAX)      NULL
identification_instruction     VARCHAR(MAX)      NULL
identification_items_json      VARCHAR(MAX)      NULL
identification_title           VARCHAR(200)      NULL

✅ Database migration completed successfully!
```

---

## Option 2: Using Node.js Script

### Step 1: Update Database Credentials (if needed)
Edit `add-identification-items-json.js` and update:
```javascript
const config = {
  server: 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'YourPassword123!'  // ← Update if different
    }
  },
  options: {
    database: 'NSB_Training',
    trustServerCertificate: true,
    encrypt: true
  }
};
```

### Step 2: Run the Script
Open terminal/command prompt in your project directory and run:
```bash
node add-identification-items-json.js
```

### Step 3: Check Output
You should see:
```
✅ Connected to database
✅ Column identification_items_json added successfully
✅ Column identification_image_url already exists

✅ Identification columns in database:
   - identification_answer (VARCHAR)
   - identification_image_url (VARCHAR)
   - identification_instruction (VARCHAR)
   - identification_items_json (VARCHAR)
   - identification_title (VARCHAR)

✅ Database migration completed successfully!
```

---

## Option 3: Manual SQL Query

If you prefer to run individual queries:

### Step 1: Open SQL Server Management Studio
1. Connect to your database
2. Open a new query window

### Step 2: Run Each Query

**Add identification_items_json column:**
```sql
ALTER TABLE ExamQuestions
ADD identification_items_json VARCHAR(MAX) NULL;
```

**Add identification_image_url column (if not exists):**
```sql
ALTER TABLE ExamQuestions
ADD identification_image_url VARCHAR(MAX) NULL;
```

**Add identification_title column (if not exists):**
```sql
ALTER TABLE ExamQuestions
ADD identification_title VARCHAR(200) NULL;
```

**Add identification_instruction column (if not exists):**
```sql
ALTER TABLE ExamQuestions
ADD identification_instruction VARCHAR(MAX) NULL;
```

**Add identification_answer column (if not exists):**
```sql
ALTER TABLE ExamQuestions
ADD identification_answer VARCHAR(MAX) NULL;
```

### Step 3: Verify Columns Were Added
```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ExamQuestions' 
AND COLUMN_NAME LIKE 'identification%'
ORDER BY COLUMN_NAME;
```

---

## Verification

After running the migration, verify the columns exist:

```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ExamQuestions' 
AND COLUMN_NAME LIKE 'identification%'
ORDER BY COLUMN_NAME;
```

Expected result:
```
COLUMN_NAME                    DATA_TYPE    IS_NULLABLE
identification_answer          VARCHAR      YES
identification_image_url       VARCHAR      YES
identification_instruction     VARCHAR      YES
identification_items_json      VARCHAR      YES
identification_title           VARCHAR      YES
```

---

## What Each Column Does

| Column | Purpose | Example |
|--------|---------|---------|
| `identification_title` | Question title | "Engine Components" |
| `identification_instruction` | Instructions for the question | "Identify the following parts" |
| `identification_image_url` | Path to uploaded image | "/uploads/images/identification_1710329400000.jpg" |
| `identification_answer` | Concatenated answers | "A \| B \| C" |
| `identification_items_json` | Items as JSON array | `[{"id":1,"text":"Cylinder","answer":"A"}]` |

---

## Example Data After Migration

Once the columns are added, your data will look like:

```sql
SELECT 
    id,
    identification_title,
    identification_instruction,
    identification_image_url,
    identification_items_json
FROM ExamQuestions
WHERE question_type = 'identification'
LIMIT 1;
```

Result:
```
id: 1
identification_title: "Engine Parts"
identification_instruction: "Identify the following engine components"
identification_image_url: "/uploads/images/identification_1710329400000.jpg"
identification_items_json: "[
  {\"id\":1,\"number\":1,\"text\":\"Cylinder Head\",\"answer\":\"A\",\"points\":1},
  {\"id\":2,\"number\":2,\"text\":\"Piston\",\"answer\":\"B\",\"points\":1},
  {\"id\":3,\"number\":3,\"text\":\"Crankshaft\",\"answer\":\"C\",\"points\":1}
]"
```

---

## Troubleshooting

### Error: "Column already exists"
This means the column was already added. You can safely ignore this error.

### Error: "Invalid object name 'ExamQuestions'"
Make sure you're connected to the correct database: `NSB_Training`

### Error: "Login failed"
Update the credentials in the script to match your SQL Server login.

### Error: "Cannot connect to server"
Make sure:
1. SQL Server is running
2. Server name is correct (usually `localhost` or `.`)
3. Database name is correct (`NSB_Training`)

---

## Next Steps

After adding the columns:

1. ✅ Create an identification question with items
2. ✅ Upload an image
3. ✅ Save the exam
4. ✅ Verify data in database:
   ```sql
   SELECT identification_items_json, identification_image_url
   FROM ExamQuestions
   WHERE question_type = 'identification'
   ORDER BY id DESC
   LIMIT 1;
   ```
5. ✅ View the exam - image and items should display
6. ✅ Take the exam - image should show above items

---

## Rollback (if needed)

If you need to remove the columns:

```sql
ALTER TABLE ExamQuestions
DROP COLUMN identification_items_json;

ALTER TABLE ExamQuestions
DROP COLUMN identification_image_url;
```

But this is not recommended as it will lose data!

---

## Support

If you encounter any issues:

1. Check the error message carefully
2. Verify database connection
3. Ensure you're using the correct database name
4. Check SQL Server is running
5. Review the troubleshooting section above
