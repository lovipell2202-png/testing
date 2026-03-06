# System Architecture - NSB Employee Training Record System

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web Browser                              │
│                   http://localhost:3000                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Express.js Server                          │
│                      (Node.js Backend)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Routes & Controllers                    │  │
│  │                                                          │  │
│  │  GET    /api/employees                                  │  │
│  │  GET    /api/employees/:id                              │  │
│  │  GET    /api/employees/search/:employee_no              │  │
│  │  POST   /api/employees                                  │  │
│  │  PUT    /api/employees/:id                              │  │
│  │  DELETE /api/employees/:id                              │  │
│  │                                                          │  │
│  │  POST   /api/trainings                                  │  │
│  │  PUT    /api/trainings/:id                              │  │
│  │  DELETE /api/trainings/:id                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                    MSSQL Driver (mssql)                         │
│                             │                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    TCP/IP Port 1433
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  MS SQL Server 2019                             │
│                   NSB_Training Database                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Employees Table (37 fields)                │  │
│  │                                                          │  │
│  │  PK: id (BIGINT)                                         │  │
│  │  UK: employee_no (VARCHAR)                               │  │
│  │                                                          │  │
│  │  Core: first_name, last_name, middle_name, full_name   │  │
│  │  Dept: department, position, groups                      │  │
│  │  Contact: contact_no, email_address                      │  │
│  │  Dates: date_hired, date_resign, date_of_birth          │  │
│  │  Salary: salary_type, rate_amount, monthly_salary       │  │
│  │  Comp: no_of_days_work, ot_percentage, ot_rate_amount   │  │
│  │  System: username, passwords, employee_pin, status      │  │
│  │  Time: on_duty_time, off_duty_time, schedule_tag        │  │
│  │  Admin: encode_by, store_id, machine_id, sync           │  │
│  │                                                          │  │
│  │  Indexes: employee_no, department, status               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                      FK: employee_id                            │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │          TrainingRecords Table (11 fields)              │  │
│  │                                                          │  │
│  │  PK: id (BIGINT)                                         │  │
│  │  FK: employee_id (BIGINT) → Employees(id)               │  │
│  │                                                          │  │
│  │  date_from, date_to, duration                           │  │
│  │  course_title, training_provider, venue                 │  │
│  │  trainer, type_tb, effectiveness_form                   │  │
│  │  created_at                                              │  │
│  │                                                          │  │
│  │  Indexes: employee_id, trainer, type_tb, date_from      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Sequence: seq_employee_no                   │  │
│  │                                                          │  │
│  │  START WITH 1                                            │  │
│  │  INCREMENT BY 1                                          │  │
│  │  Format: 000001, 000002, 000003...                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    public/index.html                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Header/Navigation                     │  │
│  │                  NSB Engineering Logo                    │  │
│  │              Employee Training Record System             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Sidebar Navigation                    │  │
│  │                                                          │  │
│  │  📊 Dashboard                                            │  │
│  │  👥 Employees                                            │  │
│  │     ├─ New Employee                                      │  │
│  │     ├─ Employee List                                     │  │
│  │     └─ Employee Dropdown                                 │  │
│  │  📋 Training Records                                     │  │
│  │     ├─ All Records                                       │  │
│  │     ├─ Technical (T)                                     │  │
│  │     ├─ Behavioral (B)                                    │  │
│  │     └─ By Trainer                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Main Content Area                     │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │              Dashboard View                        │ │  │
│  │  │                                                    │ │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │  │
│  │  │  │ Total    │ │ Total    │ │Technical │          │ │  │
│  │  │  │Employees │ │ Training │ │ Training │          │ │  │
│  │  │  │    6     │ │  Records │ │   12     │          │ │  │
│  │  │  │          │ │    20    │ │          │          │ │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘          │ │  │
│  │  │                                                    │ │  │
│  │  │  ┌──────────┐                                      │ │  │
│  │  │  │Behavioral│                                      │ │  │
│  │  │  │ Training │                                      │ │  │
│  │  │  │    8     │                                      │ │  │
│  │  │  └──────────┘                                      │ │  │
│  │  │                                                    │ │  │
│  │  │  [Pie Chart: Training Type Distribution]          │ │  │
│  │  │  [Top Trainers List]                              │ │  │
│  │  │  [Recent Training Records Table]                  │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │          Employee Management View                  │ │  │
│  │  │                                                    │ │  │
│  │  │  [Search Box] [Filter Dropdown] [Sort Headers]    │ │  │
│  │  │                                                    │ │  │
│  │  │  ┌──────────────────────────────────────────────┐ │ │  │
│  │  │  │ Employee List Table                          │ │ │  │
│  │  │  │                                              │ │ │  │
│  │  │  │ No. │ Name │ Dept │ Position │ Actions      │ │ │  │
│  │  │  │─────┼──────┼──────┼──────────┼──────────────│ │ │  │
│  │  │  │0001 │ Name │ Dept │ Position │ 👁️ ✏️ 🗑️    │ │ │  │
│  │  │  │     │      │      │          │              │ │ │  │
│  │  │  └──────────────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │       Training Records View                        │ │  │
│  │  │                                                    │ │  │
│  │  │  [Search] [Filter by Type] [Sort Headers]         │ │  │
│  │  │                                                    │ │  │
│  │  │  ┌──────────────────────────────────────────────┐ │ │  │
│  │  │  │ Training Records Table                       │ │ │  │
│  │  │  │                                              │ │ │  │
│  │  │  │ Date │ Course │ Provider │ Trainer │ Type   │ │ │  │
│  │  │  │──────┼────────┼──────────┼─────────┼────────│ │ │  │
│  │  │  │ Date │ Course │ Provider │ Trainer │ T/B    │ │ │  │
│  │  │  │      │        │          │         │        │ │ │  │
│  │  │  └──────────────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Modals/Dialogs                        │  │
│  │                                                          │  │
│  │  • View Employee Modal (Read-only)                      │  │
│  │  • Edit Employee Modal (Form)                           │  │
│  │  • New Employee Modal (Form)                            │  │
│  │  • View Training Modal (Read-only)                      │  │
│  │  • Edit Training Modal (Form)                           │  │
│  │  • New Training Modal (Form)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Action
    │
    ├─ Click "New Employee"
    │  └─ Show New Employee Modal
    │     └─ User fills form
    │        └─ Click "Save"
    │           └─ POST /api/employees
    │              └─ Server validates
    │                 └─ Insert into Employees table
    │                    └─ Auto-generate employee_no
    │                       └─ Return success
    │                          └─ Refresh employee list
    │
    ├─ Click "View" on employee
    │  └─ GET /api/employees/:id
    │     └─ Fetch employee + training records
    │        └─ Show View Modal
    │
    ├─ Click "Edit" on employee
    │  └─ Show Edit Modal with data
    │     └─ User modifies fields
    │        └─ Click "Save"
    │           └─ PUT /api/employees/:id
    │              └─ Server validates
    │                 └─ Update Employees table
    │                    └─ Return success
    │                       └─ Refresh list
    │
    ├─ Click "Delete" on employee
    │  └─ Confirm dialog
    │     └─ DELETE /api/employees/:id
    │        └─ Server deletes employee
    │           └─ Cascade delete training records
    │              └─ Return success
    │                 └─ Refresh list
    │
    ├─ Double-click training record
    │  └─ Show View Training Modal
    │     └─ Display all training details
    │
    ├─ Click "Add Training"
    │  └─ Show New Training Modal
    │     └─ User fills form
    │        └─ Click "Save"
    │           └─ POST /api/trainings
    │              └─ Server validates
    │                 └─ Insert into TrainingRecords
    │                    └─ Return success
    │                       └─ Refresh training list
    │
    └─ Search/Filter/Sort
       └─ Client-side filtering
          └─ Update table display
