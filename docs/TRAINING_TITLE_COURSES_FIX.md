# Training Title Dropdown - Courses Table Integration

## Overview
Updated the Training Title field to fetch course data directly from the Courses table using the course_title column.

## Changes Made

### 1. API Endpoint
**Endpoint:** `GET /api/courses`
**Source:** Courses table
**Query:**
```sql
SELECT id, course_title, description, created_at FROM Courses ORDER BY course_title
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "course_title": "COURSE NAME 1",
      "description": "Description",
      "created_at": "2026-03-16T00:00:00.000Z"
    },
    {
      "id": 2,
      "course_title": "COURSE NAME 2",
      "description": "Description",
      "created_at": "2026-03-16T00:00:00.000Z"
    }
  ]
}
```

### 2. JavaScript Updates
**File:** `public/src/training-evaluation-form.js`

**Changes:**
- Updated `loadTrainings()` to fetch from `/api/courses` instead of `/api/trainings`
- Updated `populateTrainingDropdown()` to use `course.course_title` for display
- Updated data attribute from `data-training` to `data-course`
- Updated DOMContentLoaded handler to parse course data correctly
- Added `loadSpeakers()` call to load speakers

### 3. Form Behavior
When user selects a training course:
1. Course title is displayed in dropdown
2. Courses are sorted alphabetically by course_title
3. Course data is stored in option's data attribute
4. Form can be populated with course information

## Database Schema

### Courses Table
```sql
CREATE TABLE Courses (
  id INT PRIMARY KEY IDENTITY(1,1),
  course_title NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  created_at DATETIME DEFAULT GETDATE()
)
```

## Form Fields Populated

| Field | Source | Auto-Fill |
|-------|--------|-----------|
| Training Title | Courses.course_title | Manual selection |
| Resource Speaker | TrainingRecords.trainer | Optional (datalist) |
| Name of Participant | Employees.full_name | Dropdown |
| Training Date | Manual input | Date picker |
| Position | Employees.position | Auto-fill from employee |
| Venue | TrainingRecords.venue | Dropdown |

## User Experience

1. User opens training evaluation form
2. Clicks "Training Title" dropdown
3. Sees all courses from Courses table sorted alphabetically
4. Selects desired course
5. Course information is loaded (if available)
6. Continues filling form

## Files Modified

- `public/src/training-evaluation-form.js` - Updated to fetch from /api/courses
- No changes needed to HTML (already has correct structure)
- No changes needed to server.js (endpoint already exists)

## Benefits

✅ Courses fetched directly from Courses table
✅ Uses course_title column for display
✅ Sorted alphabetically for easy navigation
✅ Consistent with database schema
✅ No manual updates needed
✅ Seamless integration with form

## Testing

To verify the integration:
1. Open training evaluation form
2. Click Training Title dropdown
3. Verify all courses from Courses table appear
4. Verify courses are sorted alphabetically
5. Select a course and verify form loads correctly
