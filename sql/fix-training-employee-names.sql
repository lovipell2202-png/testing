-- ============================================================================
-- FIX TRAINING RECORDS - EMPLOYEE NAME ISSUE
-- ============================================================================
USE NSB_Training;

-- Step 1: Check what employee_ids exist in TrainingRecords
PRINT '========== Step 1: Employee IDs in TrainingRecords ==========';
SELECT DISTINCT employee_id FROM TrainingRecords ORDER BY employee_id;

-- Step 2: Check what IDs exist in Employees table
PRINT '';
PRINT '========== Step 2: Employee IDs in Employees table ==========';
SELECT DISTINCT id FROM Employees ORDER BY id;

-- Step 3: Find orphaned records (employee_id not in Employees)
PRINT '';
PRINT '========== Step 3: Orphaned TrainingRecords ==========';
SELECT COUNT(*) as OrphanedCount FROM TrainingRecords 
WHERE employee_id NOT IN (SELECT id FROM Employees);

-- Step 4: Test the JOIN - see what's being returned
PRINT '';
PRINT '========== Step 4: Test JOIN Query (First 10 records) ==========';
SELECT TOP 10
  tr.id, 
  tr.employee_id, 
  e.id as emp_table_id,
  e.full_name, 
  e.first_name,
  e.last_name,
  tr.course_title,
  tr.date_from
FROM TrainingRecords tr
LEFT JOIN Employees e ON tr.employee_id = e.id
ORDER BY tr.id;

-- Step 5: Check if there's a mismatch in data types
PRINT '';
PRINT '========== Step 5: Check Column Data Types ==========';
SELECT 
  'TrainingRecords.employee_id' as ColumnName,
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

-- Step 6: Show sample data from both tables
PRINT '';
PRINT '========== Step 6: Sample TrainingRecords ==========';
SELECT TOP 5 id, employee_id, course_title FROM TrainingRecords;

PRINT '';
PRINT '========== Step 7: Sample Employees ==========';
SELECT TOP 5 id, full_name, first_name, last_name FROM Employees;

-- Step 8: If there are orphaned records, try to fix them
-- This assumes employee_id might be stored as string or have leading zeros
PRINT '';
PRINT '========== Step 8: Check for Data Type Mismatch Issues ==========';
SELECT 
  tr.id,
  tr.employee_id,
  CAST(tr.employee_id AS INT) as employee_id_as_int,
  e.id,
  e.full_name
FROM TrainingRecords tr
LEFT JOIN Employees e ON CAST(tr.employee_id AS INT) = e.id
WHERE tr.employee_id IS NOT NULL
LIMIT 10;
