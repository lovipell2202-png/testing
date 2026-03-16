// Upload Test Result Management
const API = '';
let currentCourses = [];

// File type configurations for each document type
const fileTypeConfig = {
  'W/EXAM': {
    accept: '.pdf',
    allowedExtensions: ['.pdf'],
    allowedMimeTypes: ['application/pdf'],
    description: 'PDF files only (.pdf)'
  },
  'W/TEEF': {
    accept: '.pdf,.png,.jpg,.jpeg',
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
    description: 'PDF, PNG, JPG, or JPEG files (.pdf, .png, .jpg, .jpeg)'
  },
  'W/EXAM_TEEF': {
    accept: '.pdf,.png,.jpg,.jpeg',
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
    description: 'PDF, PNG, JPG, or JPEG files (.pdf, .png, .jpg, .jpeg)'
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Upload Test Result page loaded');
  setupFileUpload();
  loadCourses();
  loadEmployees();
  
  // Setup initial drag and drop
  setupDragDrop('uploadArea', 'fileInput');
  setupDragDrop('uploadAreaExam', 'fileInputExam');
  setupDragDrop('uploadAreaCert', 'fileInputCert');
});

// Update file accept attribute based on document type selection
function updateFileAccept() {
  const documentType = document.getElementById('documentType').value;
  const fileInput = document.getElementById('fileInput');
  const fileTypeInfo = document.getElementById('fileTypeInfo');
  const fileTypeInfoText = document.getElementById('fileTypeInfoText');
  const uploadText = document.getElementById('uploadText');
  const browseText = document.getElementById('browseText');
  
  if (!documentType) {
    fileInput.accept = '.docx,.pdf,.png,.jpg,.jpeg';
    fileTypeInfo.style.display = 'none';
    uploadText.textContent = 'Drag and drop your file here';
    browseText.textContent = 'or click to browse';
    return;
  }
  
  const config = fileTypeConfig[documentType];
  if (config) {
    fileInput.accept = config.accept;
    fileTypeInfo.style.display = 'block';
    fileTypeInfoText.textContent = '📄 ' + config.description;
    uploadText.textContent = 'Upload ' + documentType + ' Document';
    browseText.textContent = 'Supported formats: ' + config.description;
  }
}

// Load employees for certificate upload
async function loadEmployees() {
  try {
    const response = await fetch('/api/employees');
    const data = await response.json();
    
    if (data.success && data.data) {
      const select = document.getElementById('employeeSelect');
      select.innerHTML = '<option value="">-- Select an employee --</option>';
      
      data.data.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.full_name || `${emp.first_name} ${emp.last_name}`;
        select.appendChild(option);
      });
      
      console.log('✅ Loaded employees:', data.data.length);
    }
  } catch (err) {
    console.error('Error loading employees:', err);
  }
}

// Load courses taken by selected employee
async function loadEmployeeCourses() {
  const employeeId = document.getElementById('employeeSelect').value;
  const courseSelect = document.getElementById('courseSelectUpload');
  
  if (!employeeId) {
    courseSelect.innerHTML = '<option value="">-- Select a course --</option>';
    document.getElementById('courseDocTypeInfo').style.display = 'none';
    return;
  }
  
  try {
    const response = await fetch(`/api/trainings`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const employeeTrainings = data.data.filter(t => t.employee_id == employeeId);
      const uniqueCoursesMap = {};
      
      employeeTrainings.forEach(t => {
        if (!uniqueCoursesMap[t.course_title]) {
          uniqueCoursesMap[t.course_title] = {
            title: t.course_title,
            effectivenessForms: []
          };
        }
        
        if (t.effectiveness_form && !uniqueCoursesMap[t.course_title].effectivenessForms.includes(t.effectiveness_form)) {
          uniqueCoursesMap[t.course_title].effectivenessForms.push(t.effectiveness_form);
        }
      });
      
      const uniqueCourses = Object.values(uniqueCoursesMap);
      courseSelect.innerHTML = '<option value="">-- Select a course --</option>';
      
      uniqueCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.title;
        option.textContent = course.title;
        option.dataset.effectivenessForms = JSON.stringify(course.effectivenessForms);
        option.dataset.hasExam = course.effectivenessForms.includes('W/EXAM');
        option.dataset.hasTeef = course.effectivenessForms.includes('W/TEEF');
        option.dataset.hasExamTeef = course.effectivenessForms.includes('W/EXAM_TEEF');
        courseSelect.appendChild(option);
      });
      
      if (uniqueCourses.length === 0) {
        courseSelect.innerHTML = '<option value="">No courses found for this employee</option>';
        document.getElementById('courseDocTypeInfo').style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error loading employee courses:', err);
  }
}

