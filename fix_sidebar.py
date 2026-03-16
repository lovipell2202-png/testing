import os
import re

# The correct sidebar structure for exam files
sidebar_template = '''    <aside id="sidebar">
      <div style="padding: 20px; border-bottom: 2px solid var(--border);">
        <h3 style="margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700; color: var(--navy);">MENU</h3>
      </div>
      
        <a href="../index.html" class="sidebar-menu-item">📊 Dashboard</a>

        <a href="../all-employees.html" class="sidebar-menu-item">👥 All Employees</a>

        <a href="../training-records.html" class="sidebar-menu-item">📚 Training Records</a>

        <a href="../test-form.html" class="sidebar-menu-item">✏️ Course Tests</a>

        <a href="../exams/exam-index.html" class="sidebar-menu-item">📋 Take Exam</a>
    </aside>'''

# Process all exam HTML files
exams_dir = 'public/exams'
for filename in os.listdir(exams_dir):
    if filename.endswith('.html'):
        filepath = os.path.join(exams_dir, filename)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Replace the broken sidebar
        # Find and replace the entire sidebar section
        new_content = re.sub(
            r'<aside id="sidebar">.*?</aside>',
            sidebar_template,
            content,
            flags=re.DOTALL
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f'Fixed: {filename}')

print('Done!')
