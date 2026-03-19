# SQL Queries for Identification Items Management

## View All Identification Questions

```sql
SELECT 
  id,
  course_id,
  question_number,
  identification_title,
  identification_instruction,
  identification_image_url,
  identification_answer,
  identification_items_json,
  points,
  created_at
FROM ExamQuestions
WHERE question_type = 'identification'
ORDER BY created_at DESC;
```

## View Specific Identification Question with Formatted JSON

```sql
SELECT 
  id,
  identification_title,
  identification_instruction,
  identification_image_url,
  identification_items_json,
  points
FROM ExamQuestions
WHERE question_type = 'identification'
AND id = [QUESTION_ID];
```

## Count Identification Questions by Course

```sql
SELECT 
  c.course_title,
  COUNT(eq.id) as identification_count
FROM Courses c
LEFT JOIN ExamQuestions eq ON c.id = eq.course_id 
  AND eq.question_type = 'identification'
GROUP BY c.course_title
ORDER BY identification_count DESC;
```

## Find Questions with Missing Images

```sql
SELECT 
  id,
  identification_title,
  identification_image_url,
  created_at
FROM ExamQuestions
WHERE question_type = 'identification'
AND (identification_image_url IS NULL OR identification_image_url = '')
ORDER BY created_at DESC;
```

## Find Questions with Missing Items

```sql
SELECT 
  id,
  identification_title,
  identification_items_json,
  created_at
FROM ExamQuestions
WHERE question_type = 'identification'
AND (identification_items_json IS NULL 
     OR identification_items_json = '' 
     OR identification_items_json = '[]')
ORDER BY created_at DESC;
```

## Update Image URL (if needed)

```sql
UPDATE ExamQuestions
SET identification_image_url = '/uploads/images/new_image.jpg'
WHERE id = [QUESTION_ID]
AND question_type = 'identification';
```

## Update Items JSON (if needed)

```sql
UPDATE ExamQuestions
SET identification_items_json = '[
  {"id":1,"number":1,"text":"Item 1","answer":"A","points":1},
  {"id":2,"number":2,"text":"Item 2","answer":"B","points":1}
]'
WHERE id = [QUESTION_ID]
AND question_type = 'identification';
```

## Delete Identification Question

```sql
DELETE FROM ExamQuestions
WHERE id = [QUESTION_ID]
AND question_type = 'identification';
```

## Get Statistics on Identification Questions

```sql
SELECT 
  COUNT(*) as total_identification_questions,
  COUNT(CASE WHEN identification_image_url IS NOT NULL 
    AND identification_image_url != '' THEN 1 END) as with_images,
  COUNT(CASE WHEN identification_items_json IS NOT NULL 
    AND identification_items_json != '[]' THEN 1 END) as with_items,
  AVG(points) as avg_points
FROM ExamQuestions
WHERE question_type = 'identification';
```

## Export Identification Questions to CSV Format

```sql
SELECT 
  id,
  course_id,
  question_number,
  identification_title,
  identification_instruction,
  identification_image_url,
  identification_answer,
  identification_items_json,
  points,
  created_at
FROM ExamQuestions
WHERE question_type = 'identification'
ORDER BY course_id, question_number;
```

## Check Image File Paths

```sql
SELECT 
  DISTINCT identification_image_url
FROM ExamQuestions
WHERE question_type = 'identification'
AND identification_image_url IS NOT NULL
AND identification_image_url != ''
ORDER BY identification_image_url;
```

## Validate JSON Format

```sql
SELECT 
  id,
  identification_title,
  CASE 
    WHEN ISJSON(identification_items_json) = 1 THEN 'Valid JSON'
    ELSE 'Invalid JSON'
  END as json_status,
  identification_items_json
FROM ExamQuestions
WHERE question_type = 'identification'
AND identification_items_json IS NOT NULL;
```

## Get Items Count from JSON

```sql
SELECT 
  id,
  identification_title,
  JSON_VALUE(identification_items_json, '$[0].text') as first_item,
  JSON_QUERY(identification_items_json) as all_items
FROM ExamQuestions
WHERE question_type = 'identification'
AND ISJSON(identification_items_json) = 1;
```

