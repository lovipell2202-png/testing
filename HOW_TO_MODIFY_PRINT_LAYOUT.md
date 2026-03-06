# How to Modify Print Layout

## Files You Need to Edit

### 1. Print CSS Styles
**File:** `public/css/styles.css`
**Line:** Around 322 (search for `@media print`)

This controls how the page looks when printed.

### 2. Print Modal HTML Structure
**File:** `public/index.html`
**Line:** Search for `print-modal-header`

This is the HTML structure that gets printed.

### 3. Print Function (JavaScript)
**File:** `public/src/app.js`
**Function:** `printEmployeeTraining()` (around line 877)

This function prepares the data for printing.

## What Each Part Controls

### A. Print Header (Logo and Company Name)

**Location:** `public/index.html` - Inside the modal

```html
<div class="print-modal-header" style="display: none;">
  <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 2px solid #1a2340;">
    <img src="NSB-LOGO.png" alt="NSB Logo" style="width: 80px; height: 80px; margin-right: 15px;">
    <div style="text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #1a2340;">NSB ENGINEERING</h1>
      <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">Design and Fabrication</p>
    </div>
  </div>
  <div style="text-align: center; font-size: 14px; font-weight: 700; margin: 12px 0; padding: 6px; border: 2px solid #1a2340;">
    EMPLOYEE TRAINING RECORD
  </div>
</div>
```

**To modify:**
- Logo size: Change `width: 80px; height: 80px;`
- Company name size: Change `font-size: 20px;`
- Title size: Change `font-size: 14px;`

### B. Print CSS (Fonts, Spacing, Layout)

**Location:** `public/css/styles.css` - Line ~322

```css
@media print {
  /* Page setup */
  @page {
    size: A4 landscape;
    margin: 5mm;
  }
  
  /* Table font size */
  .modal-overlay.printing table {
    font-size: 11px !important;
  }
  
  .modal-overlay.printing table th,
  .modal-overlay.printing table td {
    padding: 4px 5px !important;
    font-size: 11px !important;
  }
  
  /* Header sizes */
  .modal-overlay.printing .print-modal-header h1 {
    font-size: 16px !important;
  }
  
  .modal-overlay.printing .print-modal-header p {
    font-size: 9px !important;
  }
}
```

**To modify:**
- Table font: Change `font-size: 11px` to your desired size
- Page margins: Change `margin: 5mm`
- Page orientation: Change `landscape` to `portrait`

### C. Employee Info Section

**Location:** `public/src/app.js` - Function `openEmployeeTrainingOverview()`

This generates the employee info HTML:

```javascript
const empInfoHtml = `
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 20px; font-size: 12px;">
    <div><strong>Employee Name:</strong><br>${emp.full_name || emp.employee_name}</div>
    <div><strong>Department:</strong><br>${emp.department}</div>
    <div><strong>Date Hired:</strong><br>${formatDate(emp.date_hired)}</div>
    <div><strong>Employee No.:</strong><br>${emp.employee_no}</div>
    <div><strong>Position:</strong><br>${emp.position}</div>
  </div>
`;
```

**To modify:**
- Font size: Change `font-size: 12px;`
- Layout: Change `grid-template-columns: 1fr 1fr 1fr;` (3 columns)
- Spacing: Change `gap: 8px 20px;`

### D. Training Table

**Location:** `public/src/app.js` - Function `openEmployeeTrainingOverview()`

The table is generated here:

```javascript
const tableHtml = `
  <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
    <thead>
      <tr>
        <th>DATE FROM</th>
        <th>DATE TO</th>
        <th>DURATION</th>
        <th>COURSE TITLE</th>
        <th>PROVIDER</th>
        <th>VENUE</th>
        <th>TRAINER</th>
        <th>TYPE</th>
        <th>EFF. FORM</th>
      </tr>
    </thead>
    <tbody>
      ${trainings.map(t => `
        <tr>
          <td>${formatDate(t.date_from)}</td>
          <td>${formatDate(t.date_to)}</td>
          <td>${t.duration}</td>
          <td style="text-align: left;">${t.course_title}</td>
          <td>${t.training_provider}</td>
          <td>${t.venue}</td>
          <td>${t.trainer}</td>
          <td>${t.type_tb}</td>
          <td>${t.effectiveness_form}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;
```

**To modify:**
- Column headers: Change the `<th>` text
- Column order: Rearrange the `<th>` and `<td>` elements
- Add/remove columns: Add/remove `<th>` and corresponding `<td>`

## Quick Modifications

### Change Table Font Size to 13px

**File:** `public/css/styles.css`

Find this section (around line 380):

```css
.modal-overlay.printing table th,
.modal-overlay.printing table td {
  padding: 4px 5px !important;
  font-size: 11px !important;  /* CHANGE THIS */
  line-height: 1.3 !important;
}
```

Change to:
```css
font-size: 13px !important;
```

### Change Page Margins

**File:** `public/css/styles.css`

Find this section (around line 325):

```css
@page {
  size: A4 landscape;
  margin: 5mm;  /* CHANGE THIS */
}
```

Change to:
```css
margin: 10mm;  /* Larger margins */
```

### Change Logo Size

**File:** `public/index.html`

Search for `print-modal-header` and find:

```html
<img src="NSB-LOGO.png" alt="NSB Logo" style="width: 80px; height: 80px;">
```

Change to:
```html
<img src="NSB-LOGO.png" alt="NSB Logo" style="width: 100px; height: 100px;">
```

### Change Company Name Position

**File:** `public/css/styles.css`

Find this section (around line 410):

```css
.modal-overlay.printing .print-modal-header > div:first-child {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;  /* CHANGE THIS */
}
```

Options:
- `space-between` - Logo left, name right
- `center` - Both centered
- `flex-start` - Both left
- `flex-end` - Both right

## Testing Your Changes

1. **Edit the file** in your code editor
2. **Save the file** (Ctrl+S)
3. **Refresh browser** (Ctrl+Shift+R)
4. **Open employee modal** and click Print
5. **Check print preview**

## Common Modifications

### Make Everything Bigger
1. Change `@page margin: 5mm;` to `margin: 8mm;`
2. Change table `font-size: 11px` to `font-size: 13px`
3. Change header `font-size: 16px` to `font-size: 18px`

### Fit More Data
1. Change `@page margin: 5mm;` to `margin: 3mm;`
2. Change table `font-size: 11px` to `font-size: 9px`
3. Change `padding: 4px 5px` to `padding: 2px 3px`

### Change to Portrait
```css
@page {
  size: A4 portrait;  /* Change from landscape */
  margin: 10mm;
}
```

## File Locations Summary

```
project/
├── public/
│   ├── css/
│   │   └── styles.css          ← Print CSS (@media print)
│   ├── src/
│   │   └── app.js              ← Print function (printEmployeeTraining)
│   └── index.html              ← Print HTML structure (print-modal-header)
```

## Need Help?

If you want to make a specific change, tell me:
1. What you want to change (font size, spacing, layout, etc.)
2. Where it should change (header, table, employee info, etc.)
3. What the new value should be

I'll show you exactly which file and line to edit!
