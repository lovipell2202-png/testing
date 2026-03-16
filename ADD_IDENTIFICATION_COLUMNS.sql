-- ============================================================================
-- SQL Script to Add Identification Items JSON Column to ExamQuestions Table
-- ============================================================================
-- This script adds the identification_items_json column to store identification
-- question items as JSON format in the database.
-- ============================================================================

USE NSB_Training;
GO

-- Check if identification_items_json column exists
IF NOT EXISTS (
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ExamQuestions' 
    AND COLUMN_NAME = 'identification_items_json'
)
BEGIN
    PRINT 'Adding identification_items_json column...';
    ALTER TABLE ExamQuestions
    ADD identification_items_json VARCHAR(MAX) NULL;
    PRINT '✅ Column identification_items_json added successfully';
END
ELSE
BEGIN
    PRINT '✅ Column identification_items_json already exists';
END
GO

-- Check if identification_image_url column exists
IF NOT EXISTS (
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ExamQuestions' 
    AND COLUMN_NAME = 'identification_image_url'
)
BEGIN
    PRINT 'Adding identification_image_url column...';
    ALTER TABLE ExamQuestions
    ADD identification_image_url VARCHAR(MAX) NULL;
    PRINT '✅ Column identification_image_url added successfully';
END
ELSE
BEGIN
    PRINT '✅ Column identification_image_url already exists';
END
GO

-- Check if identification_title column exists
IF NOT EXISTS (
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ExamQuestions' 
    AND COLUMN_NAME = 'identification_title'
)
BEGIN
    PRINT 'Adding identification_title column...';
    ALTER TABLE ExamQuestions
    ADD identification_title VARCHAR(200) NULL;
    PRINT '✅ Column identification_title added successfully';
END
ELSE
BEGIN
    PRINT '✅ Column identification_title already exists';
END
GO

-- Check if identification_instruction column exists
IF NOT EXISTS (
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ExamQuestions' 
    AND COLUMN_NAME = 'identification_instruction'
)
BEGIN
    PRINT 'Adding identification_instruction column...';
    ALTER TABLE ExamQuestions
    ADD identification_instruction VARCHAR(MAX) NULL;
    PRINT '✅ Column identification_instruction added successfully';
END
ELSE
BEGIN
    PRINT '✅ Column identification_instruction already exists';
END
GO

-- Check if identification_answer column exists
IF NOT EXISTS (
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ExamQuestions' 
    AND COLUMN_NAME = 'identification_answer'
)
BEGIN
    PRINT 'Adding identification_answer column...';
    ALTER TABLE ExamQuestions
    ADD identification_answer VARCHAR(MAX) NULL;
    PRINT '✅ Column identification_answer added successfully';
END
ELSE
BEGIN
    PRINT '✅ Column identification_answer already exists';
END
GO

-- Display all identification columns
PRINT '';
PRINT '📋 All Identification Columns in ExamQuestions Table:';
PRINT '================================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ExamQuestions' 
AND COLUMN_NAME LIKE 'identification%'
ORDER BY COLUMN_NAME;
GO

-- Display table structure
PRINT '';
PRINT '📋 Complete ExamQuestions Table Structure:';
PRINT '================================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ExamQuestions'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '✅ Database migration completed successfully!';
PRINT '';
PRINT 'You can now:';
PRINT '1. Create identification questions with items';
PRINT '2. Upload images for identification questions';
PRINT '3. Store items as JSON in identification_items_json column';
PRINT '4. Retrieve and display items when taking exams';