// Update document type based on selected course
function updateCourseDocumentType() {
  const courseSelect = document.getElementById('courseSelectUpload');
  const selectedOption = courseSelect.options[courseSelect.selectedIndex];
  const documentTypeSelect = document.getElementById('documentType');
  const attachmentTypesDisplay = document.getElementById('attachmentTypesDisplay');
  const attachmentTypesList = document.getElementById('attachmentTypesList');
  
  if (!selectedOption.value) {
    // Clear document type when course is deselected
    documentTypeSelect.value = '';
    attachmentTypesDisplay.style.display = 'none';
    updateFileAccept();
    return;
  }
  
  // Get effectiveness forms from the selected course option
  let effectivenessForms = [];
  try {
    effectivenessForms = JSON.parse(selectedOption.dataset.effectivenessForms || '[]');
  } catch (e) {
    console.error('Error parsing effectiveness forms:', e);
  }
  
  console.log('Effectiveness forms for course:', effectivenessForms);
  
  let suggestedDocType = '';
  let attachmentTypes = [];
  
  // Determine the suggested document type and build attachment display
  if (effectivenessForms.includes('W/EXAM_TEEF')) {
    suggestedDocType = 'W/EXAM_TEEF';
    attachmentTypes.push('<span style="padding: 8px 14px; background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; font-size: 13px; font-weight: 600; color: #1565c0;">📄 Exam (PDF)</span>');
    attachmentTypes.push('<span style="padding: 8px 14px; background: #f3e5f5; border: 1px solid #9c27b0; border-radius: 4px; font-size: 13px; font-weight: 600; color: #6a1b9a;">🎓 Certificate (PDF/PNG/JPG)</span>');
  } else if (effectivenessForms.includes('W/EXAM')) {
    suggestedDocType = 'W/EXAM';
    attachmentTypes.push('<span style="padding: 8px 14px; background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; font-size: 13px; font-weight: 600; color: #1565c0;">📄 Exam (PDF)</span>');
  } else if (effectivenessForms.includes('W/TEEF')) {
    suggestedDocType = 'W/TEEF';
    attachmentTypes.push('<span style="padding: 8px 14px; background: #f3e5f5; border: 1px solid #9c27b0; border-radius: 4px; font-size: 13px; font-weight: 600; color: #6a1b9a;">🎓 Certificate (PDF/PNG/JPG)</span>');
  }
  
  if (suggestedDocType) {
    documentTypeSelect.value = suggestedDocType;
    
    // Display attachment types
    if (attachmentTypes.length > 0) {
      attachmentTypesList.innerHTML = attachmentTypes.join('');
      attachmentTypesDisplay.style.display = 'block';
    }
    
    updateFileAccept();
    updateFileUploadUI();
    console.log('Auto-filled document type:', suggestedDocType);
  }
  
  fetchCurrentAttachment();
}

// Fetch current attachment from training record
async function fetchCurrentAttachment() {
  const employeeId = document.getElementById('employeeSelect').value;
  const courseName = document.getElementById('courseSelectUpload').value;
  const currentAttachmentInfo = document.getElementById('currentAttachmentInfo');
  const currentAttachmentDetails = document.getElementById('currentAttachmentDetails');
  const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');
  
  if (!employeeId || !courseName) {
    currentAttachmentInfo.style.display = 'none';
    return;
  }
  
  try {
    console.log('Fetching attachment for:', { employeeId, courseName });
    
    const response = await fetch(`/api/trainings/employee/${employeeId}/course/${encodeURIComponent(courseName)}`);
    const data = await response.json();
    
    console.log('Attachment fetch response:', data);
    
    if (data.success && data.data && data.data.length > 0) {
      const trainingRecord = data.data[0];
      let attachmentHTML = '';
      
      if (trainingRecord.eff_form_file) {
        const fileName = trainingRecord.eff_form_file.split('/').pop();
        // Get employee name for custom filename
        const employeeName = (trainingRecord.full_name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
        const courseName = (trainingRecord.course_title || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_');
        const downloadFileName = `${employeeName}_${courseName}.pdf`;
        attachmentHTML = `
          <div style="padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;">
            <p style="margin: 5px 0;"><strong>File:</strong> ${fileName}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${trainingRecord.effectiveness_form}</p>
            <a href="${trainingRecord.eff_form_file}" target="_blank" download="${downloadFileName}" style="color: #2196f3; text-decoration: none; font-weight: 600;">📥 Download File</a>
          </div>
        `;
        removeAttachmentBtn.style.display = 'inline-block';
      } else {
        attachmentHTML = '<p style="margin: 0; color: #999;">No attachment uploaded yet</p>';
        removeAttachmentBtn.style.display = 'none';
      }
      
      currentAttachmentDetails.innerHTML = attachmentHTML;
      currentAttachmentInfo.style.display = 'block';
    } else {
      currentAttachmentInfo.style.display = 'none';
    }
  } catch (err) {
    console.error('Error fetching attachment:', err);
    currentAttachmentInfo.style.display = 'none';
  }
}

// Setup file upload drag and drop
function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    fileInput.files = e.dataTransfer.files;
    handleFileSelection();
  });
}

