# Verification Checklist for Identification Items & Images

## ✅ Database Setup
- [x] `identification_items_json` column exists in ExamQuestions table
- [x] `identification_image_url` column exists in ExamQuestions table
- [x] Both columns are VARCHAR(MAX) type

## ✅ Backend (exam-server.js)
- [x] `saveBase64Image()` function converts base64 to file and saves to `public/uploads/images/`
- [x] `createExam()` saves identification items as JSON: `JSON.stringify(q.items || [])`
- [x] `updateExam()` saves identification items as JSON: `JSON.stringify(q.items || [])`
- [x] `getExamById()` retrieves `identification_items_json` and `identification_image_url`
- [x] Routes configured in server.js:
  - POST /api/exams
  - PUT /api/exams/:id
  - GET /api/exams/:id

## ✅ Frontend (all-exams.js)
- [x] `handleIdImageUpload()` captures image as base64
- [x] `addIdItem()` adds items to `idItemsArray`
- [x] `saveQuestion()` stores items in question object
- [x] `saveExam()` converts items to JSON: `items_json: JSON.stringify(q.items || [])`
- [x] `loadExamQuestions()` parses `identification_items_json` when loading for edit

## ✅ Frontend (take-exam.js)
- [x] `displayQuestion()` parses `identification_items_json`
- [x] `displayQuestion()` displays image from `identification_image_url`
- [x] `updateIdentificationAnswer()` captures student answers

## 📋 Step-by-Step Verification

### 1. Check Database Columns
```sql
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ExamQuestions' 
AND COLUMN_NAME LIKE 'identification%'
```

Expected output:
```
identification_title          VARCHAR
identification_instruction    VARCHAR
identification_image_url      VARCHAR
identification_answer         VARCHAR
identification_items_json     VARCHAR
```

### 2. Check Uploads Directory
```bash
ls -la public/uploads/images/
```

Should show:
- Directory exists and is writable
- Images will appear here after upload (format: `identification_[timestamp].[ext]`)

### 3. Test Creating an Identification Question

1. Go to exam creation page
2. Select "Identification" question type
3. Fill in:
   - Title: "Engine Parts"
   - Instruction: "Identify the following"
   - Upload an image
   - Add 2-3 items with text and answers
4. Save the exam
5. Check browser console for debug logs

### 4. Verify Database Entry
```sql
SELECT 
  identification_title,
  identification_instruction,
  identification_image_url,
  identification_items_json
FROM ExamQuestions 
WHERE question_type = 'identification'
ORDER BY id DESC
LIMIT 1
```

Expected output:
```
identification_title:      "Engine Parts"
identification_instruction: "Identify the following"
identification_image_url:   "/uploads/images/identification_1710329400000.jpg"
identification_items_json:  "[{\"id\":1,\"number\":1,\"text\":\"Cylinder\",\"answer\":\"A\",\"points\":1}]"
```

### 5. Test Viewing Exam
1. Go to "View Exam"
2. Select the identification question
3. Verify:
   - Image displays correctly
   - Items are listed with text
   - Answers are shown (for admin view)

### 6. Test Taking Exam
1. Go to "Take Exam"
2. Select employee and exam
3. Navigate to identification question
4. Verify:
   - Image displays above items
   - Each item has an input field
   - Can type answers in uppercase

### 7. Check Console Logs
Open browser DevTools (F12) and check Console tab for:
- `[DEBUG] Identification question converted:` - shows items being sent
- `[DEBUG] Identification question inserted successfully with image URL:` - shows image saved

## 🔧 Troubleshooting

### Issue: Image not saving
**Check:**
1. `public/uploads/images/` directory exists
2. Directory has write permissions: `chmod 755 public/uploads/images/`
3. Browser console shows base64 data in image_base64 field
4. Server logs show image URL being generated

**Fix:**
```bash
mkdir -p public/uploads/images
chmod 755 public/uploads/images
```

### Issue: Items not saving to database
**Check:**
1. Browser console shows `items_json` in the request
2. Server logs show `[DEBUG] Identification question converted:`
3. Database column `identification_items_json` is not NULL

**Fix:**
- Verify items are added before saving
- Check that each item has both text and answer
- Ensure items array is not empty

### Issue: Items not displaying when taking exam
**Check:**
1. Database has data in `identification_items_json`
2. Browser console shows parsed items
3. `JSON.parse()` doesn't throw error

**Fix:**
- Verify JSON is valid: `JSON.parse(identification_items_json)`
- Check that items have `text` and `answer` properties

### Issue: Image not displaying in take exam
**Check:**
1. Database has URL in `identification_image_url`
2. Image file exists at that path
3. URL is accessible: visit `/uploads/images/[filename]` in browser

**Fix:**
- Verify image was saved to disk
- Check file permissions: `chmod 644 public/uploads/images/*`
- Verify URL path is correct

## 📊 Data Flow Diagram

```
Frontend (all-exams.js)
    ↓
    Image → base64 → image_base64
    Items → array → items_json: JSON.stringify()
    ↓
Backend (exam-server.js)
    ↓
    image_base64 → saveBase64Image() → /uploads/images/[file]
    items_json → JSON.stringify(q.items) → identification_items_json
    ↓
Database (ExamQuestions)
    ↓
    identification_image_url: "/uploads/images/identification_1710329400000.jpg"
    identification_items_json: "[{...}]"
    ↓
Frontend (take-exam.js)
    ↓
    Parse JSON → items array
    Load image → display
    Display items → student answers
```

## ✨ Success Indicators

When everything is working correctly, you should see:

1. ✅ Image file created in `public/uploads/images/`
2. ✅ Image URL stored in database `identification_image_url`
3. ✅ Items JSON stored in database `identification_items_json`
4. ✅ Image displays when viewing exam
5. ✅ Image displays when taking exam
6. ✅ Items display with input fields when taking exam
7. ✅ Student answers are captured and scored correctly
