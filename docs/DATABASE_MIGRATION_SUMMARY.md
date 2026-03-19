# Database Migration Summary - Identification Items JSON

## What You Need to Do

Add the `identification_items_json` column to your database to store identification question items.

---

## Quick Start (Choose One)

### Option A: SQL Script (Easiest)
1. Open **SQL Server Management Studio**
2. Open file: `ADD_IDENTIFICATION_COLUMNS.sql`
3. Press **F5** to execute
4. Done! ✅

### Option B: Node.js Script
```bash
node add-identification-items-json.js
```

### Option C: Manual SQL
Run these queries in SQL Server Management Studio:
```sql
USE NSB_Training;
GO

ALTER TABLE ExamQuestions
ADD identification_items_json VARCHAR(MAX) NULL;

ALTER TABLE ExamQuestions
ADD identification_image_url VARCHAR(MAX) NULL;

ALTER TABLE ExamQuestions
ADD identification_title VARCHAR(200) NULL;

ALTER TABLE ExamQuestions
ADD identification_instruction VARCHAR(MAX) NULL;

ALTER TABLE ExamQuestions
ADD identification_answer VARCHAR(MAX) NULL;
```

---

## What Gets Added

| Column | Type | Purpose |
|--------|------|---------|
| `identification_items_json` | VARCHAR(MAX) | Stores items as JSON array |
| `identification_image_url` | VARCHAR(MAX) | Stores image file path |
| `identification_title` | VARCHAR(200) | Question title |
| `identification_instruction` | VARCHAR(MAX) | Question instructions |
| `identification_answer` | VARCHAR(MAX) | Concatenated answers |

---

## Example Data

After migration, your data will look like:

```sql
SELECT 
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
identification_title:      "Engine Components"
identification_instruction: "Identify the following parts"
identification_image_url:   "/uploads/images/identification_1710329400000.jpg"
identification_items_json:  "[
  {\"id\":1,\"number\":1,\"text\":\"Cylinder Head\",\"answer\":\"A\",\"points\":1},
  {\"id\":2,\"number\":2,\"text\":\"Piston\",\"answer\":\"B\",\"points\":1},
  {\"id\":3,\"number\":3,\"text\":\"Crankshaft\",\"answer\":\"C\",\"points\":1}
]"
```

---

## How It Works

### Creating an Exam
1. User creates identification question
2. Uploads image → saved to `public/uploads/images/`
3. Adds items (text + answer) → stored as JSON
4. Saves exam → data stored in database

### Taking an Exam
1. Question loaded from database
2. Image displayed from URL
3. Items parsed from JSON
4. Student answers each item
5. Answers compared with stored items
6. Score calculated

---

## Files Provided

| File | Purpose |
|------|---------|
| `ADD_IDENTIFICATION_COLUMNS.sql` | SQL script to add columns |
| `add-identification-items-json.js` | Node.js migration script |
| `HOW_TO_ADD_IDENTIFICATION_COLUMNS.md` | Step-by-step guide |
| `COMPLETE_DATABASE_SETUP.md` | Complete setup documentation |
| `IDENTIFICATION_ITEMS_SETUP.md` | Technical details |
| `IDENTIFICATION_SQL_QUERIES.md` | Useful SQL queries |
| `VERIFY_IDENTIFICATION_SETUP.md` | Verification checklist |

---

## Verification

After running migration, verify columns exist:

```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ExamQuestions' 
AND COLUMN_NAME LIKE 'identification%'
ORDER BY COLUMN_NAME;
```

Expected output:
```
identification_answer          VARCHAR
identification_image_url       VARCHAR
identification_instruction     VARCHAR
identification_items_json      VARCHAR
identification_title           VARCHAR
```

---

## Testing

1. ✅ Create identification question with image and items
2. ✅ Save exam
3. ✅ Check database for data
4. ✅ View exam - image and items should display
5. ✅ Take exam - image should show above items
6. ✅ Submit exam - scoring should work

---

## Troubleshooting

### "Column already exists"
- Normal message, column was already added
- You can proceed

### "Cannot connect to database"
- Check SQL Server is running
- Verify database name: `NSB_Training`
- Check credentials in script

### "Invalid object name 'ExamQuestions'"
- Make sure you're in correct database
- Run: `USE NSB_Training;` first

---

## Next Steps

1. Run migration (choose one method above)
2. Verify columns were added
3. Create test identification question
4. Upload test image
5. Add test items
6. Save and test

---

## Support

For detailed information, see:
- `HOW_TO_ADD_IDENTIFICATION_COLUMNS.md` - Step-by-step guide
- `COMPLETE_DATABASE_SETUP.md` - Complete documentation
- `IDENTIFICATION_SQL_QUERIES.md` - SQL query examples

---

## Summary

Your system is ready to:
- ✅ Store identification items as JSON
- ✅ Save images to disk
- ✅ Display images when taking exams
- ✅ Display items for students to answer
- ✅ Score identification questions

Just run the migration and you're done! 🎉
