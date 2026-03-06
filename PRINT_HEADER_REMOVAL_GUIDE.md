# How to Remove Browser Headers When Printing

## The Issue

The browser adds headers and footers automatically when printing:
- **Top**: Page title and URL
- **Bottom**: Date and page numbers

These are added by the browser, NOT by the website code.

## Solution: Disable Browser Headers

### Method 1: Chrome/Brave Print Settings (Recommended)

1. Click **Print** button (or Ctrl+P)
2. In the print dialog, click **More settings**
3. **UNCHECK** "Headers and footers"
4. Click **Print** or **Save as PDF**

### Method 2: Firefox Print Settings

1. Click **Print** button (or Ctrl+P)
2. Click **More settings**
3. **UNCHECK** "Print headers and footers"
4. Click **Print** or **Save as PDF**

### Method 3: Edge Print Settings

1. Click **Print** button (or Ctrl+P)
2. Click **More settings**
3. **UNCHECK** "Headers and footers"
4. Click **Print** or **Save as PDF**

## What I Fixed in the Code

### Updated Print CSS:
1. ✅ Set proper @page margins
2. ✅ Removed all body/html margins
3. ✅ Clean white background
4. ✅ Optimized for A4 landscape
5. ✅ Single page layout

### The CSS Cannot Remove Browser Headers

Browser headers are added by the browser's print engine, NOT by the website. The only way to remove them is through the print dialog settings.

## Best Practice for Users

### Create a Print Instruction

Add this note to your users:

```
PRINTING INSTRUCTIONS:
1. Click the Print button
2. In the print dialog, click "More settings"
3. Uncheck "Headers and footers"
4. Click Print or Save as PDF
```

## Alternative: Use PDF Generation

If you want to avoid browser print headers entirely, you can:

1. Use a PDF generation library (like jsPDF or Puppeteer)
2. Generate PDF on the server side
3. Download the PDF directly

This way users get a clean PDF without needing to adjust print settings.

## Current Print Layout

The print CSS is optimized for:
- ✅ A4 Landscape format
- ✅ Single page
- ✅ Clean margins (8mm)
- ✅ Professional header with logo
- ✅ Company information
- ✅ Employee training table
- ✅ Footer with form reference

## Testing the Print

1. Open employee training modal
2. Click Print button
3. In print preview:
   - Click "More settings"
   - Uncheck "Headers and footers"
4. Should show clean page with only:
   - NSB logo (left)
   - Company name (right)
   - Employee Training Record title
   - Employee info
   - Training table
   - Form reference footer

## Summary

**Browser headers cannot be removed by code** - they must be disabled in the print dialog by unchecking "Headers and footers" in the print settings.

The CSS is already optimized for clean printing once the browser headers are disabled.
