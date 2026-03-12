-- Check if employee_id in TrainingRecords exists in Employees table
USE NSB_Training;

-- First, check what employee_ids are in TrainingRecords
PRINT '========== Employee IDs in TrainingRecords ==========';
SELECT DISTINCT employee_id FROM TrainingRecords ORDER BY employee_id;

-- Check what IDs exist in Employees table
PRINT '';
PRINT '========== Employee IDs in Employees table ==========';
SELECT DISTINCT id FROM Employees ORDER BY id;

-- Check for orphaned records (employee_id not in Employees)
PRINT '';
PRINT '========== Orphaned TrainingRecords (employee_id not in Employees) ==========';
SELECT tr.id, tr.employee_id, tr.course_title, tr.date_from
FROM TrainingRecords tr
WHERE tr.employee_id NOT IN (SELECT id FROM Employees)
ORDER BY tr.employee_id;

-- Test the JOIN query
PRINT '';
PRINT '========== Test JOIN Query ==========';
SELECT TOP 5 
  tr.id, 
  tr.employee_id, 
  e.full_name, 
  e.id as emp_id,
  tr.course_title
FROM TrainingRecords tr
LEFT JOIN Employees e ON tr.employee_id = e.id
ORDER BY tr.id;

-- Check if Employees table has data
PRINT '';
PRINT '========== Sample Employees ==========';
SELECT TOP 5 id, full_name, first_name, last_name FROM Employees;

-- Count records
PRINT '';
PRINT '========== Record Counts ==========';
SELECT 'Employees' as TableName, COUNT(*) as Count FROM Employees
UNION ALL
SELECT 'TrainingRecords', COUNT(*) FROM TrainingRecords;
