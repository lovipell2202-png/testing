-- Add exam_form_url column to TrainingRecords table if it doesn't exist
-- This is needed for the updated upload functionality

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TrainingRecords' AND COLUMN_NAME = 'exam_form_url')
BEGIN
    ALTER TABLE TrainingRecords ADD exam_form_url VARCHAR(500) NULL;
    PRINT 'Column exam_form_url added successfully';
END
ELSE
BEGIN
    PRINT 'Column exam_form_url already exists';
END

-- Note: eff_form_file column already exists and is used for TEEF forms
-- No additional column needed for TEEF

PRINT 'Database migration complete!';
