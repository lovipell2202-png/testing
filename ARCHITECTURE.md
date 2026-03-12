# Architecture Overview

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    HTML Page                                │
│  (index.html, training-records.html, etc.)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   app-refactored.js                         │
│              (Main Entry Point)                             │
│  - Initializes on DOMContentLoaded                          │
│  - Exposes all functions to window                          │
│  - Loads data and renders dashboard                         │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬──────────────┐
        ▼                ▼                ▼              ▼
   ┌─────────┐    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
   │ UIHelpers│    │DropdownMgr   │  │DataLoader│  │EmployeeMgr   │
   ├─────────┤    ├──────────────┤  ├──────────┤  ├──────────────┤
   │ • Modal  │    │ • Load opts  │  │ • Fetch  │  │ • Add emp    │
   │ • Notify │    │ • Update     │  │ • Parse  │  │ • Edit emp   │
   │ • Format │    │ • Populate   │  │ • Store  │  │ • Delete emp │
   │ • Toast  │    │   dropdowns  │  │   data   │  │ • Select emp │
   └─────────┘    └──────────────┘  └──────────┘  └──────────────┘
        ▲                ▲                ▲              ▲
        │                │                │              │
        └────────────────┼────────────────┼──────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ TrainingManager  │
                ├──────────────────┤
                │ • Add training   │
                │ • Edit training  │
                │ • Delete training│
                │ • View training  │
                │ • Overview modal │
                │ • Save training  │
                └──────────────────┘
```

## Data Flow

### 1. Page Load
```
User opens page
    ↓
DOMContentLoaded event fires
    ↓
app-refactored.js initializes
    ↓
updateDatalistOptions() called
    ↓
loadEmployees() called
    ↓
API calls fetch data
    ↓
window.employees & window.trainings populated
    ↓
renderDashboard() displays data
```

### 2. Add Employee
```
User clicks "Add Employee"
    ↓
openAddEmp() (EmployeeManager)
    ↓
Modal opens (UIHelpers.openModal)
    ↓
User fills form and clicks Save
    ↓
saveEmployee() (EmployeeManager)
    ↓
API POST request
    ↓
loadEmployees() reloads data (DataLoader)
    ↓
Dashboard refreshes
    ↓
showNotification() displays success (UIHelpers)
```

### 3. Add Training
```
User clicks "Add Training"
    ↓
openAddTraining() (TrainingManager)
    ↓
populateEmployeeDropdown() (DropdownManager)
    ↓
Modal opens (UIHelpers.openModal)
    ↓
User fills form and clicks Save
    ↓
saveTraining() (TrainingManager)
    ↓
API POST request
    ↓
loadEmployees() reloads data (DataLoader)
    ↓
openEmployeeTrainingOverview() refreshes (TrainingManager)
    ↓
showNotification() displays success (UIHelpers)
```

## Module Interactions

### UIHelpers ↔ All Modules
- Used by: EmployeeManager, TrainingManager
- Provides: Notifications, modals, formatting
- Called by: Almost every user action

### DropdownManager ↔ TrainingManager
- Used by: TrainingManager (when opening training modals)
- Provides: Employee dropdown population
- Called by: openAddTrainingForEmployee, openEditTraining

### DataLoader ↔ EmployeeManager & TrainingManager
- Used by: EmployeeManager, TrainingManager
- Provides: Fresh data from API
- Called by: After save/delete operations

### EmployeeManager ↔ TrainingManager
- Used by: TrainingManager (for employee context)
- Provides: Current employee info
- Called by: When adding training for specific employee

## Global State

```javascript
window.employees = []        // Array of employee objects
window.trainings = []        // Array of training objects
window.currentEmp = null     // Currently selected employee
window.editTrainId = null    // ID of training being edited
window.currentOverviewEmpId  // Employee in overview modal
```

## API Endpoints Used

```
GET  /api/employees          → Load all employees
GET  /api/employees/:id      → Load single employee
POST /api/employees          → Create employee
PUT  /api/employees/:id      → Update employee
DELETE /api/employees/:id    → Delete employee

GET  /api/trainings          → Load all trainings
POST /api/trainings          → Create training
PUT  /api/trainings/:id      → Update training
DELETE /api/trainings/:id    → Delete training

GET  /api/courses            → Load courses for dropdown
```

## Error Handling

All modules follow consistent error handling:

```javascript
try {
  // Attempt operation
  const res = await fetch(url);
  const data = await res.json();
  
  if (!data.success) {
    // Show error notification
    window.UIHelpers.showNotification('Error', data.message, false);
    return;
  }
  
  // Show success notification
  window.UIHelpers.showNotification('Success', 'Operation completed!', true);
  
  // Reload data
  await window.DataLoader.loadEmployees();
  
} catch (err) {
  console.error('Error:', err);
  window.UIHelpers.showNotification('Error', 'An error occurred', false);
}
```

## Adding a New Module

To add a new feature module:

1. Create `public/src/modules/my-feature.js`
2. Define your functions
3. Export to window:
   ```javascript
   window.MyFeature = {
     myFunction,
     anotherFunction
   };
   ```
4. Add script tag to HTML (after dependencies)
5. Use in code: `window.MyFeature.myFunction()`

Example:
```javascript
// public/src/modules/export-manager.js
async function exportToCSV() {
  const data = window.employees;
  // ... export logic
  window.UIHelpers.showNotification('Exported', 'File downloaded', true);
}

window.ExportManager = {
  exportToCSV
};
```

## Performance Considerations

- **Lazy Loading**: Data only loads when needed
- **Caching**: Dropdown options cached in localStorage
- **Minimal Re-renders**: Only affected sections update
- **Efficient Queries**: Single API call loads all data

## Security Notes

- All API calls use same-origin (empty API constant)
- No sensitive data in localStorage (only dropdown options)
- Form validation before API calls
- Confirmation dialogs for destructive operations
