# Exam Flow with Authentication & RBAC

## 📊 Complete User Journey

### 1. Login Phase
```
┌─────────────────────────────────────────┐
│  User visits http://localhost:3001      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Redirected to /login.html              │
│  (auth-check.js verifies session)       │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ┌────────┐    ┌──────────┐
   │ Login  │    │ Signup   │
   └────┬───┘    └────┬─────┘
        │             │
        ▼             ▼
   POST /api/auth/login    POST /api/auth/create-account
        │                         │
        ▼                         ▼
   Verify credentials      Select employee
   Create session          Create account
   Return token            Return success
        │                         │
        └──────────┬──────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Store in localStorage│
        │ - sessionToken       │
        │ - user (JSON)        │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Redirect to          │
        │ /dashboard/          │
        │ dashboard.html       │
        └──────────────────────┘
```

### 2. Dashboard Phase
```
┌──────────────────────────────────────────┐
│  Dashboard loads                         │
│  auth-check.js runs                      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  POST /api/auth/verify-session           │
│  (Verify token is still valid)           │
└──────────────┬───────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ✅ Valid      ❌ Invalid/Expired
        │             │
        ▼             ▼
   Display      Redirect to
   Dashboard    /login.html
        │
        ▼
┌──────────────────────────────────────────┐
│  Show User Info                          │
│  - Name: <userName>                      │
│  - Role: <userRole>                      │
│  - Department: <userDepartment>          │
└──────────────┬───────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        │             │          │
        ▼             ▼          ▼
   Admin      Manager      Employee
   Features   Features     Features
```

### 3. Exam Access Phase

#### Admin/Manager View
```
┌─────────────────────────────────────────┐
│  Dashboard - Admin/Manager               │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        │             │          │
        ▼             ▼          ▼
   View All    Assign      Create
   Exams       Exams       Exams
        │
        ▼
   GET /api/exams
        │
        ▼
   Display exam list
   with employee names
```

#### Employee View
```
┌─────────────────────────────────────────┐
│  Dashboard - Employee                    │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   View My      Take
   Exams        Exam
        │
        ▼
   GET /api/exams
   (filtered by employee_id)
        │
        ▼
   Display available exams
```

### 4. Taking Exam Phase
```
┌──────────────────────────────────────────┐
│  Employee clicks "Take Exam"             │
│  (Session token verified)                │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Load exam questions                     │
│  GET /api/exams/:id                      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Display exam form                       │
│  - Questions                             │
│  - Answer options                        │
│  - Timer (if applicable)                 │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Employee answers questions              │
│  and submits                             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  POST /api/exam-results                  │
│  - employee_id (from session)            │
│  - exam_id                               │
│  - answers                               │
│  - score                                 │
│  - timestamp                             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Calculate score                         │
│  Store in ExamResults table              │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Display results                         │
│  - Score                                 │
│  - Pass/Fail                             │
│  - Correct answers                       │
└──────────────────────────────────────────┘
```

### 5. Results & Analytics Phase
```
┌──────────────────────────────────────────┐
│  View Exam Results                       │
└──────────────┬───────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        │             │          │
        ▼             ▼          ▼
   Admin        Manager      Employee
   - All        - Team       - Own
     results      results      results
        │
        ▼
   GET /api/exam-results/employee/:id
        │
        ▼
   Display analytics
   - Score trends
   - Pass rate
   - Comparison
```

## 🔐 Security at Each Step

### Login
```
Username + Password
        │
        ▼
Validate against Users table
        │
        ▼
Hash password with SHA256
        │
        ▼
Compare with stored hash
        │
        ▼
✅ Match → Create session
❌ No match → Reject login
```

### Session Management
```
Session Token (32-byte hex)
        │
        ▼
Store in Sessions table
        │
        ├─ user_id
        ├─ session_token
        ├─ ip_address
        ├─ user_agent
        ├─ created_at
        └─ expires_at (24 hours)
        │
        ▼
On each request:
Verify token exists
Verify not expired
Verify user is active
        │
        ▼
✅ Valid → Allow access
❌ Invalid → Redirect to login
```