## Find Questions by Course Title

```sql
SELECT 
  eq.id,
  eq.identification_title,
  eq.identification_instruction,
  eq.identification_image_url,
  eq.identification_items_json,
  c.course_title
FROM ExamQuestions eq
JOIN Courses c ON eq.course_id = c.id
WHERE c.course_title = '[COURSE_TITLE]'
AND eq.question_type = 'identification'
ORDER BY eq.question_number;
```

## Backup Identification Questions

```sql
SELECT 
  id,
  course_id,
  question_number,
  question_type,
  question_text,
  identification_title,
  identification_instruction,
  identification_image_url,
  identification_answer,
  identification_items_json,
  points,
  created_at
INTO ExamQuestions_Backup_[DATE]
FROM ExamQuestions
WHERE question_type = 'identification';
```

## Check for Duplicate Items in Questions

```sql
SELECT 
  id,
  identification_title,
  identification_items_json,
  COUNT(*) as duplicate_count
FROM ExamQuestions
WHERE question_type = 'identification'
GROUP BY identification_items_json
HAVING COUNT(*) > 1;
```

## Get Questions with Most Items

```sql
SELECT TOP 10
  id,
  identification_title,
  JSON_QUERY(identification_items_json) as items,
  JSON_QUERY(identification_items_json, 'lax $.length()') as item_count,
  points
FROM ExamQuestions
WHERE question_type = 'identification'
AND ISJSON(identification_items_json) = 1
ORDER BY JSON_QUERY(identification_items_json, 'lax $.length()') DESC;
```

## Verify Data Integrity

```sql
SELECT 
  id,
  identification_title,
  CASE 
    WHEN identification_image_url IS NULL OR identification_image_url = '' 
      THEN 'Missing Image'
    ELSE 'Has Image'
  END as image_status,
  CASE 
    WHEN identification_items_json IS NULL OR identification_items_json = '[]'
      THEN 'Missing Items'
    ELSE 'Has Items'
  END as items_status,
  CASE 
    WHEN identification_answer IS NULL OR identification_answer = ''
      THEN 'Missing Answer'
    ELSE 'Has Answer'
  END as answer_status
FROM ExamQuestions
WHERE question_type = 'identification'
ORDER BY id DESC;
```

## Clean Up Orphaned Images (if needed)

First, get list of images in database:
```sql
SELECT DISTINCT 
  REPLACE(identification_image_url, '/uploads/images/', '') as filename
FROM ExamQuestions
WHERE question_type = 'identification'
AND identification_image_url IS NOT NULL
AND identification_image_url != ''
ORDER BY filename;
```

Then compare with actual files in `public/uploads/images/` directory.

## Export Items from JSON

```sql
SELECT 
  eq.id as question_id,
  eq.identification_title,
  JSON_VALUE(item, '$.number') as item_number,
  JSON_VALUE(item, '$.text') as item_text,
  JSON_VALUE(item, '$.answer') as item_answer,
  JSON_VALUE(item, '$.points') as item_points
FROM ExamQuestions eq
CROSS APPLY JSON_TABLE(
  identification_items_json,
  '$[*]' COLUMNS (
    number INT '$.number',
    text NVARCHAR(MAX) '$.text',
    answer NVARCHAR(MAX) '$.answer',
    points INT '$.points'
  )
) AS item
WHERE eq.question_type = 'identification'
ORDER BY eq.id, item_number;
```

## Performance: Index Check

```sql
SELECT 
  OBJECT_NAME(i.object_id) as table_name,
  i.name as index_name,
  s.user_updates,
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

## Create Index for Better Performance (if needed)

```sql
IF NOT EXISTS (SELECT * FROM sys.indexes 
  WHERE name = 'idx_identification_questions')
BEGIN
  CREATE INDEX idx_identification_questions 
  ON ExamQuestions(question_type, course_id)
  WHERE question_type = 'identification';
END
```
