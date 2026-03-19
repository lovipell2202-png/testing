#!/bin/bash

# GitHub Pages Setup Script
# This script helps you prepare your project for GitHub Pages deployment

echo "🚀 GitHub Pages Setup Script"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "public/index.html" ]; then
    echo "❌ Error: public/index.html not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "✅ Found public folder"
echo ""

# Create a new directory for GitHub Pages
read -p "Enter your GitHub username: " github_username
repo_name="${github_username}.github.io"

echo ""
echo "📁 Creating GitHub Pages repository structure..."
echo ""

# Create temp directory
mkdir -p temp-github-pages
cd temp-github-pages

# Copy public files
cp -r ../public/* .
rm -rf public

echo "✅ Files copied"
echo ""

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
Thumbs.db
EOF

echo "✅ .gitignore created"
echo ""

# Create README
cat > README.md << EOF
# HR Training Management System

Frontend deployed to GitHub Pages.

**Live Site**: https://${github_username}.github.io

## Setup Instructions

1. Clone this repository
2. Update API URLs in JavaScript files to point to your backend
3. Push changes to GitHub
4. Site will be live at https://${github_username}.github.io

## Backend

For full functionality, deploy the backend to Render or similar service.
See QUICK_DEPLOY.md for instructions.

## Features

- Employee Management
- Training Records
- Exam Management
- Training Evaluation Forms
- Print Preview

## Technologies

- HTML5
- CSS3
- JavaScript (Vanilla)
- Responsive Design

EOF

echo "✅ README.md created"
echo ""

# Initialize git
git init
git add .
git commit -m "Initial commit - HR Training System Frontend"

echo ""
echo "✅ Git repository initialized"
echo ""
echo "📋 Next Steps:"
echo "1. Create repository on GitHub: https://github.com/new"
echo "2. Name it: ${repo_name}"
echo "3. Run these commands:"
echo ""
echo "   cd temp-github-pages"
echo "   git remote add origin https://github.com/${github_username}/${repo_name}.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Go to GitHub Settings → Pages"
echo "5. Select 'main' branch and '/ (root)' folder"
echo "6. Your site will be live at: https://${github_username}.github.io"
echo ""
echo "✨ Done! Your frontend is ready for GitHub Pages!"