### RBAC at Exam Access
```
User requests exam
        │
        ▼
Check user role
        │
    ┌───┴───┬────────┐
    │       │        │
    ▼       ▼        ▼
  Admin   Manager  Employee
    │       │        │
    ▼       ▼        ▼
  All     Team    Own only
  exams   exams   exams
```

## 📋 Database Relationships

```
Employees (existing)
    │
    ├─ id
    ├─ employee_no
    ├─ full_name
    ├─ department
    └─ position
    │
    ▼
Users (new)
    │
    ├─ id
    ├─ employee_id (FK)
    ├─ username
    ├─ password_hash
    ├─ role
    └─ is_active
    │
    ▼
Sessions (new)
    │
    ├─ id
    ├─ user_id (FK)
    ├─ session_token
    ├─ expires_at
    └─ ...
    │
    ▼
ExamResults (existing)
    │
    ├─ id
    ├─ employee_id (FK)
    ├─ exam_id
    ├─ score
    └─ ...
```

## 🎯 Role-Based Exam Access

### Admin
```
✅ View all exams
✅ Create exams
✅ Edit exams
✅ Delete exams
✅ View all results
✅ Assign exams to employees
✅ Generate reports
✅ Manage users
```

### Manager
```
✅ View team exams
✅ View team results
✅ Assign exams to team
✅ Generate team reports
❌ Create exams
❌ Delete exams
❌ Manage users
```

### Employee
```
✅ View assigned exams
✅ Take exams
✅ View own results
✅ View own score trends
❌ View other results
❌ Create exams
❌ Assign exams
```

## 🔄 API Call Flow with Authentication

### Example: Employee Taking Exam

```javascript
// 1. Get session token from localStorage
const sessionToken = localStorage.getItem('sessionToken');

// 2. Get exam details
fetch('/api/exams/1', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
})

// 3. Submit exam answers
fetch('/api/exam-results', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    exam_id: 1,
    answers: [...],
    score: 85
  })
})

// 4. Get results
fetch('/api/exam-results/employee/1', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
})
```

## 📊 Exam Flow Summary

```
┌─────────────────────────────────────────────────────────┐
│                    COMPLETE EXAM FLOW                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. LOGIN                                               │
│     └─ Verify credentials                               │
│     └─ Create session                                   │
│     └─ Store token                                      │
│                                                         │
│  2. DASHBOARD                                           │
│     └─ Verify session                                   │
│     └─ Display user info                                │
│     └─ Show role-based features                         │
│                                                         │
│  3. VIEW EXAMS                                          │
│     └─ Filter by role                                   │
│     └─ Display available exams                          │
│                                                         │
│  4. TAKE EXAM                                           │
│     └─ Load questions                                   │
│     └─ Display form                                     │
│     └─ Submit answers                                   │
│                                                         │
│  5. RESULTS                                             │
│     └─ Calculate score                                  │
│     └─ Store in database                                │
│     └─ Display results                                  │
│                                                         │
│  6. ANALYTICS                                           │
│     └─ View trends                                      │
│     └─ Compare scores                                   │
│     └─ Generate reports                                 │
│                                                         │
│  7. LOGOUT                                              │
│     └─ Delete session                                   │
│     └─ Clear localStorage                               │
│     └─ Redirect to login                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Implementation Checklist

- [x] Create Users table
- [x] Create Sessions table
- [x] Create login page
- [x] Create signup page
- [x] Implement authentication endpoints
- [x] Implement RBAC middleware
- [x] Add session verification
- [x] Add logout functionality
- [ ] Implement exam access control
- [ ] Add role-based exam filtering
- [ ] Add audit logging
- [ ] Add password reset
- [ ] Add email verification
- [ ] Implement 2FA

## 📝 Notes

- Session tokens expire after 24 hours
- Passwords are hashed with SHA256 (use bcrypt in production)
- CORS is enabled for development
- All API calls require valid session token
- User role determines feature access
- Employee ID is automatically set from session
