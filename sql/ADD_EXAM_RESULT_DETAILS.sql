-- Add question_details and admin override columns to ExamResults
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExamResults' AND COLUMN_NAME = 'question_details')
BEGIN
    ALTER TABLE ExamResults ADD question_details NVARCHAR(MAX) NULL;
    PRINT 'Added question_details column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExamResults' AND COLUMN_NAME = 'admin_adjusted_score')
BEGIN
    ALTER TABLE ExamResults ADD admin_adjusted_score INT NULL;
    PRINT 'Added admin_adjusted_score column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExamResults' AND COLUMN_NAME = 'admin_adjusted_percentage')
BEGIN
    ALTER TABLE ExamResults ADD admin_adjusted_percentage DECIMAL(5,2) NULL;
    PRINT 'Added admin_adjusted_percentage column';
END

PRINT 'Migration complete.';
