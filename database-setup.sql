-- NSB Engineering Training Database Setup Script
-- Run this in Azure Data Studio or SQL Server Management Studio

-- Create Database
CREATE DATABASE NSB_Training;
GO

USE NSB_Training;
GO

-- Create Sequence for Employee Numbers
CREATE SEQUENCE seq_employee_no
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    NO CYCLE;
GO

-- Create Employees Table (Enhanced with employee_listing structure)
CREATE TABLE [dbo].[Employees] (
    [id] BIGINT PRIMARY KEY IDENTITY(1,1),
    [date] DATETIME CONSTRAINT [DF_Employees_date] DEFAULT (getdate()) NULL,
    [first_name] VARCHAR(100) NULL,
    [last_name] VARCHAR(100) NULL,
    [middle_name] VARCHAR(100) NULL,
    [employee_no] VARCHAR(50) UNIQUE NOT NULL CONSTRAINT [DF_employee_no] DEFAULT (right('000000'+CONVERT([varchar](6),NEXT VALUE FOR [seq_employee_no],0),(6))),
    [full_name] VARCHAR(200) NULL,
    [department] VARCHAR(100) NULL,
    [position] VARCHAR(200) NULL,
    [contact_no] VARCHAR(50) NULL,
    [email_address] VARCHAR(100) NULL,
    [date_of_birth] DATETIME NULL,
    [date_hired] DATETIME NOT NULL,
    [date_resign] DATETIME NULL,
    [salary_type] VARCHAR(10) CONSTRAINT [DF_Employees_salary_type] DEFAULT ('W') NULL,
    [rate_amount] DECIMAL(18, 2) CONSTRAINT [DF_Employees_rate_amount] DEFAULT (0.00) NULL,
    [monthly_salary] DECIMAL(18, 2) NULL,
    [no_of_days_work] DECIMAL(18, 2) NULL,
    [ot_percentage] DECIMAL(18, 2) NULL,
    [ot_rate_amount] DECIMAL(18, 2) NULL,
    [status] CHAR(5) CONSTRAINT [DF_Employees_status] DEFAULT ('1') NULL,
    [username] VARCHAR(50) NULL,
    [passwords] VARCHAR(50) NULL,
    [employee_pin] VARCHAR(4) NULL,
    [on_duty_time] DATETIME NULL,
    [off_duty_time] DATETIME NULL,
    [schedule_tag] BIGINT NULL,
    [regular_tag] TINYINT NULL,
    [groups] VARCHAR(200) NULL,
    [encode_by] VARCHAR(50) NULL,
    [store_id] VARCHAR(10) NULL,
    [machine_id] VARCHAR(10) NULL,
    [sync] TINYINT CONSTRAINT [DF_Employees_sync] DEFAULT (0) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);

-- Create Training Records Table
CREATE TABLE [dbo].[TrainingRecords] (
    [id] BIGINT PRIMARY KEY IDENTITY(1,1),
    [employee_id] BIGINT NOT NULL FOREIGN KEY REFERENCES Employees(id) ON DELETE CASCADE,
    [date_from] DATE NOT NULL,
    [date_to] DATE NOT NULL,
    [duration] VARCHAR(50) NOT NULL,
    [course_title] VARCHAR(200) NOT NULL,
    [training_provider] VARCHAR(100) NOT NULL,
    [venue] VARCHAR(100) NOT NULL,
    [trainer] VARCHAR(100) NOT NULL,
    [type_tb] CHAR(1) CHECK(type_tb IN ('T','B')) NOT NULL,
    [effectiveness_form] VARCHAR(50) DEFAULT 'N/A',
    [created_at] DATETIME DEFAULT GETDATE()
);

-- Create Indexes for better performance
CREATE INDEX [idx_employee_id] ON [TrainingRecords]([employee_id]);
CREATE INDEX [idx_trainer] ON [TrainingRecords]([trainer]);
CREATE INDEX [idx_type_tb] ON [TrainingRecords]([type_tb]);
CREATE INDEX [idx_date_from] ON [TrainingRecords]([date_from]);
CREATE INDEX [idx_employee_no] ON [Employees]([employee_no]);
CREATE INDEX [idx_department] ON [Employees]([department]);
CREATE INDEX [idx_status] ON [Employees]([status]);

-- Insert Sample Data (employee_no will be auto-generated from sequence)
INSERT INTO Employees (first_name, last_name, full_name, employee_no, department, position, contact_no, email_address, date_hired, date_of_birth, salary_type, rate_amount, monthly_salary, status, groups) VALUES
('CHRISTOPHER', 'ABENOJAR', 'ABENOJAR, CHRISTOPHER', DEFAULT, 'FACILITIES/SAFETY', 'FACILITIES MANAGER AND SAFETY OFFICER', '09123456789', 'christopher.abenojar@nsb.com', '2019-05-20', '1985-03-15', 'W', 25000.00, 25000.00, '1', 'MANAGEMENT'),
('RYAN', 'CREDO', 'CREDO, RYAN', DEFAULT, 'QC/QA', 'QC/QA STAFF', '09123456790', 'ryan.credo@nsb.com', '2019-05-29', '1990-07-22', 'W', 18000.00, 18000.00, '1', 'STAFF'),
('MARIA', 'SANTOS', 'SANTOS, MARIA', DEFAULT, 'PRODUCTION', 'PRODUCTION SUPERVISOR', '09123456791', 'maria.santos@nsb.com', '2019-06-15', '1988-11-10', 'W', 22000.00, 22000.00, '1', 'MANAGEMENT'),
('JUAN', 'REYES', 'REYES, JUAN', DEFAULT, 'ENGINEERING', 'PROCESS ENGINEER', '09123456792', 'juan.reyes@nsb.com', '2019-07-01', '1987-05-18', 'W', 24000.00, 24000.00, '1', 'TECHNICAL'),
('ANNA', 'GARCIA', 'GARCIA, ANNA', DEFAULT, 'HR/ADMIN', 'HR SPECIALIST', '09123456793', 'anna.garcia@nsb.com', '2019-08-10', '1992-09-25', 'W', 20000.00, 20000.00, '1', 'ADMIN'),
('LUIS', 'TORRES', 'TORRES, LUIS', DEFAULT, 'MAINTENANCE', 'MAINTENANCE TECHNICIAN', '09123456794', 'luis.torres@nsb.com', '2019-09-05', '1986-12-30', 'W', 19000.00, 19000.00, '1', 'TECHNICAL');

