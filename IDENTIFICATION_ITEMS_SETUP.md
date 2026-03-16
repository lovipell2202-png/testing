# Identification Items & Image Upload Setup Guide

## Overview
The system is fully configured to save identification items and images to the database. Here's how it works:

## Database Schema

### ExamQuestions Table Columns
```sql
[identification_title] VARCHAR(200) NULL
[identification_instruction] VARCHAR(MAX) NULL
[identification_image_url] VARCHAR(MAX) NULL
[identification_answer] VARCHAR(MAX) NULL
[identification_items_json] VARCHAR(MAX) NULL
```

## How It Works

### 1. Frontend (all-exams.js)
When creating/editing an identification question:

```javascript
// Image is captured as base64
const imageFile = document.getElementById('idImageFile');
const imageBase64 = imageFile.dataset.base64 || null;

// Items are stored in an array
const idItemsArray = [
  { id: 1, number: 1, text: "Part A", answer: "A" },
  { id: 2, number: 2, text: "Part B", answer: "B" }
];

// When saving, items are converted to JSON
question = {
  type: 'identification',
  question_text: '...',
  title: '...',
  instruction: '...',
  image_base64: imageBase64,
  items: idItemsArray,
  count: idItemsArray.length,
  answer: 'A | B'
};
```

### 2. Sending to Server (all-exams.js - saveExam)
```javascript
const convertedQuestions = questionsArray.map(q => {
  if (q.type === 'identification') {
    return {
      type: 'identification',
      question_text: q.question_text || '',
      title: q.title || '',
      instruction: q.instruction || '',
      image_base64: q.image_base64 || '',
      items: q.items || [],
      items_json: JSON.stringify(q.items || []),  // ← Items as JSON
      count: q.count || q.items?.length || 0,
      answer: q.answer || ''
    };
  }
});
```

### 3. Backend Processing (exam-server.js - createExam/updateExam)

#### Image Handling
```javascript
// Save base64 image to disk
const imageUrl = q.image_base64 ? saveBase64Image(q.image_base64) : null;
// Returns: /uploads/images/identification_1710329400000.jpg
```

#### Database Insertion
```javascript
await pool.request()
  .input('identification_image_url', sql.VarChar(sql.MAX), imageUrl || '')
  .input('identification_items_json', sql.VarChar(sql.MAX), JSON.stringify(q.items || []))
  .query(`INSERT INTO ExamQuestions (..., identification_image_url, identification_items_json, ...)
          VALUES (..., @identification_image_url, @identification_items_json, ...)`);
```

### 4. Image Storage
Images are saved to: `public/uploads/images/`
- Filename format: `identification_[timestamp].[format]`
- Example: `identification_1710329400000.jpg`
- URL stored in DB: `/uploads/images/identification_1710329400000.jpg`

### 5. Retrieving Data (exam-server.js - getExamById)
```javascript
const questionsResult = await pool.request()
  .query(`SELECT ..., identification_image_url, identification_items_json
          FROM ExamQuestions 
          WHERE course_id = @course_id`);
```

Returns:
```json
{
  "identification_image_url": "/uploads/images/identification_1710329400000.jpg",
  "identification_items_json": "[{\"id\":1,\"number\":1,\"text\":\"Part A\",\"answer\":\"A\"}]"
}
```

### 6. Taking Exam (take-exam.js - displayQuestion)
```javascript
// Parse items from JSON
let items = [];
if (question.identification_items_json) {
  items = JSON.parse(question.identification_items_json);
}

// Display image
if (question.identification_image_url) {
  html += `<img src="${question.identification_image_url}" ...>`;
}

// Display items for answering
items.forEach((item, idx) => {
  html += `<input type="text" placeholder="Type answer (UPPERCASE LETTERS AND NUMBERS)" ...>`;
});
```

## Complete Flow

1. **Create Exam**
   - User adds identification question with image and items
   - Image uploaded as base64 → saved to disk → URL stored in DB
   - Items array → converted to JSON → stored in DB

2. **Edit Exam**
   - Questions loaded from DB
   - Items parsed from `identification_items_json`
   - Image URL retrieved from `identification_image_url`
   - User can modify and save again

3. **View Exam**
   - Questions fetched from DB
   - Items parsed and displayed
   - Image displayed from URL

4. **Take Exam**
   - Questions loaded with items and image
   - Image displayed above items
   - Student answers each item
   - Answers compared with stored items

## Database Columns Reference

| Column | Type | Purpose |
|--------|------|---------|
| `identification_title` | VARCHAR(200) | Question title |
| `identification_instruction` | VARCHAR(MAX) | Instructions for the question |
| `identification_image_url` | VARCHAR(MAX) | Path to uploaded image |
| `identification_answer` | VARCHAR(MAX) | Concatenated answers (e.g., "A \| B") |
| `identification_items_json` | VARCHAR(MAX) | JSON array of items with text and answers |

## Example Data in Database

```sql
identification_title: "Engine Components"
identification_instruction: "Identify the following parts of the engine"
identification_image_url: "/uploads/images/identification_1710329400000.jpg"
identification_answer: "A | B | C"
identification_items_json: "[
  {\"id\":1,\"number\":1,\"text\":\"Cylinder Head\",\"answer\":\"A\",\"points\":1},
  {\"id\":2,\"number\":2,\"text\":\"Piston\",\"answer\":\"B\",\"points\":1},
  {\"id\":3,\"number\":3,\"text\":\"Crankshaft\",\"answer\":\"C\",\"points\":1}
]"
```

## Troubleshooting

### Images not saving
- Check `public/uploads/images/` directory exists and is writable
- Verify `saveBase64Image()` function in exam-server.js
- Check browser console for base64 data

### Items not displaying
- Verify `identification_items_json` is being sent from frontend
- Check JSON parsing in take-exam.js
- Ensure items array has `text` and `answer` properties

### Database not storing data
- Verify ExamQuestions table has all columns
- Check SQL Server connection
- Review console logs for SQL errors

## Testing

To test the complete flow:

1. Create an exam with identification question
2. Upload an image
3. Add 2-3 items with text and answers
4. Save the exam
5. Check database: `SELECT identification_image_url, identification_items_json FROM ExamQuestions WHERE question_type = 'identification'`
6. View the exam - image and items should display
7. Take the exam - image should show above items
