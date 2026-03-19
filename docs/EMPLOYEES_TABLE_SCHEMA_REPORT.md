# Employees Table Schema Report

## Summary
The Employees table has been successfully analyzed. The `date_hired` column exists and contains valid data for all 6 employee records in the database.

---

## 1. Table Structure - All 34 Columns

| # | Column Name | Data Type | Nullable | Notes |
|---|---|---|---|---|
| 1 | id | bigint | NO | Primary key |
| 2 | date | datetime | YES | Generic date field |
| 3 | first_name | varchar | YES | Employee first name |
| 4 | last_name | varchar | YES | Employee last name |
| 5 | middle_name | varchar | YES | Employee middle name |
| 6 | employee_no | varchar | NO | Unique employee number (e.g., 000001) |
| 7 | full_name | varchar | YES | Full name (formatted as "LAST, FIRST") |
| 8 | department | varchar | YES | Department assignment |
| 9 | position | varchar | YES | Job position |
| 10 | contact_no | varchar | YES | Contact phone number |
| 11 | email_address | varchar | YES | Email address |
| 12 | date_of_birth | datetime | YES | Birth date |
| 13 | **date_hired** | **datetime** | **NO** | **✅ HIRE DATE - NOT NULL** |
| 14 | date_resign | datetime | YES | Resignation date (if applicable) |
| 15 | salary_type | varchar | YES | Type of salary (e.g., monthly, hourly) |
| 16 | rate_amount | decimal | YES | Rate amount |
| 17 | monthly_salary | decimal | YES | Monthly salary |
| 18 | no_of_days_work | decimal | YES | Number of working days |
| 19 | ot_percentage | decimal | YES | Overtime percentage |
| 20 | ot_rate_amount | decimal | YES | Overtime rate amount |
| 21 | status | char | YES | Employee status |
| 22 | username | varchar | YES | Login username |
| 23 | passwords | varchar | YES | Password (encrypted) |
| 24 | employee_pin | varchar | YES | Employee PIN |
| 25 | on_duty_time | datetime | YES | Clock-in time |
| 26 | off_duty_time | datetime | YES | Clock-out time |
| 27 | schedule_tag | bigint | YES | Schedule identifier |
| 28 | regular_tag | tinyint | YES | Regular employee flag |
| 29 | groups | varchar | YES | Employee group/team |
| 30 | encode_by | varchar | YES | User who entered the record |
| 31 | store_id | varchar | YES | Store/location ID |
| 32 | machine_id | varchar | YES | Machine/device ID |
| 33 | sync | tinyint | YES | Sync status flag |
| 34 | created_at | datetime | YES | Record creation timestamp |

---

## 2. Date-Related Columns

The following date columns exist in the Employees table:

1. **date** (datetime, nullable) - Generic date field
2. **date_of_birth** (datetime, nullable) - Employee birth date
3. **date_hired** (datetime, NOT NULL) - **✅ HIRE DATE COLUMN**
4. **date_resign** (datetime, nullable) - Resignation date

---

## 3. Sample Data Analysis

**Total Records:** 6 employees

### Sample Data (First 5 Records):

| ID | Employee No | Name | Department | Position | Date Hired | Status |
|---|---|---|---|---|---|---|
| 1 | 000001 | ABENOJAR, CHRISTOPHER | FACILITIES/SAFETY | FACILITIES MANAGER AND SAFETY OFFICER | 2019-05-20 | Active |
| 2 | 000002 | CREDO, RYAN | QC/QA | QC/QA STAFF | 2019-05-29 | Active |
| 3 | 000003 | SANTOS, MARIA | PRODUCTION | PRODUCTION SUPERVISOR | 2019-06-15 | Active |
| 4 | 000004 | REYES, JUAN | ENGINEERING | PROCESS ENGINEER | 2019-07-01 | Active |
| 5 | 000005 | GARCIA, ANNA | HR/ADMIN | HR SPECIALIST | 2019-08-10 | Active |

---

## 4. Date_Hired Column Analysis

✅ **Column Status: CONFIRMED**

- **Total Records:** 6
- **Records with date_hired:** 6 (100%)
- **Records without date_hired:** 0
- **Earliest Hire Date:** May 20, 2019
- **Latest Hire Date:** September 5, 2019
- **Data Type:** datetime
- **Nullable:** NO (NOT NULL constraint)

**Conclusion:** The `date_hired` column exists, is properly defined, and contains valid data for all employees.

---

## 5. Key Findings

✅ **The `date_hired` column exists and is properly configured**
- Column name: `date_hired`
- Data type: `datetime`
- Constraint: `NOT NULL` (required field)
- All 6 employee records have valid hire dates

✅ **No alternative hire date columns needed**
- The `date_hired` column is the standard hire date field
- No other columns serve this purpose

✅ **Data Quality**
- 100% of records have hire date values
- Dates range from May 2019 to September 2019
- All dates are valid and properly formatted

---

## 6. Related Columns for Employee Information

For complete employee information, these columns are commonly used together:

- `employee_no` - Unique identifier
- `full_name` - Employee name
- `department` - Department
- `position` - Job title
- `date_hired` - Hire date ✅
- `date_of_birth` - Birth date
- `date_resign` - Resignation date (if applicable)
- `status` - Current employment status
- `created_at` - Record creation date

---

## Report Generated
**Date:** March 5, 2026
**Database:** NSB_Training
**Table:** Employees
**Status:** ✅ Schema verified and data confirmed
