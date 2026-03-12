-- ============================================================================
-- NSB Training Database - Complete Check & Verification Script
-- ============================================================================
-- This script checks all tables, columns, and data integrity

USE NSB_Training;

-- ============================================================================
-- 1. CHECK EMPLOYEES TABLE
-- ============================================================================
PRINT '========== CHECKING EMPLOYEES TABLE ==========';

IF OBJECT_ID('Employees', 'U') IS NOT NULL
BEGIN
    PRINT '✅ Employees table exists';
    SELECT 'Employees' as TableName, COUNT(*) as RecordCount FROM Employees;
    
    -- Check columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Employees'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '❌ Employees table does NOT exist';
END

-- ============================================================================
-- 2. CHECK COURSES TABLE
-- ============================================================================
PRINT '';
PRINT '========== CHECKING COURSES TABLE ==========';

IF OBJECT_ID('Courses', 'U') IS NOT NULL
BEGIN
    PRINT '✅ Courses table exists';
    SELECT 'Courses' as TableName, COUNT(*) as RecordCount FROM Courses;
    
    -- Check columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Courses'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '❌ Courses table does NOT exist';
END

-- ============================================================================
-- 3. CHECK EXAMQUESTIONS TABLE
-- ============================================================================
PRINT '';
PRINT '========== CHECKING EXAMQUESTIONS TABLE ==========';

IF OBJECT_ID('ExamQuestions', 'U') IS NOT NULL
BEGIN
    PRINT '✅ ExamQuestions table exists';
    SELECT 'ExamQuestions' as TableName, COUNT(*) as RecordCount FROM ExamQuestions;
    
    -- Check columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ExamQuestions'
    ORDER BY ORDINAL_POSITION;
    
    -- Check question types distribution
    PRINT '';
    PRINT 'Question Types Distribution:';
    SELECT question_type, COUNT(*) as Count FROM ExamQuestions GROUP BY question_type;
END
ELSE
BEGIN
    PRINT '❌ ExamQuestions table does NOT exist';
END

-- ============================================================================
-- 4. CHECK EXAMRESULTS TABLE
-- ============================================================================
PRINT '';
PRINT '========== CHECKING EXAMRESULTS TABLE ==========';

IF OBJECT_ID('ExamResults', 'U') IS NOT NULL
BEGIN
    PRINT '✅ ExamResults table exists';
    SELECT 'ExamResults' as TableName, COUNT(*) as RecordCount FROM ExamResults;
    
    -- Check columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ExamResults'
    ORDER BY ORDINAL_POSITION;
    
    -- Check if required columns exist
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExamResults' AND COLUMN_NAME = 'employee_full_name')
        PRINT '✅ employee_full_name column exists';
    ELSE
        PRINT '❌ employee_full_name column MISSING';
        
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ExamResults' AND COLUMN_NAME = 'course_title')
        PRINT '✅ course_title column exists';
    ELSE
        PRINT '❌ course_title column MISSING';
END
ELSE
BEGIN
    PRINT '❌ ExamResults table does NOT exist';
END

-- ============================================================================
-- 5. CHECK TRAININGRECORDS TABLE
-- ============================================================================
PRINT '';
PRINT '========== CHECKING TRAININGRECORDS TABLE ==========';

IF OBJECT_ID('TrainingRecords', 'U') IS NOT NULL
BEGIN
    PRINT '✅ TrainingRecords table exists';
    SELECT 'TrainingRecords' as TableName, COUNT(*) as RecordCount FROM TrainingRecords;
    
    -- Check columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TrainingRecords'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '❌ TrainingRecords table does NOT exist';
END

-- ============================================================================
-- 6. CHECK TESTRESULTS TABLE
-- ============================================================================
PRINT '';
PRINT '========== CHECKING TESTRESULTS TABLE ==========';

IF OBJECT_ID('TestResults', 'U') IS NOT NULL
BEGIN
    PRINT '✅ TestResults table exists';
    SELECT 'TestResults' as TableName, COUNT(*) as RecordCount FROM TestResults;
    
    -- Check columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TestResults'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '❌ TestResults table does NOT exist';
END

-- ============================================================================
-- 7. CHECK INDEXES
-- ============================================================================
PRINT '';
PRINT '========== CHECKING INDEXES ==========';

SELECT 
    OBJECT_NAME(i.object_id) as TableName,
    i.name as IndexName,
    i.type_desc as IndexType
FROM sys.indexes i
WHERE OBJECT_ID IN (
    OBJECT_ID('Employees'),
    OBJECT_ID('Courses'),
    OBJECT_ID('ExamQuestions'),
    OBJECT_ID('ExamResults'),
    OBJECT_ID('TrainingRecords'),
    OBJECT_ID('TestResults')
)
AND i.name IS NOT NULL
ORDER BY OBJECT_NAME(i.object_id), i.name;

-- ============================================================================
-- 8. CHECK FOREIGN KEYS
-- ============================================================================
PRINT '';
PRINT '========== CHECKING FOREIGN KEYS ==========';

SELECT 
    OBJECT_NAME(fk.parent_object_id) as TableName,
    fk.name as ForeignKeyName,
    OBJECT_NAME(fk.referenced_object_id) as ReferencedTable
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) IN (
    'ExamQuestions', 'ExamResults', 'TrainingRecords', 'TestResults'
)
ORDER BY OBJECT_NAME(fk.parent_object_id);

-- ============================================================================
-- 9. DATA INTEGRITY CHECKS
-- ============================================================================
PRINT '';
PRINT '========== DATA INTEGRITY CHECKS ==========';

-- Check for orphaned exam results
PRINT '';
PRINT 'Checking for orphaned ExamResults (employee_id not in Employees):';
SELECT COUNT(*) as OrphanedRecords FROM ExamResults 
WHERE employee_id NOT IN (SELECT id FROM Employees);

-- Check for orphaned exam questions
PRINT '';
PRINT 'Checking for orphaned ExamQuestions (course_id not in Courses):';
SELECT COUNT(*) as OrphanedRecords FROM ExamQuestions 
WHERE course_id NOT IN (SELECT id FROM Courses);

-- ============================================================================
-- 10. SUMMARY STATISTICS
-- ============================================================================
PRINT '';
PRINT '========== SUMMARY STATISTICS ==========';

SELECT 
    'Employees' as Entity,
    COUNT(*) as Total
FROM Employees
UNION ALL
SELECT 'Courses', COUNT(*) FROM Courses
UNION ALL
SELECT 'ExamQuestions', COUNT(*) FROM ExamQuestions
UNION ALL
SELECT 'ExamResults', COUNT(*) FROM ExamResults
UNION ALL
SELECT 'TrainingRecords', COUNT(*) FROM TrainingRecords
UNION ALL
SELECT 'TestResults', COUNT(*) FROM TestResults;

PRINT '';
PRINT '✅ Database check complete!';
