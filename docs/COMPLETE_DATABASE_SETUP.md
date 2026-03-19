# Complete Database Setup for Identification Items

## Quick Start

Choose one method below to add the identification columns to your database:

### Method 1: SQL Script (Fastest)
```bash
# In SQL Server Management Studio:
# 1. Open ADD_IDENTIFICATION_COLUMNS.sql
# 2. Press F5 to execute
# 3. Done!
```

### Method 2: Node.js Script
```bash
node add-identification-items-json.js
```

### Method 3: Manual SQL
Copy and paste the SQL queries from `IDENTIFICATION_SQL_QUERIES.md`

---

## Database Schema

### ExamQuestions Table - Identification Columns

```sql
CREATE TABLE ExamQuestions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    course_id BIGINT NULL,
    question_number INT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_text VARCHAR(MAX) NOT NULL,
    
    -- Identification Question Columns
    identification_title VARCHAR(200) NULL,
    identification_instruction VARCHAR(MAX) NULL,
    identification_image_url VARCHAR(MAX) NULL,
    identification_answer VARCHAR(MAX) NULL,
    identification_items_json VARCHAR(MAX) NULL,
    
    -- Other columns...
    points INT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (exam_id) REFERENCES Exams(id) ON DELETE CASCADE
);
```

---

## Column Descriptions

### identification_title
- **Type:** VARCHAR(200)
- **Purpose:** Title/name of the identification question
- **Example:** "Engine Components"
- **Nullable:** Yes

### identification_instruction
- **Type:** VARCHAR(MAX)
- **Purpose:** Instructions for answering the question
- **Example:** "Identify the following parts of the engine"
- **Nullable:** Yes

### identification_image_url
- **Type:** VARCHAR(MAX)
- **Purpose:** URL path to the reference image
- **Example:** "/uploads/images/identification_1710329400000.jpg"
- **Nullable:** Yes
- **Storage:** Images saved to `public/uploads/images/`

### identification_answer
- **Type:** VARCHAR(MAX)
- **Purpose:** Concatenated correct answers separated by " | "
- **Example:** "A | B | C"
- **Nullable:** Yes

### identification_items_json
- **Type:** VARCHAR(MAX)
- **Purpose:** JSON array of identification items
- **Example:** See below
- **Nullable:** Yes
- **Format:** JSON array with objects containing: id, number, text, answer, points

---

## JSON Format for identification_items_json

### Structure
```json
[
  {
    "id": 1,
    "number": 1,
    "text": "Item text or label",
    "answer": "CORRECT_ANSWER",
    "points": 1
  },
  {
    "id": 2,
    "number": 2,
    "text": "Another item",
    "answer": "ANOTHER_ANSWER",
    "points": 1
  }
]
```

### Real Example
```json
[
  {
    "id": 1,
    "number": 1,
    "text": "Cylinder Head",
    "answer": "A",
    "points": 1
  },
  {
    "id": 2,
    "number": 2,
    "text": "Piston",
    "answer": "B",
    "points": 1
  },
  {
    "id": 3,
    "number": 3,
    "text": "Crankshaft",
    "answer": "C",
    "points": 1
  }
]
```

---

## Data Flow

### Creating an Identification Question

```
Frontend (all-exams.js)
    ↓
User fills form:
  - Title: "Engine Parts"
  - Instruction: "Identify the following"
  - Upload image: engine.jpg
  - Add items: [{text: "Cylinder", answer: "A"}, ...]
    ↓
saveQuestion() stores in idItemsArray
    ↓
saveExam() converts to JSON:
  {
    type: 'identification',
    title: 'Engine Parts',
    instruction: 'Identify the following',
    image_base64: 'data:image/jpeg;base64,...',
    items: [{text: 'Cylinder', answer: 'A'}, ...],
    items_json: '[{...}]'
  }
    ↓
Backend (exam-server.js)
    ↓
createExam() processes:
  - image_base64 → saveBase64Image() → /uploads/images/identification_1710329400000.jpg
  - items → JSON.stringify() → identification_items_json
    ↓
Database Insert:
  INSERT INTO ExamQuestions (
    identification_title,
    identification_instruction,
    identification_image_url,
    identification_items_json,
    identification_answer
  ) VALUES (
    'Engine Parts',
    'Identify the following',
    '/uploads/images/identification_1710329400000.jpg',
    '[{"id":1,"number":1,"text":"Cylinder","answer":"A","points":1}]',
    'A | B | C'
  )
```

---

## Taking an Exam

### Data Retrieval Flow

```
Frontend (take-exam.js)
    ↓
loadExamQuestions() fetches from API
    ↓
Backend returns:
  {
    identification_image_url: '/uploads/images/identification_1710329400000.jpg',
    identification_items_json: '[{...}]'
  }
    ↓
displayQuestion() processes:
  - Parse JSON: items = JSON.parse(identification_items_json)
  - Display image: <img src="identification_image_url">
  - Display items: items.forEach(item => { ... })
    ↓
Student answers each item
    ↓
submitExam() compares answers with items
    ↓
Score calculated and saved
```