// Handle file selection (show upload button)
function handleFileSelection() {
  const fileInput = document.getElementById('fileInput');
  
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    checkFilesReady();
  }
}

// Load all courses
async function loadCourses() {
  try {
    const response = await fetch(`${API}/api/courses`);
    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      currentCourses = data.data;
      console.log('✅ Loaded courses:', currentCourses.length);
    }
  } catch (err) {
    console.error('Error loading courses:', err);
  }
}


// Handle exam file selection
function handleExamFileSelection() {
  const fileInput = document.getElementById('fileInputExam');
  const examFileSelected = document.getElementById('examFileSelected');
  const examFileName = document.getElementById('examFileName');
  
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    examFileName.textContent = file.name;
    examFileSelected.style.display = 'block';
    checkFilesReady();
  }
}

// Handle certificate file selection
function handleCertFileSelection() {
  const fileInput = document.getElementById('fileInputCert');
  const certFileSelected = document.getElementById('certFileSelected');
  const certFileName = document.getElementById('certFileName');
  
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    certFileName.textContent = file.name;
    certFileSelected.style.display = 'block';
    checkFilesReady();
  }
}

// Check if files are ready for upload
function checkFilesReady() {
  const documentType = document.getElementById('documentType').value;
  const uploadBtn = document.getElementById('uploadBtn');
  
  if (documentType === 'W/EXAM_TEEF') {
    // For dual upload, show button if at least one file is selected
    const examFile = document.getElementById('fileInputExam').files.length > 0;
    const certFile = document.getElementById('fileInputCert').files.length > 0;
    
    if (examFile || certFile) {
      uploadBtn.style.display = 'inline-block';
    } else {
      uploadBtn.style.display = 'none';
    }
  } else {
    // For single upload, show button if file is selected
    const singleFile = document.getElementById('fileInput').files.length > 0;
    if (singleFile) {
      uploadBtn.style.display = 'inline-block';
    } else {
      uploadBtn.style.display = 'none';
    }
  }
}

// Update file upload UI based on document type
function updateFileUploadUI() {
  const documentType = document.getElementById('documentType').value;
  const singleFileSection = document.getElementById('singleFileSection');
  const dualFileSection = document.getElementById('dualFileSection');
  const uploadBtn = document.getElementById('uploadBtn');
  
  if (documentType === 'W/EXAM_TEEF') {
    singleFileSection.style.display = 'none';
    dualFileSection.style.display = 'block';
    
    // Setup drag and drop for exam file
    setupDragDrop('uploadAreaExam', 'fileInputExam');
    setupDragDrop('uploadAreaCert', 'fileInputCert');
  } else {
    singleFileSection.style.display = 'block';
    dualFileSection.style.display = 'none';
    
    // Setup drag and drop for single file
    setupDragDrop('uploadArea', 'fileInput');
  }
  
  uploadBtn.style.display = 'none';
}

// Setup drag and drop for file areas
function setupDragDrop(areaId, inputId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  
  if (!area) return;
  
  area.addEventListener('click', () => input.click());
  
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.style.background = '#f0f0f0';
  });
  
  area.addEventListener('dragleave', () => {
    area.style.background = '';
  });
  
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.style.background = '';
    input.files = e.dataTransfer.files;
    
    if (inputId === 'fileInputExam') {
      handleExamFileSelection();
    } else if (inputId === 'fileInputCert') {
      handleCertFileSelection();
    } else {
      handleFileSelection();
    }
  });
}