```

---

## Database Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    Employees Table                          │
├─────────────────────────────────────────────────────────────┤
│ PK: id (BIGINT)                                             │
│ UK: employee_no (VARCHAR)                                   │
│                                                             │
│ Personal Info:                                              │
│ • first_name, last_name, middle_name                        │
│ • full_name (auto-generated)                                │
│ • date_of_birth                                             │
│                                                             │
│ Employment:                                                 │
│ • department, position, groups                              │
│ • date_hired, date_resign                                   │
│                                                             │
│ Contact:                                                    │
│ • contact_no, email_address                                 │
│                                                             │
│ Compensation:                                               │
│ • salary_type, rate_amount, monthly_salary                  │
│ • no_of_days_work, ot_percentage, ot_rate_amount            │
│                                                             │
│ System:                                                     │
│ • username, passwords, employee_pin                         │
│ • status (1=Active, 0=Inactive)                             │
│                                                             │
│ Time Tracking:                                              │
│ • on_duty_time, off_duty_time                               │
│ • schedule_tag, regular_tag                                 │
│                                                             │
│ Admin:                                                      │
│ • encode_by, store_id, machine_id                           │
│ • sync, date, created_at                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          │ FK: employee_id
                          │
┌─────────────────────────▼─────────────────────────────────┐
│              TrainingRecords Table                         │
├─────────────────────────────────────────────────────────────┤
│ PK: id (BIGINT)                                             │
│ FK: employee_id (BIGINT) → Employees(id)                    │
│                                                             │
│ Training Details:                                           │
│ • date_from, date_to                                        │
│ • duration                                                  │
│ • course_title                                              │
│ • training_provider                                         │
│ • venue                                                     │
│ • trainer                                                   │
│ • type_tb (T=Technical, B=Behavioral)                       │
│ • effectiveness_form                                        │
│ • created_at                                                │
│                                                             │
│ Cascade Delete: ON DELETE CASCADE                           │
│ (Deleting employee deletes all training records)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

```
Frontend Layer:
├─ HTML5 (public/index.html)
├─ CSS3 (public/css/styles.css)
│  └─ Print styles (A4 landscape)
│  └─ Responsive design
│  └─ NSB branding
└─ JavaScript (public/src/app.js)
   ├─ Fetch API for HTTP requests
   ├─ DOM manipulation
   ├─ Event handling
   ├─ Modal management
   ├─ Search/Filter/Sort
   └─ Print functionality

