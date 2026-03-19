// Edit Questions Page
const API = '';
let examId = null;
let examData = null;
let questionsArray = [];
let currentIdx = null; // null = no selection, -1 = new question
let currentType = null;
let enumItems = [], procItems = [], idItems = [];
let filterType = 'all';
let searchTerm = '';
let hasUnsaved = false;

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  examId = params.get('id');
  if (!examId) { toast('No exam ID provided', 'error'); return; }
  await loadExam();
  document.getElementById('qSearch').addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase();
    renderList();
  });
});

async function loadExam() {
  try {
    const res = await fetch(`${API}/api/exams/${examId}`);
    const data = await res.json();
    if (!data.success) { toast('Failed to load exam', 'error'); return; }
    examData = data.exam;
    document.getElementById('examNameLabel').textContent = examData.title;
    questionsArray = (data.questions || []).map(q => normalizeQuestion(q));
    updateMeta();
    renderList();
  } catch (e) {
    toast('Error loading exam: ' + e.message, 'error');
  }
}

function normalizeQuestion(q) {
  const type = q.question_type || q.type;
  if (type === 'multiple_choice') {
    return { type, question_text: q.question_text||'', option_a: q.option_a||'', option_b: q.option_b||'', option_c: q.option_c||'', option_d: q.option_d||'', correct_answer: q.correct_answer||'', video_url: q.video_url||'', priority: q.priority||1 };
  } else if (type === 'enumeration') {
    let items = [];
    try { items = q.enumeration_items_json ? JSON.parse(q.enumeration_items_json) : (q.items||[]); } catch(e){}
    return { type, question_text: q.question_text||'', title: q.enumeration_title||q.title||'', instruction: q.enumeration_instruction||q.instruction||'', items, answer: q.enumeration_answer||q.answer||'', video_url: q.video_url||'', priority: q.priority||2 };
  } else if (type === 'procedure') {
    let items = [];
    try { items = q.procedure_items_json ? JSON.parse(q.procedure_items_json) : (q.items||[]); } catch(e){}
    return { type, question_text: q.question_text||'', title: q.procedure_title||q.title||'', instruction: q.procedure_instructions||q.instruction||'', items, answer: q.procedure_answer||q.answer||'', video_url: q.video_url||'', priority: q.priority||3 };
  } else if (type === 'identification') {
    let items = [];
    try { items = q.identification_items_json ? JSON.parse(q.identification_items_json) : (q.items||[]); } catch(e){}
    return { type, question_text: q.question_text||'', title: q.identification_title||q.title||'', instruction: q.identification_instruction||q.instruction||'', image_url: q.identification_image_url||q.image_url||'', image_base64: q.image_base64||'', items, answer: q.identification_answer||q.answer||'' };
  }
  return { type, question_text: q.question_text||'' };
}

function updateMeta() {
  const counts = {};
  questionsArray.forEach(q => { counts[q.type] = (counts[q.type]||0)+1; });
  const parts = Object.entries(counts).map(([t,c]) => `${c} ${typeLabel(t)}`);
  document.getElementById('examMeta').textContent = `${questionsArray.length} question${questionsArray.length!==1?'s':''} · ${parts.join(', ')}`;
}

function typeLabel(t) {
  return { multiple_choice:'MC', enumeration:'Enum', procedure:'Proc', identification:'ID' }[t] || t;
}
function typeName(t) {
  return { multiple_choice:'Multiple Choice', enumeration:'Enumeration', procedure:'Procedure', identification:'Identification' }[t] || t;
}
function typeBadgeClass(t) {
  return { multiple_choice:'mc', enumeration:'enum', procedure:'proc', identification:'id' }[t] || '';
}
function typeEmoji(t) {
  return { multiple_choice:'📝', enumeration:'📋', procedure:'📖', identification:'🖼️' }[t] || '❓';
}

