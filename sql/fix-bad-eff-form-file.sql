-- Fix records where eff_form_file was incorrectly set to the label string instead of a real file path
-- These records have eff_form_file = 'W/TEEF' or similar non-path values
UPDATE TrainingRecords
SET eff_form_file = NULL
WHERE eff_form_file IS NOT NULL
  AND eff_form_file NOT LIKE '/%'
  AND eff_form_file NOT LIKE 'http%';

-- Verify the fix
SELECT id, effectiveness_form, exam_form_url, eff_form_file
FROM TrainingRecords
WHERE effectiveness_form IN ('W/TEEF', 'W/EXAM', 'W/EXAM_TEEF')
ORDER BY id;