Backend Layer:
├─ Node.js (v20.12.1)
├─ Express.js (4.18.2)
│  ├─ Routing
│  ├─ Middleware (CORS, JSON)
│  └─ Static file serving
├─ MSSQL Driver (10.0.2)
│  ├─ Connection pooling
│  ├─ Parameterized queries
│  └─ Error handling
└─ Async/Await patterns

Database Layer:
├─ MS SQL Server 2019
├─ NSB_Training Database
├─ Employees Table (37 fields)
├─ TrainingRecords Table (11 fields)
├─ Sequence: seq_employee_no
└─ 7 Performance Indexes

Infrastructure:
├─ Port 3000 (Express server)
├─ Port 1433 (SQL Server)
├─ TCP/IP networking
└─ File system (static assets)
```

---

## Deployment Architecture

```
Development:
┌─────────────────────────────────────────┐
│  Developer Machine                      │
│  ├─ Node.js + npm                       │
│  ├─ Express server (localhost:3000)     │
│  ├─ SQL Server 2019 (localhost:1433)    │
│  └─ Browser (http://localhost:3000)     │
└─────────────────────────────────────────┘

Production:
┌─────────────────────────────────────────┐
│  Production Server                      │
│  ├─ Node.js + npm                       │
│  ├─ Express server (port 3000)          │
│  ├─ SQL Server 2019 (port 1433)         │
│  ├─ Reverse Proxy (nginx/IIS)           │
│  └─ SSL/TLS encryption                  │
└─────────────────────────────────────────┘
         │
         └─ Users access via HTTPS
```

---

## Security Considerations

```
Frontend:
├─ Input validation
├─ XSS prevention
├─ CSRF protection
└─ Secure headers

Backend:
├─ Parameterized queries (SQL injection prevention)
├─ Input validation
├─ Error handling (no sensitive info in errors)
├─ CORS configuration
└─ Rate limiting (recommended)

Database:
├─ SQL Server authentication
├─ Encrypted passwords (recommended)
├─ Backup strategy
├─ Access control
└─ Audit logging
```

---

## Performance Optimization

```
Database:
├─ 7 indexes for fast queries
├─ Connection pooling
├─ Parameterized queries
└─ Efficient joins

Backend:
├─ Async/await for non-blocking I/O
├─ Error handling
├─ Response compression
└─ Caching (recommended)

Frontend:
├─ Client-side filtering
├─ Lazy loading (recommended)
├─ Minified CSS/JS (recommended)
└─ Image optimization
```

---

This architecture provides a scalable, maintainable, and performant system for managing employee training records at NSB Engineering!