-- Insert Training Records
INSERT INTO TrainingRecords (employee_id, date_from, date_to, duration, course_title, training_provider, venue, trainer, type_tb, effectiveness_form) VALUES
(1, '2019-05-17', '2019-05-17', '1 DAY', 'ROOT-CAUSE ANALYSIS (RCA)', 'QUALITEX MANAGEMENT CONSULTANCY', 'CONFERENCE ROOM', 'E. PIKE', 'T', 'N/A'),
(1, '2019-06-23', '2019-06-23', '1 DAY', 'ONLINE 8-HOUR ENVIRONMENTAL TRAINING COURSE FOR MANAGING HEADS', 'ENVIA CONSULTANCY', 'WEBINAR', 'V. OSORIO', 'T', 'N/A'),
(1, '2019-07-24', '2019-07-27', '4 DAYS', 'TRAINER''S TRAINING COURSE', 'QUALITEX MANAGEMENT CONSULTANCY', 'CONFERENCE ROOM', 'E. PIKE', 'B', 'N/A'),
(1, '2019-08-01', '2019-08-01', '4 HRS', 'COMPANY INTRODUCTION', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'M. NONO', 'B', 'W/EXAM'),
(1, '2019-08-02', '2019-08-02', '4 HRS', 'QUALITY MANAGEMENT SYSTEM', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'D. CRUZ', 'B', 'W/EXAM'),
(1, '2019-08-02', '2019-08-02', '4 HRS', '5S FOD', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'S. TORIBIO', 'B', 'W/EXAM'),
(1, '2019-08-03', '2019-08-03', '4 HRS', 'COUNTERFEIT PARTS', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'S. TORIBIO', 'B', 'W/EXAM'),
(1, '2019-08-03', '2019-08-03', '4 HRS', 'PRODUCT SAFETY', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'S. TORIBIO', 'B', 'W/EXAM'),
(2, '2019-05-29', '2019-05-29', '1 DAY', 'COMPANY ORIENTATION', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'DEPT. HEADS', 'B', 'N/A'),
(2, '2019-06-05', '2019-06-05', '30 MINS', 'INSPECTION', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'J. RENZALES', 'T', 'N/A'),
(2, '2019-07-25', '2019-07-25', '2 DAYS', 'COORDINATE MEASURING MACHINE', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'R. SICAT', 'T', 'N/A'),
(3, '2019-06-15', '2019-06-15', '1 DAY', 'LEADERSHIP FUNDAMENTALS', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'M. NONO', 'B', 'W/EXAM'),
(3, '2019-07-10', '2019-07-10', '4 HRS', 'PRODUCTION PLANNING', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'D. CRUZ', 'T', 'W/EXAM'),
(3, '2019-08-20', '2019-08-20', '2 HRS', 'SAFETY PROTOCOLS', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'S. TORIBIO', 'B', 'N/A'),
(4, '2019-07-01', '2019-07-01', '1 DAY', 'PROCESS IMPROVEMENT', 'QUALITEX MANAGEMENT CONSULTANCY', 'CONFERENCE ROOM', 'E. PIKE', 'T', 'W/EXAM'),
(4, '2019-08-15', '2019-08-15', '4 HRS', 'QUALITY STANDARDS', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'J. RENZALES', 'T', 'W/EXAM'),
(5, '2019-08-10', '2019-08-10', '1 DAY', 'HR POLICIES AND PROCEDURES', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'M. NONO', 'B', 'W/EXAM'),
(5, '2019-09-05', '2019-09-05', '2 HRS', 'EMPLOYEE RELATIONS', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'D. CRUZ', 'B', 'N/A'),
(6, '2019-09-05', '2019-09-05', '1 DAY', 'EQUIPMENT MAINTENANCE', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'S. TORIBIO', 'T', 'W/EXAM'),
(6, '2019-09-20', '2019-09-20', '4 HRS', 'PREVENTIVE MAINTENANCE', 'NSB ENGINEERING', 'CONFERENCE ROOM', 'J. RENZALES', 'T', 'W/EXAM');

-- Verify data
SELECT 'Employees' AS TableName, COUNT(*) AS RecordCount FROM Employees
UNION ALL
SELECT 'Training Records', COUNT(*) FROM TrainingRecords;

-- View employees with their auto-generated employee numbers
SELECT id, employee_no, full_name, department FROM Employees;
