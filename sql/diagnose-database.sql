-- ============================================================================
-- DIAGNOSE NSB_TRAINING DATABASE - EMPLOYEE NAME ISSUE
-- ============================================================================
USE NSB_Training;

PRINT '========== 1. CHECK TRAININGRECORDS TABLE STRUCTURE ==========';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TrainingRecords'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '========== 2. CHECK EMPLOYEES TABLE STRUCTURE ==========';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Employees'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '========== 3. SAMPLE DATA FROM TRAININGRECORDS ==========';
SELECT TOP 5 
  id,
  employee_id,
  course_title,
  date_from,
  date_to
FROM TrainingRecords;

PRINT '';
PRINT '========== 4. SAMPLE DATA FROM EMPLOYEES ==========';
SELECT TOP 5 
  id,
  full_name,
  first_name,
  last_name,
  employee_no
FROM Employees;

PRINT '';
PRINT '========== 5. CHECK DATA TYPES - EMPLOYEE_ID ==========';
SELECT 
  'TrainingRecords.employee_id' as Column_Name,
  DATA_TYPE,
  CHARACTER_MAXIMUM_LENGTH,
  NUMERIC_PRECISION,
  NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TrainingRecords' AND COLUMN_NAME = 'employee_id'
UNION ALL
SELECT 
  'Employees.id',
  DATA_TYPE,
  CHARACTER_MAXIMUM_LENGTH,
  NUMERIC_PRECISION,
  NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'id';

PRINT '';
PRINT '========== 6. TEST DIRECT JOIN ==========';
SELECT TOP 10
  tr.id as training_id,
  tr.employee_id,
  e.id as emp_id,
  e.full_name,
  tr.course_title
FROM TrainingRecords tr
INNER JOIN Employees e ON tr.employee_id = e.id;

PRINT '';
PRINT '========== 7. TEST LEFT JOIN (ALL TRAININGS) ==========';
SELECT TOP 10
  tr.id as training_id,
  tr.employee_id,
  e.id as emp_id,
  e.full_name,
  tr.course_title
FROM TrainingRecords tr
LEFT JOIN Employees e ON tr.employee_id = e.id;

PRINT '';
PRINT '========== 8. COUNT RECORDS ==========';
SELECT 
  'TrainingRecords' as TableName,
  COUNT(*) as Total_Records
FROM TrainingRecords
UNION ALL
SELECT 
  'Employees',
  COUNT(*)
FROM Employees;

PRINT '';
PRINT '========== 9. CHECK FOR ORPHANED RECORDS ==========';
SELECT COUNT(*) as Orphaned_Records
FROM TrainingRecords tr
WHERE tr.employee_id NOT IN (SELECT id FROM Employees);

PRINT '';
PRINT '========== 10. SHOW ORPHANED RECORDS DETAILS ==========';
SELECT TOP 10
  tr.id,
  tr.employee_id,
  tr.course_title,
  tr.date_from
FROM TrainingRecords tr
WHERE tr.employee_id NOT IN (SELECT id FROM Employees);

PRINT '';
PRINT '========== 11. CHECK IF EMPLOYEE_ID IS NULL ==========';
SELECT COUNT(*) as Null_Employee_IDs
FROM TrainingRecords
WHERE employee_id IS NULL;

PRINT '';
PRINT '========== 12. SHOW ALL UNIQUE EMPLOYEE_IDS IN TRAININGRECORDS ==========';
SELECT DISTINCT employee_id
FROM TrainingRecords
ORDER BY employee_id;

PRINT '';
PRINT '========== 13. SHOW ALL EMPLOYEE IDS IN EMPLOYEES TABLE ==========';
SELECT DISTINCT id
FROM Employees
ORDER BY id;