// ── LIST RENDERING ──
function renderList() {
  const list = document.getElementById('questionList');
  let filtered = questionsArray.map((q,i) => ({q,i})).filter(({q}) => {
    if (filterType !== 'all' && q.type !== filterType) return false;
    if (searchTerm) {
      const text = (q.question_text||q.title||'').toLowerCase();
      if (!text.includes(searchTerm)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="eq-q-empty">No questions found</div>`;
    return;
  }

  list.innerHTML = filtered.map(({q,i}) => `
    <div class="eq-q-item ${currentIdx===i?'active':''}" onclick="selectQuestion(${i})">
      <span class="eq-q-num">${i+1}</span>
      <div class="eq-q-info">
        <span class="eq-q-type-badge badge-${typeBadgeClass(q.type)}">${typeEmoji(q.type)} ${typeLabel(q.type)}</span>
        <div class="eq-q-text">${q.question_text || q.title || '(no text)'}</div>
      </div>
    </div>
  `).join('');
}

function filterByType(type, btn) {
  filterType = type;
  document.querySelectorAll('.eq-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderList();
}

// ── SELECTION ──
function selectQuestion(idx) {
  currentIdx = idx;
  renderList();
  showEditor(questionsArray[idx], idx);
}

function openAddPanel() {
  currentIdx = -1;
  currentType = null;
  renderList();
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('typePicker').style.display = 'block';
  document.getElementById('questionEditor').style.display = 'none';
}

function startNewQuestion(type) {
  currentType = type;
  currentIdx = -1;
  const newQ = blankQuestion(type);
  showEditor(newQ, -1);
}

function blankQuestion(type) {
  if (type === 'multiple_choice') return { type, question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_answer:'', video_url:'', priority:1 };
  if (type === 'enumeration') return { type, question_text:'', title:'', instruction:'', items:[], answer:'', video_url:'', priority:2 };
  if (type === 'procedure') return { type, question_text:'', title:'', instruction:'', items:[], answer:'', video_url:'', priority:3 };
  if (type === 'identification') return { type, question_text:'', title:'', instruction:'', image_url:'', image_base64:'', items:[], answer:'' };
  return { type, question_text:'' };
}

// ── EDITOR RENDERING ──
function showEditor(q, idx) {
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('typePicker').style.display = 'none';
  document.getElementById('questionEditor').style.display = 'block';

  const type = q.type;
  const badge = document.getElementById('editorBadge');
  badge.className = `eq-editor-badge ${typeBadgeClass(type)}`;
  badge.textContent = `${typeEmoji(type)} ${typeName(type)}`;

  document.getElementById('editorTitle').textContent = idx === -1 ? 'New Question' : `Edit Question #${idx+1}`;
  document.getElementById('deleteQBtn').style.display = idx >= 0 ? 'inline-block' : 'none';

  if (type === 'multiple_choice') renderMCEditor(q);
  else if (type === 'enumeration') renderEnumEditor(q);
  else if (type === 'procedure') renderProcEditor(q);
  else if (type === 'identification') renderIdEditor(q);
}

function priorityBtns(selected) {
  return ['1st','2nd','3rd','Last'].map((label,i) => {
    const val = i < 3 ? i+1 : 'last';
    const active = String(selected) === String(val) ? 'selected' : '';
    return `<button type="button" class="eq-priority-btn ${active}" onclick="selectPriority(this,'${val}')">${label}</button>`;
  }).join('');
}

function selectPriority(btn, val) {
  btn.closest('.eq-priority-group').querySelectorAll('.eq-priority-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  btn.closest('.eq-priority-group').nextElementSibling.value = val;
}

function renderMCEditor(q) {
  document.getElementById('editorBody').innerHTML = `
    <div class="eq-field">
      <label>Question Priority (Display Order)</label>
      <div class="eq-priority-group">${priorityBtns(q.priority||1)}</div>
      <input type="hidden" id="f_priority" value="${q.priority||1}"/>
    </div>
    <div class="eq-field">
      <label>Question Text *</label>
      <textarea id="f_question_text" placeholder="Enter the question...">${q.question_text||''}</textarea>
    </div>
    <div class="eq-field">
      <label>Answer Options *</label>
      <div class="eq-options-grid">
        <div class="eq-option-item"><span class="eq-option-label">A</span><input id="f_option_a" placeholder="Option A" value="${q.option_a||''}"/></div>
        <div class="eq-option-item"><span class="eq-option-label">B</span><input id="f_option_b" placeholder="Option B" value="${q.option_b||''}"/></div>
        <div class="eq-option-item"><span class="eq-option-label">C</span><input id="f_option_c" placeholder="Option C (optional)" value="${q.option_c||''}"/></div>
        <div class="eq-option-item"><span class="eq-option-label">D</span><input id="f_option_d" placeholder="Option D (optional)" value="${q.option_d||''}"/></div>
      </div>
    </div>
    <div class="eq-field">
      <label>Correct Answer *</label>
      <select id="f_correct_answer">
        <option value="">Select correct answer...</option>
        ${['A','B','C','D'].map(v=>`<option value="${v}" ${q.correct_answer===v?'selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="eq-field">
      <label>Video URL (Optional)</label>
      <input id="f_video_url" type="url" placeholder="https://..." value="${q.video_url||''}"/>
    </div>
  `;
}

function renderEnumEditor(q) {
  enumItems = JSON.parse(JSON.stringify(q.items||[]));
  document.getElementById('editorBody').innerHTML = `
    <div class="eq-field">
      <label>Question Priority (Display Order)</label>
      <div class="eq-priority-group">${priorityBtns(q.priority||2)}</div>
      <input type="hidden" id="f_priority" value="${q.priority||2}"/>
    </div>
    <div class="eq-field-row">
      <div class="eq-field">
        <label>Enumeration Title *</label>
        <input id="f_title" placeholder="e.g., List the 5S steps..." value="${q.title||''}"/>
      </div>
      <div class="eq-field">
        <label>Question Text *</label>
        <input id="f_question_text" placeholder="Enter the question..." value="${q.question_text||''}"/>
      </div>
    </div>
    <div class="eq-field">
      <label>Instruction *</label>
      <textarea id="f_instruction" placeholder="Enter instructions...">${q.instruction||''}</textarea>
    </div>
    <div class="eq-items-section">
      <div class="eq-items-header enum-color">
        📋 Enumeration Items <span style="font-weight:400;font-size:11px;">(letters & spaces only)</span>
        <span id="enumCount" style="font-size:11px;">${enumItems.length} item${enumItems.length!==1?'s':''}</span>
      </div>
      <div class="eq-items-list" id="enumItemsList"></div>
      <button class="eq-add-item-btn" onclick="addEnumItem()">➕ Add Item</button>
    </div>
    <div class="eq-field">
      <label>Video URL (Optional)</label>
      <input id="f_video_url" type="url" placeholder="https://..." value="${q.video_url||''}"/>
    </div>
  `;
  renderEnumItems();
}

function renderProcEditor(q) {
  procItems = JSON.parse(JSON.stringify(q.items||[]));
  document.getElementById('editorBody').innerHTML = `
    <div class="eq-field">
      <label>Question Priority (Display Order)</label>
      <div class="eq-priority-group">${priorityBtns(q.priority||3)}</div>
      <input type="hidden" id="f_priority" value="${q.priority||3}"/>
    </div>
    <div class="eq-field-row">
      <div class="eq-field">
        <label>Procedure Title *</label>
        <input id="f_title" placeholder="e.g., Assembly Procedure..." value="${q.title||''}"/>
      </div>
      <div class="eq-field">
        <label>Question Text *</label>
        <input id="f_question_text" placeholder="Enter the question..." value="${q.question_text||''}"/>
      </div>
    </div>
    <div class="eq-field">
      <label>Instruction *</label>
      <textarea id="f_instruction" placeholder="Enter instructions...">${q.instruction||''}</textarea>
    </div>
    <div class="eq-items-section">
      <div class="eq-items-header proc-color">
        📖 Procedure Items <span style="font-weight:400;font-size:11px;">(uppercase letters & numbers)</span>
        <span id="procCount" style="font-size:11px;">${procItems.length} item${procItems.length!==1?'s':''}</span>
      </div>
      <div class="eq-items-list" id="procItemsList"></div>
      <button class="eq-add-item-btn" onclick="addProcItem()">➕ Add Step</button>
    </div>
    <div class="eq-field">
      <label>Video URL (Optional)</label>
      <input id="f_video_url" type="url" placeholder="https://..." value="${q.video_url||''}"/>
    </div>
  `;
  renderProcItems();
}

function renderIdEditor(q) {
  idItems = JSON.parse(JSON.stringify(q.items||[]));
  document.getElementById('editorBody').innerHTML = `
    <div class="eq-field-row">
      <div class="eq-field">
        <label>Identification Title *</label>
        <input id="f_title" placeholder="e.g., Identify the parts..." value="${q.title||''}"/>
      </div>
      <div class="eq-field">
        <label>Question Text *</label>
        <input id="f_question_text" placeholder="Enter the question..." value="${q.question_text||''}"/>
      </div>
    </div>
    <div class="eq-field">
      <label>Instruction *</label>
      <textarea id="f_instruction" placeholder="Enter instructions...">${q.instruction||''}</textarea>
    </div>
    <div class="eq-field">
      <label>Reference Image (Optional)</label>
      <input type="file" id="f_image_file" accept="image/*" onchange="handleImageUpload(event)"/>
      <div class="eq-img-preview" id="imgPreview">
        ${q.image_url ? `<img src="${q.image_url}" alt="Reference image"/>` : (q.image_base64 ? `<img src="${q.image_base64}" alt="Reference image"/>` : '')}
      </div>
      <input type="hidden" id="f_image_url" value="${q.image_url||''}"/>
      <input type="hidden" id="f_image_base64" value=""/>
    </div>
    <div class="eq-items-section">
      <div class="eq-items-header id-color">
        🖼️ Identification Items
        <span id="idCount" style="font-size:11px;">${idItems.length} item${idItems.length!==1?'s':''}</span>
      </div>
      <div class="eq-items-list" id="idItemsList"></div>
      <button class="eq-add-item-btn" onclick="addIdItem()">➕ Add Item</button>
    </div>
  `;
  renderIdItems();
}

// ── ITEMS MANAGEMENT ──
function addEnumItem() {
  enumItems.push({ id: Date.now(), number: enumItems.length+1, text:'', answer:'' });
  renderEnumItems();
}
function removeEnumItem(idx) {
  enumItems.splice(idx,1);
  enumItems.forEach((it,i) => it.number = i+1);
  renderEnumItems();
}
function updateEnumItem(idx, field, val) {
  if (enumItems[idx]) enumItems[idx][field] = val;
}
function renderEnumItems() {
  const c = document.getElementById('enumItemsList');
  if (!c) return;
  const cnt = document.getElementById('enumCount');
  if (cnt) cnt.textContent = `${enumItems.length} item${enumItems.length!==1?'s':''}`;
  if (enumItems.length === 0) { c.innerHTML = '<p style="color:#999;text-align:center;padding:12px 0;font-size:13px;">No items yet — click ➕ Add Item</p>'; return; }
  c.innerHTML = enumItems.map((it,i) => `
    <div class="eq-item-row two-col">
      <div>
        <div class="eq-item-num">Item ${it.number} — Text</div>
        <input placeholder="e.g., SORT OR SEIRI" value="${escHtml(it.text)}" oninput="updateEnumItem(${i},'text',this.value)" style="width:100%;"/>
      </div>
      <div>
        <div class="eq-item-num">Answer</div>
        <input placeholder="e.g., SEIRI" value="${escHtml(it.answer)}" oninput="updateEnumItem(${i},'answer',this.value)" style="width:100%;"/>
      </div>
      <button class="eq-remove-item" onclick="removeEnumItem(${i})">✕</button>
    </div>
  `).join('');
}

function addProcItem() {
  procItems.push({ id: Date.now(), number: procItems.length+1, text:'', answer:'' });
  renderProcItems();
}
function removeProcItem(idx) {
  procItems.splice(idx,1);
  procItems.forEach((it,i) => it.number = i+1);
  renderProcItems();
}
function updateProcItem(idx, field, val) {
  if (procItems[idx]) procItems[idx][field] = val;
}
function renderProcItems() {
  const c = document.getElementById('procItemsList');
  if (!c) return;
  const cnt = document.getElementById('procCount');
  if (cnt) cnt.textContent = `${procItems.length} item${procItems.length!==1?'s':''}`;
  if (procItems.length === 0) { c.innerHTML = '<p style="color:#999;text-align:center;padding:12px 0;font-size:13px;">No steps yet — click ➕ Add Step</p>'; return; }
  c.innerHTML = procItems.map((it,i) => `
    <div class="eq-item-row two-col">
      <div>
        <div class="eq-item-num">Step ${it.number} — Description</div>
        <textarea placeholder="Describe this step..." oninput="updateProcItem(${i},'text',this.value)">${escHtml(it.text)}</textarea>
      </div>
      <div>
        <div class="eq-item-num">Answer (UPPERCASE)</div>
        <input placeholder="e.g., A1, B2" value="${escHtml(it.answer)}" oninput="updateProcItem(${i},'answer',this.value.toUpperCase());this.value=this.value.toUpperCase();" style="width:100%;text-transform:uppercase;"/>
      </div>
      <button class="eq-remove-item" onclick="removeProcItem(${i})">✕</button>
    </div>
  `).join('');
}

function addIdItem() {
  idItems.push({ id: Date.now(), number: idItems.length+1, text:'', answer:'', points:1 });
  renderIdItems();
}
function removeIdItem(idx) {
  idItems.splice(idx,1);
  idItems.forEach((it,i) => it.number = i+1);
  renderIdItems();
}
function updateIdItem(idx, field, val) {
  if (idItems[idx]) idItems[idx][field] = field==='answer' ? val.toUpperCase() : val;
}
function renderIdItems() {
  const c = document.getElementById('idItemsList');
  if (!c) return;
  const cnt = document.getElementById('idCount');
  if (cnt) cnt.textContent = `${idItems.length} item${idItems.length!==1?'s':''}`;
  if (idItems.length === 0) { c.innerHTML = '<p style="color:#999;text-align:center;padding:12px 0;font-size:13px;">No items yet — click ➕ Add Item</p>'; return; }
  c.innerHTML = idItems.map((it,i) => `
    <div class="eq-item-row two-col">
      <div>
        <div class="eq-item-num">Item ${it.number} — Label</div>
        <input placeholder="e.g., Part A, Component 1" value="${escHtml(it.text)}" oninput="updateIdItem(${i},'text',this.value)" style="width:100%;"/>
      </div>
      <div>
        <div class="eq-item-num">Correct Answer (UPPERCASE)</div>
        <input placeholder="e.g., BOLT, SHAFT" value="${escHtml(it.answer)}" oninput="updateIdItem(${i},'answer',this.value.toUpperCase());this.value=this.value.toUpperCase();" style="width:100%;text-transform:uppercase;"/>
      </div>
      <button class="eq-remove-item" onclick="removeIdItem(${i})">✕</button>
    </div>
  `).join('');
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('imgPreview').innerHTML = `<img src="${e.target.result}" alt="Preview"/>`;
    document.getElementById('f_image_base64').value = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── SAVE / DELETE QUESTION ──
function saveCurrentQuestion() {
  const type = currentIdx === -1
    ? currentType
    : questionsArray[currentIdx]?.type;

  if (!type) { toast('No question type selected', 'error'); return; }

  let q = null;

  if (type === 'multiple_choice') {
    const text = document.getElementById('f_question_text')?.value.trim();
    const optA = document.getElementById('f_option_a')?.value.trim();
    const optB = document.getElementById('f_option_b')?.value.trim();
    const correct = document.getElementById('f_correct_answer')?.value;
    if (!text || !optA || !optB || !correct) { toast('Please fill in all required fields', 'error'); return; }
    q = {
      type,
      question_text: text,
      option_a: optA,
      option_b: optB,
      option_c: document.getElementById('f_option_c')?.value.trim()||'',
      option_d: document.getElementById('f_option_d')?.value.trim()||'',
      correct_answer: correct,
      video_url: document.getElementById('f_video_url')?.value.trim()||'',
      priority: document.getElementById('f_priority')?.value||1
    };
  } else if (type === 'enumeration') {
    const title = document.getElementById('f_title')?.value.trim();
    const text = document.getElementById('f_question_text')?.value.trim();
    const instr = document.getElementById('f_instruction')?.value.trim();
    if (!title || !text || !instr) { toast('Please fill in all required fields', 'error'); return; }
    if (enumItems.length === 0) { toast('Please add at least one item', 'error'); return; }
    for (const it of enumItems) {
      if (!it.text.trim() || !it.answer.trim()) { toast('All items must have text and answer', 'error'); return; }
    }
    q = { type, title, question_text: text, instruction: instr, items: enumItems, count: enumItems.length, answer: enumItems.map(i=>i.answer).join(' | '), video_url: document.getElementById('f_video_url')?.value.trim()||'', priority: document.getElementById('f_priority')?.value||2 };
  } else if (type === 'procedure') {
    const title = document.getElementById('f_title')?.value.trim();
    const text = document.getElementById('f_question_text')?.value.trim();
    const instr = document.getElementById('f_instruction')?.value.trim();
    if (!title || !text || !instr) { toast('Please fill in all required fields', 'error'); return; }
    if (procItems.length === 0) { toast('Please add at least one step', 'error'); return; }
    for (const it of procItems) {
      if (!it.text.trim() || !it.answer.trim()) { toast('All steps must have description and answer', 'error'); return; }
    }
    q = { type, title, question_text: text, instruction: instr, items: procItems, count: procItems.length, answer: procItems.map(i=>i.answer).join(' | '), video_url: document.getElementById('f_video_url')?.value.trim()||'', priority: document.getElementById('f_priority')?.value||3 };
  } else if (type === 'identification') {
    const title = document.getElementById('f_title')?.value.trim();
    const text = document.getElementById('f_question_text')?.value.trim();
    const instr = document.getElementById('f_instruction')?.value.trim();
    if (!title || !text || !instr) { toast('Please fill in all required fields', 'error'); return; }
    if (idItems.length === 0) { toast('Please add at least one item', 'error'); return; }
    for (const it of idItems) {
      if (!it.text.trim() || !it.answer.trim()) { toast('All items must have label and answer', 'error'); return; }
    }
    q = { type, title, question_text: text, instruction: instr, image_url: document.getElementById('f_image_url')?.value||'', image_base64: document.getElementById('f_image_base64')?.value||'', items: idItems, count: idItems.length, answer: idItems.map(i=>i.answer).join(' | ') };
  }

  if (!q) return;

  if (currentIdx === -1) {
    questionsArray.push(q);
    currentIdx = questionsArray.length - 1;
  } else {
    questionsArray[currentIdx] = q;
  }

  hasUnsaved = true;
  updateMeta();
  renderList();
  showEditor(questionsArray[currentIdx], currentIdx);
  toast('Question saved — click "Save All Changes" to persist', 'info');
}

function deleteCurrentQuestion() {
  if (currentIdx < 0 || currentIdx >= questionsArray.length) return;
  if (!confirm(`Delete Question #${currentIdx+1}? This will be permanent after saving.`)) return;
  questionsArray.splice(currentIdx, 1);
  currentIdx = null;
  hasUnsaved = true;
  updateMeta();
  renderList();
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('questionEditor').style.display = 'none';
  toast('Question removed — click "Save All Changes" to persist', 'info');
}

function cancelEdit() {
  currentIdx = null;
  renderList();
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('typePicker').style.display = 'none';
  document.getElementById('questionEditor').style.display = 'none';
}

// ── SAVE ALL TO SERVER ──
async function saveAllChanges() {
  if (!examId) return;
  const btn = document.querySelector('.eq-save-btn');
  btn.textContent = '⏳ Saving...';
  btn.disabled = true;

  try {
    const converted = questionsArray.map(q => {
      if (q.type === 'multiple_choice') {
        return { type:'multiple_choice', question: q.question_text, options:[q.option_a,q.option_b,q.option_c||'',q.option_d||''], correctAnswer: q.correct_answer };
      } else if (q.type === 'enumeration') {
        return { type:'enumeration', question: q.question_text, title: q.title, instruction: q.instruction, items: q.items, count: q.items.length, answer: q.items.map(i=>i.answer).join(' | '), items_json: JSON.stringify(q.items) };
      } else if (q.type === 'procedure') {
        return { type:'procedure', question: q.question_text, title: q.title, instruction: q.instruction, items: q.items, count: q.items.length, answer: q.items.map(i=>i.answer).join(' | '), items_json: JSON.stringify(q.items) };
      } else if (q.type === 'identification') {
        return { type:'identification', question_text: q.question_text, title: q.title, instruction: q.instruction, image_base64: q.image_base64||'', image_url: q.image_url||'', items: q.items, count: q.items.length, answer: q.items.map(i=>i.answer).join(' | '), items_json: JSON.stringify(q.items) };
      }
      return q;
    });

    const res = await fetch(`${API}/api/exams/${examId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: examData.title, course_title: examData.title, description: examData.description||'', question_count: converted.length, questions: converted })
    });
    const data = await res.json();
    if (data.success) {
      hasUnsaved = false;
      toast('All changes saved successfully!', 'success');
    } else {
      toast('Save failed: ' + (data.message||'Unknown error'), 'error');
    }
  } catch (e) {
    toast('Error saving: ' + e.message, 'error');
  } finally {
    btn.textContent = '💾 Save All Changes';
    btn.disabled = false;
  }
}

// ── UTILS ──
function escHtml(str) {
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg, type='info') {
  const el = document.getElementById('eqToast');
  el.textContent = msg;
  el.className = `eq-toast ${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}