// Upload selected file(s)
async function uploadSelectedFile() {
  const documentType = document.getElementById('documentType').value;
  const employeeId = document.getElementById('employeeSelect').value;
  const courseName = document.getElementById('courseSelectUpload').value;
  
  if (!employeeId) {
    alert('Please select an employee');
    return;
  }
  
  if (!courseName) {
    alert('Please select a course');
    return;
  }
  
  if (!documentType) {
    alert('Please select a document type');
    return;
  }
  
  try {
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadResult').style.display = 'none';
    
    if (documentType === 'W/EXAM_TEEF') {
      // Upload both files (or whichever are selected)
      const examFile = document.getElementById('fileInputExam').files[0];
      const certFile = document.getElementById('fileInputCert').files[0];
      
      if (!examFile && !certFile) {
        alert('Please select at least one file (exam or certificate)');
        document.getElementById('uploadProgress').style.display = 'none';
        return;
      }
      
      // Upload exam file if selected
      if (examFile) {
        console.log('Uploading exam file:', examFile.name);
        await uploadFile(examFile, employeeId, courseName, 'W/EXAM');
      }
      
      // Upload certificate file if selected
      if (certFile) {
        console.log('Uploading certificate file:', certFile.name);
        await uploadFile(certFile, employeeId, courseName, 'W/TEEF');
      }
      
      const filesUploaded = (examFile ? 'Exam' : '') + (examFile && certFile ? ' & ' : '') + (certFile ? 'Certificate' : '');
      document.getElementById('uploadResultText').textContent = `✅ ${filesUploaded} uploaded successfully!`;
      
      // Clear files
      if (examFile) {
        document.getElementById('fileInputExam').value = '';
        document.getElementById('examFileSelected').style.display = 'none';
      }
      if (certFile) {
        document.getElementById('fileInputCert').value = '';
        document.getElementById('certFileSelected').style.display = 'none';
      }
    } else {
      // Upload single file
      const file = document.getElementById('fileInput').files[0];
      
      if (!file) {
        alert('Please select a file');
        document.getElementById('uploadProgress').style.display = 'none';
        return;
      }
      
      console.log('Uploading file:', file.name);
      await uploadFile(file, employeeId, courseName, documentType);
      
      document.getElementById('uploadResultText').textContent = `✅ File uploaded successfully!`;
      
      // Clear file
      document.getElementById('fileInput').value = '';
    }
    
    document.getElementById('uploadResult').style.display = 'block';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('uploadBtn').style.display = 'none';
    
    // Refresh attachment info
    setTimeout(() => {
      fetchCurrentAttachment();
    }, 1000);
  } catch (err) {
    console.error('Upload error:', err);
    document.getElementById('uploadResultText').textContent = `❌ Error: ${err.message}`;
    document.getElementById('uploadResult').style.display = 'block';
    document.getElementById('uploadProgress').style.display = 'none';
  }
}

// Helper function to upload a single file
async function uploadFile(file, employeeId, courseName, documentType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('employee_id', employeeId);
  formData.append('course_title', courseName);
  formData.append('document_type', documentType);
  
  console.log('Uploading file:', file.name, 'Type:', documentType);
  
  const response = await fetch(`${API}/api/tests/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  console.log('Upload response:', data);

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Upload failed');
  }
  
  return data;
}

// Clear file selection
function clearFileSelection() {
  document.getElementById('fileInput').value = '';
  document.getElementById('fileInputExam').value = '';
  document.getElementById('fileInputCert').value = '';
  document.getElementById('uploadBtn').style.display = 'none';
  document.getElementById('uploadResult').style.display = 'none';
  document.getElementById('examFileSelected').style.display = 'none';
  document.getElementById('certFileSelected').style.display = 'none';
}


// Remove attached file
async function removeAttachment() {
  const employeeId = document.getElementById('employeeSelect').value;
  const courseName = document.getElementById('courseSelectUpload').value;
  
  if (!employeeId || !courseName) {
    alert('Please select an employee and course');
    return;
  }
  
  if (!confirm('Are you sure you want to remove this attachment?')) {
    return;
  }
  
  try {
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadResult').style.display = 'none';
    
    console.log('Removing attachment for:', employeeId, courseName);
    
    const response = await fetch(`${API}/api/tests/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employee_id: employeeId,
        course_title: courseName
      })
    });

    const data = await response.json();
    console.log('Remove response:', data);

    if (response.ok && data.success) {
      document.getElementById('uploadResultText').textContent = `✅ Attachment removed successfully!`;
      document.getElementById('uploadResult').style.display = 'block';
      document.getElementById('uploadProgress').style.display = 'none';
      
      // Refresh attachment info
      setTimeout(() => {
        fetchCurrentAttachment();
      }, 1000);
    } else {
      throw new Error(data.message || 'Remove failed');
    }
  } catch (err) {
    console.error('Remove error:', err);
    document.getElementById('uploadResultText').textContent = `❌ Error: ${err.message}`;
    document.getElementById('uploadResult').style.display = 'block';
    document.getElementById('uploadProgress').style.display = 'none';
  }
}