---

## Backup & Restore

### Backup Identification Questions

```sql
-- Backup to new table
SELECT *
INTO ExamQuestions_Backup_20240313
FROM ExamQuestions
WHERE question_type = 'identification';

-- Verify backup
SELECT COUNT(*) as backup_count
FROM ExamQuestions_Backup_20240313;
```

### Restore from Backup

```sql
-- Restore specific question
INSERT INTO ExamQuestions (
    course_id, question_number, question_type, question_text,
    identification_title, identification_instruction,
    identification_image_url, identification_answer,
    identification_items_json, points, created_at
)
SELECT 
    course_id, question_number, question_type, question_text,
    identification_title, identification_instruction,
    identification_image_url, identification_answer,
    identification_items_json, points, GETDATE()
FROM ExamQuestions_Backup_20240313
WHERE id = [QUESTION_ID];
```

---

## Validation Queries

### Check All Columns Exist
```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ExamQuestions' 
AND COLUMN_NAME LIKE 'identification%'
ORDER BY COLUMN_NAME;
```

### Validate JSON Format
```sql
SELECT 
    id,
    identification_title,
    CASE 
        WHEN ISJSON(identification_items_json) = 1 THEN 'Valid'
        ELSE 'Invalid'
    END as json_status
FROM ExamQuestions
WHERE question_type = 'identification';
```

### Check Data Integrity
```sql
SELECT 
    id,
    identification_title,
    CASE 
        WHEN identification_image_url IS NULL THEN 'Missing Image'
        ELSE 'Has Image'
    END as image_status,
    CASE 
        WHEN identification_items_json IS NULL THEN 'Missing Items'
        ELSE 'Has Items'
    END as items_status
FROM ExamQuestions
WHERE question_type = 'identification';
```

---

## Performance Optimization

### Create Index
```sql
IF NOT EXISTS (SELECT * FROM sys.indexes 
  WHERE name = 'idx_identification_questions')
BEGIN
  CREATE INDEX idx_identification_questions 
  ON ExamQuestions(question_type, course_id)
  WHERE question_type = 'identification';
END
```

### Check Index Usage
```sql
SELECT 
    OBJECT_NAME(i.object_id) as table_name,
    i.name as index_name,
    s.user_seeks,
    s.user_scans,
    s.user_lookups
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s 
    ON i.object_id = s.object_id 
    AND i.index_id = s.index_id
WHERE OBJECT_NAME(i.object_id) = 'ExamQuestions'
ORDER BY s.user_seeks DESC;
```

---

## Troubleshooting

### Issue: "Column already exists"
**Solution:** This is normal. The column was already added. You can proceed.

### Issue: "Invalid JSON"
**Solution:** Ensure items are properly formatted:
```javascript
// Correct format
items_json: JSON.stringify([
  {id: 1, number: 1, text: "Item", answer: "A", points: 1}
])

// Incorrect format
items_json: "[{id: 1, ...}]"  // Missing quotes around keys
```

### Issue: "Image not displaying"
**Solution:** 
1. Check image file exists: `ls public/uploads/images/`
2. Verify URL in database: `SELECT identification_image_url FROM ExamQuestions`
3. Check file permissions: `chmod 644 public/uploads/images/*`

### Issue: "Items not parsing"
**Solution:**
1. Verify JSON is valid: `SELECT ISJSON(identification_items_json) FROM ExamQuestions`
2. Check items have required fields: `id`, `number`, `text`, `answer`
3. Test parsing: `JSON.parse(identification_items_json)`

---

## Migration Checklist

- [ ] Run migration script (SQL or Node.js)
- [ ] Verify columns exist in database
- [ ] Check `public/uploads/images/` directory exists
- [ ] Create test identification question
- [ ] Upload test image
- [ ] Add test items
- [ ] Save exam
- [ ] Verify data in database
- [ ] View exam - check image and items display
- [ ] Take exam - check image and items display
- [ ] Submit exam - check scoring works

---

## Files Provided

1. **ADD_IDENTIFICATION_COLUMNS.sql** - SQL script to add columns
2. **add-identification-items-json.js** - Node.js migration script
3. **IDENTIFICATION_SQL_QUERIES.md** - Useful SQL queries
4. **IDENTIFICATION_ITEMS_SETUP.md** - Technical setup guide
5. **VERIFY_IDENTIFICATION_SETUP.md** - Verification checklist
6. **HOW_TO_ADD_IDENTIFICATION_COLUMNS.md** - Step-by-step guide
7. **COMPLETE_DATABASE_SETUP.md** - This file

---

## Next Steps

1. Choose a migration method (SQL, Node.js, or manual)
2. Run the migration
3. Verify columns were added
4. Test creating an identification question
5. Test taking an exam with identification questions
6. Review the verification checklist

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the verification checklist
3. Check database logs
4. Review browser console for errors
5. Check server logs for API errors
