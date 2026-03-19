# Training Evaluation Form - Database Setup Complete

## Overview
The training evaluation form now has full database integration with the ability to save all form data including checkbox records, scores, and remarks.

## Database Table Created
**Table Name:** `TrainingEvaluationForms`

### Columns Structure:
- **Basic Info:** training_id, employee_id, course_title, resource_speaker, participant_name, training_date, position, venue
- **Page 1 - Program Contents:** program_1_rating through program_5_rating
- **Page 1 - Trainer/Speaker:** trainer_1_rating through trainer_5_rating
- **Page 1 - Transfer Quotient:** transfer_1_rating through transfer_5_rating
- **Page 1 - Scores:** overall_score, total_average_score
- **Page 1 - Remarks:** page1_remarks_1, page1_remarks_2, overall_remarks
- **Page 2 - Applied Skills Before:** applied_before_1_rating through applied_before_5_rating, applied_before_total, applied_before_avg
- **Page 2 - Applied Skills After:** applied_after_1_rating through applied_after_5_rating, applied_after_total, applied_after_avg
- **Page 2 - Business Results:** business_1_rating, business_1_feedback, business_2_rating, business_2_feedback, business_3_rating, business_3_feedback, business_total, business_avg
- **Page 2 - Remarks:** page2_remarks_1, page2_remarks_2
- **Metadata:** created_at, updated_at, created_by, updated_by

## Form Features

### 1. Training Title Dropdown
- Automatically populated from `Courses` table
- Shows all available training courses
- Selecting a training auto-fills related fields

### 2. Auto-Populated Fields (Read-Only)
When a training is selected:
- **Resource Speaker:** Filled from trainer field
- **Name of Participant:** Filled from employee name
- **Position:** Filled from employee position

### 3. Editable Fields
- **Training Date:** Date picker with long format display (e.g., "March 16, 2026")
- **Venue:** Dropdown with predefined venues + ability to type custom venue

### 4. Checkbox Records
All checkbox selections are saved:
- Program Contents (5 criteria)
- Trainer/Speaker (5 criteria)
- Transfer Quotient (5 criteria)
- Applied Skills Before (5 criteria)
- Applied Skills After (5 criteria)
- Business Results (3 criteria)

### 5. Automatic Calculations
- **Overall Score:** Sum of all checked values on Page 1
- **Total Average Score (GWA):** Overall Score ÷ Total questions answered
- **Applied Skills Totals & Averages:** Separate for Before and After
- **Business Results Totals & Averages:** Calculated from 3 criteria

### 6. Save & Print Buttons
- **Save Form Button:** Saves all data to database
- **Print Form Button:** Prints the form as 2 A4 pages

## API Endpoints

### POST /api/evaluation-forms
Saves a new evaluation form record
```json
{
  "training_id": 1,
  "employee_id": 1,
  "course_title": "Training Title",
  "resource_speaker": "Speaker Name",
  "participant_name": "Employee Name",
  "training_date": "2026-03-16",
  "position": "Position",
  "venue": "Venue Name",
  "program_ratings": [5, 4, 3, 2, 1],
  "trainer_ratings": [5, 4, 3, 2, 1],
  "transfer_ratings": [5, 4, 3, 2, 1],
  "overall_score": 45,
  "total_average_score": 3.5,
  ...
}
```

### GET /api/evaluation-forms/:trainingId
Retrieves all evaluation forms for a specific training

### GET /api/venues
Retrieves all unique venues from training records

## Files Modified/Created

### New Files:
- `create-evaluation-form-table.sql` - Database schema
- `run-evaluation-form-migration.js` - Migration script
- `TRAINING_EVALUATION_FORM_SETUP.md` - This documentation

### Modified Files:
- `public/training-evaluation-form.html` - Added dropdowns and datalist
- `public/src/training-evaluation-form.js` - Added database integration
- `server.js` - Added API endpoints

## How to Use

1. **Open the form:** Navigate to `/training-evaluation-form.html`
2. **Select Training:** Choose a training from the dropdown
3. **Fill Form:** Complete all sections with ratings and remarks
4. **Save:** Click "Save Form" button to save to database
5. **Print:** Click "Print Form" button to print as PDF

## Font Sizes
- Body text: 10pt
- Evaluation tables: 9pt
- Rating labels: 8pt
- Tagalog translations: 7pt
- All text is clearly readable

## Print Format
- 2 A4 pages (8.27" × 11.69")
- Page 1: Preliminary Evaluation
- Page 2: Applied Skills & Business Results
- Optimized for printing with proper spacing and font sizes

## Database Indexes
- `idx_employee_training` - For quick lookups by employee and training
- `idx_created_at` - For sorting by creation date
