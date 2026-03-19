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

// ── TAB SWITCHING ──
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const tabEl = document.getElementById(tab + 'Tab');
  if (tabEl) tabEl.classList.add('active');
  event.target.classList.add('active');
  if (tab === 'results') loadAllResults();
}

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
      
      // Check for EXAM attachment (exam_form_url)
      const hasExam = trainingRecord.exam_form_url ? true : false;
      // Check for TEEF attachment (eff_form_file)
      const hasTeef = trainingRecord.eff_form_file ? true : false;
      
      if (hasExam || hasTeef) {
        // Show both EXAM and TEEF attachments if they exist with separate remove buttons
        
        // EXAM attachment
        if (hasExam) {
          const examFileName = trainingRecord.exam_form_url.split('/').pop();
          const employeeName = (trainingRecord.full_name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
          const courseTitle = (trainingRecord.course_title || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_');
          const examDownloadFileName = `${employeeName}_${courseTitle}_EXAM.pdf`;
          attachmentHTML += `
            <div style="padding: 12px; background: #e3f2fd; border-radius: 6px; border: 1px solid #2196f3; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #1565c0;">📄 EXAM File</p>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #555;">${examFileName}</p>
                  <a href="${trainingRecord.exam_form_url}" target="_blank" download="${examDownloadFileName}" style="color: #1565c0; text-decoration: none; font-weight: 600; font-size: 13px;">📥 Download EXAM</a>
                </div>
                <button onclick="removeAttachmentByType('exam')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap;">🗑️ Remove</button>
              </div>
            </div>
          `;
        }
        
        // TEEF attachment (uses eff_form_file column)
        if (hasTeef) {
          const teefFileName = trainingRecord.eff_form_file.split('/').pop();
          const employeeName = (trainingRecord.full_name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
          const courseTitle = (trainingRecord.course_title || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_');
          const teefDownloadFileName = `${employeeName}_${courseTitle}_TEEF.pdf`;
          attachmentHTML += `
            <div style="padding: 12px; background: #f3e5f5; border-radius: 6px; border: 1px solid #9c27b0; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #6a1b9a;">🎓 TEEF Form</p>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #555;">${teefFileName}</p>
                  <a href="${trainingRecord.eff_form_file}" target="_blank" download="${teefDownloadFileName}" style="color: #6a1b9a; text-decoration: none; font-weight: 600; font-size: 13px;">📥 Download TEEF</a>
                </div>
                <button onclick="removeAttachmentByType('teef')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap;">🗑️ Remove</button>
              </div>
            </div>
          `;
        }
        
      if (removeAttachmentBtn) {
        removeAttachmentBtn.style.display = 'none';
      }
      } else {
        attachmentHTML = '<p style="margin: 0; color: #999;">No attachment uploaded yet</p>';
        if (removeAttachmentBtn) {
          removeAttachmentBtn.style.display = 'none';
        }
      }
      
      currentAttachmentDetails.innerHTML = attachmentHTML;
      currentAttachmentInfo.style.display = 'block';
    } else {
      currentAttachmentInfo.style.display = 'none';
    }
  } catch (err) {
    console.error('Error fetching attachment:', err);
    if (currentAttachmentInfo) {
      currentAttachmentInfo.style.display = 'none';
    }
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
  
  // Don't hide the button here - let checkFilesReady() control it
  checkFilesReady();
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
      
      // Upload exam file if selected - explicitly mark as EXAM
      if (examFile) {
        console.log('Uploading exam file:', examFile.name);
        await uploadFileWithType(examFile, employeeId, courseName, 'W/EXAM_TEEF', 'exam');
      }
      
      // Upload certificate file if selected - explicitly mark as TEEF
      if (certFile) {
        console.log('Uploading certificate file:', certFile.name);
        await uploadFileWithType(certFile, employeeId, courseName, 'W/EXAM_TEEF', 'teef');
      }
      
      // Set session storage to indicate what was completed
      if (examFile && certFile) {
        // Both uploaded - set as exam (both)
        sessionStorage.setItem('completedAssessmentType', 'exam');
        sessionStorage.setItem('completedTrainingId', employeeId + '_' + courseName);
      } else if (examFile) {
        // Only exam uploaded
        sessionStorage.setItem('completedAssessmentType', 'exam');
        sessionStorage.setItem('completedTrainingId', employeeId + '_' + courseName);
      } else if (certFile) {
        // Only TEEF uploaded - set as evaluation
        sessionStorage.setItem('completedAssessmentType', 'evaluation');
        sessionStorage.setItem('completedTrainingId', employeeId + '_' + courseName);
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
      // Upload single file - determine file type based on document type
      const file = document.getElementById('fileInput').files[0];
      
      if (!file) {
        alert('Please select a file');
        document.getElementById('uploadProgress').style.display = 'none';
        return;
      }
      
      // Determine file_type based on documentType
      let fileType = 'exam';
      if (documentType === 'W/TEEF') {
        fileType = 'teef';
      }
      
      console.log('Uploading file:', file.name, 'documentType:', documentType, 'fileType:', fileType);
      await uploadFileWithType(file, employeeId, courseName, documentType, fileType);
      
      // Set session storage to indicate what was completed (for color coding)
      if (documentType === 'W/EXAM') {
        sessionStorage.setItem('completedAssessmentType', 'exam');
        sessionStorage.setItem('completedTrainingId', employeeId + '_' + courseName);
      } else if (documentType === 'W/TEEF') {
        sessionStorage.setItem('completedAssessmentType', 'evaluation');
        sessionStorage.setItem('completedTrainingId', employeeId + '_' + courseName);
      }
      
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
  // For single files, determine file_type based on documentType
  let fileType = 'exam';
  if (documentType === 'W/TEEF') {
    fileType = 'teef';
  }
  
  // Use uploadFileWithType instead
  return uploadFileWithType(file, employeeId, courseName, documentType, fileType);
}

// Helper function to upload a file with explicit file type (EXAM or TEEF)
async function uploadFileWithType(file, employeeId, courseName, documentType, fileType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('employee_id', employeeId);
  formData.append('course_title', courseName);
  formData.append('document_type', documentType);
  formData.append('file_type', fileType); // Explicitly specify EXAM or TEEF
  
  console.log('Uploading file:', file.name, 'Type:', documentType, 'FileType:', fileType);
  
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

// Remove specific attachment type (EXAM or TEEF)
async function removeAttachmentByType(attachmentType) {
  const employeeId = document.getElementById('employeeSelect').value;
  const courseName = document.getElementById('courseSelectUpload').value;
  
  if (!employeeId || !courseName) {
    alert('Please select an employee and course');
    return;
  }
  
  const typeLabel = attachmentType === 'exam' ? 'EXAM' : 'TEEF Form';
  if (!confirm(`Are you sure you want to remove the ${typeLabel} attachment?`)) {
    return;
  }
  
  try {
    console.log(`Removing ${attachmentType} attachment for:`, employeeId, courseName);
    
    const response = await fetch(`${API}/api/tests/remove-by-type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employee_id: employeeId,
        course_title: courseName,
        attachment_type: attachmentType
      })
    });

    const data = await response.json();
    console.log('Remove response:', data);

    if (response.ok && data.success) {
      alert(`✅ ${typeLabel} removed successfully!`);
      
      // Refresh attachment info
      fetchCurrentAttachment();
    } else {
      throw new Error(data.message || 'Remove failed');
    }
  } catch (err) {
    console.error('Remove error:', err);
    alert(`❌ Error: ${err.message}`);
  }
}

// ══════════════════════════════════════
//  EXAM RESULTS REVIEW & OVERRIDE
// ══════════════════════════════════════
let allResults = [];
let filteredResults = [];
let currentReviewResult = null;

async function loadAllResults() {
  document.getElementById('resultsLoading').style.display = 'block';
  document.getElementById('resultsTable').style.display = 'none';
  try {
    const res = await fetch('/api/exam-results');
    const data = await res.json();
    if (data.success) {
      allResults = data.data || [];
      // Populate employee filter
      const empFilter = document.getElementById('resultsEmployeeFilter');
      const seen = new Set();
      empFilter.innerHTML = '<option value="">All Employees</option>';
      allResults.forEach(r => {
        if (r.employee_full_name && !seen.has(r.employee_full_name)) {
          seen.add(r.employee_full_name);
          const opt = document.createElement('option');
          opt.value = r.employee_full_name;
          opt.textContent = r.employee_full_name;
          empFilter.appendChild(opt);
        }
      });
      filterResults();
    }
  } catch (e) {
    document.getElementById('resultsLoading').textContent = 'Error loading results.';
  }
}

function filterResults() {
  const empVal = (document.getElementById('resultsEmployeeFilter')?.value || '').toLowerCase();
  const search = (document.getElementById('resultsSearch')?.value || '').toLowerCase();
  filteredResults = allResults.filter(r => {
    const name = (r.employee_full_name || '').toLowerCase();
    const course = (r.course_title || '').toLowerCase();
    return (!empVal || name === empVal) && (!search || name.includes(search) || course.includes(search));
  });
  renderResultsTable();
}

function renderResultsTable() {
  const tbody = document.getElementById('resultsTableBody');
  document.getElementById('resultsLoading').style.display = 'none';
  document.getElementById('resultsTable').style.display = 'table';

  if (filteredResults.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#999;">No results found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredResults.map(r => {
    const hasAdj = r.admin_adjusted_score !== null && r.admin_adjusted_score !== undefined;
    const effPct = hasAdj ? r.admin_adjusted_percentage : r.percentage;
    const passed = effPct >= 70;
    const adjBadge = hasAdj ? `<span style="font-size:10px; background:#fff3cd; color:#856404; padding:2px 6px; border-radius:3px; font-weight:700;">ADJ</span>` : '';
    return `<tr style="border-bottom:1px solid #e9ecef; transition:background 0.15s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background=''">
      <td style="padding:10px 14px; font-weight:600;">${r.employee_full_name || '—'}</td>
      <td style="padding:10px 14px; color:#555;">${r.course_title || '—'}</td>
      <td style="padding:10px 14px; text-align:center;">${hasAdj ? r.admin_adjusted_score : r.score} / ${r.total_points}</td>
      <td style="padding:10px 14px; text-align:center; font-weight:700; color:${passed ? '#28a745' : '#dc3545'};">${effPct}%</td>
      <td style="padding:10px 14px; text-align:center;">
        <span style="padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; background:${passed ? '#d4edda' : '#f8d7da'}; color:${passed ? '#155724' : '#721c24'};">
          ${passed ? 'PASSED' : 'FAILED'}
        </span>
      </td>
      <td style="padding:10px 14px; text-align:center;">${adjBadge || '—'}</td>
      <td style="padding:10px 14px; text-align:center; color:#888; font-size:12px;">${new Date(r.submitted_at).toLocaleDateString()}</td>
      <td style="padding:10px 14px; text-align:center;">
        <div style="display:flex; gap:6px; justify-content:center;">
          <button onclick="openReview(${r.id})" style="padding:6px 12px; background:var(--navy); color:white; border:none; border-radius:5px; cursor:pointer; font-size:12px; font-weight:600;">🔍 Review</button>
          <button onclick="quickPrint(${r.id})" style="padding:6px 12px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; font-size:12px; font-weight:600;">🖨️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function openReview(resultId) {
  try {
    const res = await fetch(`/api/exam-results/${resultId}`);
    const data = await res.json();
    if (!data.success) { alert('Failed to load result'); return; }
    currentReviewResult = data.data;
    renderReviewModal(data.data);
    const overlay = document.getElementById('reviewModalOverlay');
    overlay.style.display = 'flex';
  } catch (e) {
    alert('Error loading result: ' + e.message);
  }
}

function renderReviewModal(result) {
  document.getElementById('reviewModalTitle').textContent = `Review: ${result.course_title || 'Exam'}`;
  document.getElementById('reviewModalMeta').textContent = `${result.employee_full_name} · ${new Date(result.submitted_at).toLocaleString()}`;

  const hasAdj = result.admin_adjusted_score !== null && result.admin_adjusted_score !== undefined;
  const effScore = hasAdj ? result.admin_adjusted_score : result.score;
  const effPct = hasAdj ? result.admin_adjusted_percentage : result.percentage;
  const passed = effPct >= 70;

  document.getElementById('reviewScoreBanner').innerHTML = `
    <div><span style="font-size:11px; color:#888; display:block; margin-bottom:2px;">ORIGINAL SCORE</span><strong style="font-size:18px;">${result.score} / ${result.total_points} (${result.percentage}%)</strong></div>
    ${hasAdj ? `<div><span style="font-size:11px; color:#856404; display:block; margin-bottom:2px;">ADJUSTED SCORE</span><strong style="font-size:18px; color:#856404;">${effScore} / ${result.total_points} (${effPct}%)</strong></div>` : ''}
    <div><span style="font-size:11px; color:#888; display:block; margin-bottom:2px;">STATUS</span>
      <span style="padding:4px 12px; border-radius:12px; font-size:13px; font-weight:700; background:${passed ? '#d4edda' : '#f8d7da'}; color:${passed ? '#155724' : '#721c24'};">${passed ? 'PASSED' : 'FAILED'}</span>
    </div>
    <div style="margin-left:auto; font-size:12px; color:#888; align-self:center;">Toggle ✓/✗ to override correctness, then Save Changes</div>
  `;

  const details = result.question_details || [];
  if (details.length === 0) {
    document.getElementById('reviewModalBody').innerHTML = '<p style="color:#999; text-align:center; padding:30px;">No per-question details available for this result.<br><small>Only results from exams taken after this update will have detailed breakdowns.</small></p>';
    return;
  }

  const typeColors = { multiple_choice: '#007bff', enumeration: '#17a2b8', procedure: '#6f42c1', identification: '#28a745' };
  const typeLabels = { multiple_choice: 'MC', enumeration: 'Enum', procedure: 'Proc', identification: 'ID' };

  let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
  details.forEach((q, idx) => {
    const overrideVal = q.admin_override !== undefined ? q.admin_override : q.is_correct;
    const isCorrect = overrideVal;
    const wasOverridden = q.admin_override !== undefined && q.admin_override !== q.is_correct;
    const color = typeColors[q.question_type] || '#666';
    const label = typeLabels[q.question_type] || q.question_type;

    html += `<div id="qrow_${idx}" style="border:2px solid ${isCorrect ? '#28a745' : '#dc3545'}; border-radius:8px; padding:12px 16px; background:${isCorrect ? '#f8fff9' : '#fff8f8'}; transition:all 0.2s;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
            <span style="background:${color}; color:white; font-size:10px; font-weight:700; padding:2px 7px; border-radius:3px;">${label}</span>
            ${wasOverridden ? '<span style="background:#fff3cd; color:#856404; font-size:10px; font-weight:700; padding:2px 7px; border-radius:3px;">OVERRIDDEN</span>' : ''}
            <span style="font-size:12px; font-weight:600; color:#333;">${escapeHtmlResult(q.question_text)}</span>
          </div>
          <div style="display:flex; gap:20px; font-size:12px; flex-wrap:wrap;">
            <span><strong style="color:#555;">Your answer:</strong> <code style="background:#f0f0f0; padding:2px 6px; border-radius:3px;">${escapeHtmlResult(q.user_answer) || '<em style="color:#999">blank</em>'}</code></span>
            <span><strong style="color:#555;">Correct:</strong> <code style="background:#e8f5e9; padding:2px 6px; border-radius:3px; color:#155724;">${escapeHtmlResult(q.correct_answer)}</code></span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <button onclick="toggleOverride(${idx})" style="padding:7px 16px; border:2px solid ${isCorrect ? '#28a745' : '#dc3545'}; border-radius:6px; background:${isCorrect ? '#28a745' : '#dc3545'}; color:white; font-weight:700; cursor:pointer; font-size:14px; min-width:44px; transition:all 0.15s;" title="Toggle correct/incorrect">
            ${isCorrect ? '✓' : '✗'}
          </button>
        </div>
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('reviewModalBody').innerHTML = html;
}

function escapeHtmlResult(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function toggleOverride(idx) {
  if (!currentReviewResult || !currentReviewResult.question_details) return;
  const q = currentReviewResult.question_details[idx];
  const currentVal = q.admin_override !== undefined ? q.admin_override : q.is_correct;
  q.admin_override = !currentVal;
  renderReviewModal(currentReviewResult);
}

async function saveOverrides() {
  if (!currentReviewResult) return;
  try {
    const res = await fetch(`/api/exam-results/${currentReviewResult.id}/override`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_details: currentReviewResult.question_details })
    });
    const data = await res.json();
    if (data.success) {
      currentReviewResult.admin_adjusted_score = data.new_score;
      currentReviewResult.admin_adjusted_percentage = data.new_percentage;
      currentReviewResult.passed = data.passed;
      renderReviewModal(currentReviewResult);
      // Refresh table
      const row = allResults.find(r => r.id === currentReviewResult.id);
      if (row) {
        row.admin_adjusted_score = data.new_score;
        row.admin_adjusted_percentage = data.new_percentage;
        row.passed = data.passed;
      }
      filterResults();
      showResultNotification('Changes saved successfully!', 'success');
    } else {
      showResultNotification('Save failed: ' + data.message, 'error');
    }
  } catch (e) {
    showResultNotification('Error: ' + e.message, 'error');
  }
}

function closeReviewModal() {
  document.getElementById('reviewModalOverlay').style.display = 'none';
  currentReviewResult = null;
}

function showResultNotification(msg, type) {
  const colors = { success: '#28a745', error: '#dc3545', info: '#007bff' };
  const n = document.createElement('div');
  n.style.cssText = `position:fixed; top:20px; right:20px; z-index:99999; padding:14px 20px; background:${colors[type]||'#333'}; color:white; border-radius:8px; font-weight:600; font-size:13px; box-shadow:0 4px 16px rgba(0,0,0,0.2); animation:slideInRight 0.3s ease;`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3500);
}

// ── PRINT ADJUSTED RESULT ──
function printAdjustedResult() {
  if (!currentReviewResult) return;

  const r = currentReviewResult;
  const details = r.question_details || [];
  const hasAdj = r.admin_adjusted_score !== null && r.admin_adjusted_score !== undefined;
  const effScore = hasAdj ? r.admin_adjusted_score : r.score;
  const effPct   = hasAdj ? r.admin_adjusted_percentage : r.percentage;
  const passed   = effPct >= 70;
  const passColor = passed ? '#28a745' : '#dc3545';
  const passBg    = passed ? '#e8f5e9' : '#ffebee';
  const passText  = passed ? 'PASSED' : 'FAILED';
  const currentDate = new Date(r.submitted_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  const sectionScores = { multiple_choice:0, enumeration:0, procedure:0, identification:0 };
  const sectionTotals = { multiple_choice:0, enumeration:0, procedure:0, identification:0 };
  details.forEach(q => {
    const type = q.question_type;
    const pts  = q.points || 1;
    const isOk = q.admin_override !== undefined ? q.admin_override : q.is_correct;
    if (sectionTotals[type] !== undefined) {
      sectionTotals[type] += pts;
      if (isOk) sectionScores[type] += pts;
    }
  });

  const printWin = window.open('', '', 'height=900,width=800');
  if (!printWin) { alert('Please allow popups to print.'); return; }

  // Group questions by type for 2-col layout
  const typeLabels = { multiple_choice:'Multiple Choice', enumeration:'Enumeration', procedure:'Procedure', identification:'Identification' };
  const grouped = {};
  details.forEach(q => { const t = q.question_type; if (!grouped[t]) grouped[t] = []; grouped[t].push(q); });

  let qHtml = '';
  Object.entries(grouped).forEach(([type, qs]) => {
    const correctCount = qs.filter(q => (q.admin_override !== undefined ? q.admin_override : q.is_correct)).length;
    qHtml += `<div class="qs-block">
      <div class="qs-head">${typeLabels[type]||type} — ${correctCount}/${qs.length} correct</div>
      <div class="qs-grid">`;
    qs.forEach((q, i) => {
      const wasOverridden = q.admin_override !== undefined && q.admin_override !== q.is_correct;
      const isOk = q.admin_override !== undefined ? q.admin_override : q.is_correct;
      const statusClass = wasOverridden ? 'ov' : (isOk ? 'ok' : 'ng');
      const statusText  = wasOverridden ? (isOk ? '✓*' : '✗*') : (isOk ? '✓' : '✗');
      const txt = (q.question_text||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const uAns = (q.user_answer||'—').replace(/</g,'&lt;');
      const cAns = (q.correct_answer||'—').replace(/</g,'&lt;');
      qHtml += `<div class="q-item">
        <span class="q-num">${i+1}.</span>
        <span class="q-txt">${txt}</span>
        <span class="q-detail">Ans: <b>${uAns}</b> / Correct: <b>${cAns}</b></span>
        <span class="q-st ${statusClass}">${statusText}</span>
      </div>`;
    });
    qHtml += `</div></div>`;
  });

  let bdRows = '';
  if (sectionTotals.multiple_choice > 0) bdRows += `<div class="brow"><span>Multiple Choice</span><span>${sectionScores.multiple_choice}/${sectionTotals.multiple_choice}</span></div>`;
  if (sectionTotals.enumeration > 0)     bdRows += `<div class="brow"><span>Enumeration</span><span>${sectionScores.enumeration}/${sectionTotals.enumeration}</span></div>`;
  if (sectionTotals.procedure > 0)       bdRows += `<div class="brow"><span>Procedure</span><span>${sectionScores.procedure}/${sectionTotals.procedure}</span></div>`;
  if (sectionTotals.identification > 0)  bdRows += `<div class="brow"><span>Identification</span><span>${sectionScores.identification}/${sectionTotals.identification}</span></div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exam Results</title><style>
    @page { size: A4 portrait; margin: 0.3in 0.25in; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:7.5px; color:#000; background:white; }
    .wrap { width:100%; }
    .hdr { display:flex; align-items:center; justify-content:center; padding-bottom:4px; border-bottom:1.5px solid #000; margin-bottom:4px; }
    .hdr img { height:28px; }
    .title { text-align:center; font-size:9.5px; font-weight:700; border:1.5px solid #000; padding:3px; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px; }
    .info { display:grid; grid-template-columns:1fr 1fr; gap:4px 16px; border:1px solid #000; padding:4px 7px; margin-bottom:4px; }
    .info label { font-weight:700; font-size:6.5px; display:block; }
    .info span  { font-size:7.5px; font-weight:600; }
    .res-wrap { position:relative; margin-bottom:4px; }
    .wm { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:36px; font-weight:900; color:${passColor}; opacity:0.08; text-transform:uppercase; pointer-events:none; white-space:nowrap; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .res { position:relative; text-align:center; padding:6px 10px; border:2px solid ${passColor}; background:${passBg}; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .res h2 { font-size:11px; font-weight:900; color:${passColor}; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px; }
    .res .sc { font-size:8px; font-weight:700; margin-bottom:1px; }
    .res .pct { font-size:16px; font-weight:900; color:${passColor}; }
    .adj-note { font-size:6.5px; color:#856404; background:#fff3cd; padding:2px 5px; border-radius:2px; display:inline-block; margin-top:2px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .bd { border:1px solid #000; padding:3px 7px; margin-bottom:4px; }
    .bd-title { font-size:7.5px; font-weight:700; text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:2px; }
    .brow { display:flex; justify-content:space-between; font-size:7px; padding:1.5px 0; border-bottom:1px dashed #ddd; }
    .brow:last-child { border-bottom:none; }
    .qs-block { margin-bottom:3px; border:1px solid #ccc; }
    .qs-head { background:#ececec; padding:2px 6px; font-size:7px; font-weight:700; text-transform:uppercase; border-bottom:1px solid #ccc; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .qs-grid { display:grid; grid-template-columns:1fr 1fr; }
    .q-item { display:flex; flex-direction:column; padding:2px 18px 2px 5px; border-bottom:1px solid #eee; font-size:6.5px; position:relative; min-height:22px; }
    .q-item:nth-child(odd) { border-right:1px solid #ddd; }
    .q-num  { font-weight:700; color:#555; display:inline; }
    .q-txt  { color:#222; line-height:1.25; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
    .q-detail { color:#666; font-size:6px; margin-top:1px; }
    .q-st   { position:absolute; right:3px; top:50%; transform:translateY(-50%); font-weight:700; font-size:8.5px; }
    .ok { color:#28a745; }
    .ng { color:#dc3545; }
    .ov { color:#856404; }
    .footer { font-size:6px; color:#666; border-top:1px solid #ddd; padding-top:3px; margin-top:3px; }
    @media print { body { margin:0; } }
  </style></head><body>
  <div class="wrap">
    <div class="hdr"><img src="/images/NSB-LOGO.png" alt="NSB"/></div>
    <div class="title">EXAM RESULTS${hasAdj ? ' — ADJUSTED' : ''}</div>
    <div class="info">
      <div><label>Employee Name:</label><span>${r.employee_full_name||'—'}</span></div>
      <div><label>Exam Date:</label><span>${currentDate}</span></div>
      <div><label>Course / Exam:</label><span>${r.course_title||'—'}</span></div>
      <div><label>Passing Score:</label><span>70%</span></div>
    </div>
    <div class="res-wrap">
      <div class="wm">${passText}</div>
      <div class="res">
        <h2>${passText}</h2>
        <div class="sc">Score: ${effScore} / ${r.total_points}</div>
        <div class="pct">${effPct}%</div>
        ${hasAdj ? `<div class="adj-note">⚠ Adjusted by admin (original: ${r.score}/${r.total_points} · ${r.percentage}%)</div>` : ''}
      </div>
    </div>
    <div class="bd"><div class="bd-title">Score Breakdown</div>${bdRows}</div>
    ${qHtml}
    <div class="footer">
      F-EXAMRESULT · ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
      ${hasAdj ? ' · Contains admin-adjusted scores' : ''}
    </div>
  </div>
  <script>window.onload=function(){ window.print(); }<\/script>
  </body></html>`;

  printWin.document.write(html);
  printWin.document.close();
}

// Quick print directly from table row (loads result then prints)
async function quickPrint(resultId) {
  try {
    const res = await fetch(`/api/exam-results/${resultId}`);
    const data = await res.json();
    if (!data.success) { alert('Failed to load result'); return; }
    currentReviewResult = data.data;
    printAdjustedResult();
    currentReviewResult = null;
  } catch (e) {
    alert('Error: ' + e.message);
  }
}
