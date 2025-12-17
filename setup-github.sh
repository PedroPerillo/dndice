#!/bin/bash

echo "🚀 Setting up GitHub repository..."
echo ""

# Check if GitHub CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo "⚠️  GitHub CLI not authenticated. Please run: gh auth login"
    exit 1
fi

# Create repository and push
echo "Creating GitHub repository 'dndice'..."
gh repo create dndice --public --source=. --remote=origin --push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your repository is now on GitHub!"
    echo ""
    echo "Repository URL:"
    gh repo view --web
else
    echo ""
    echo "❌ Failed to create repository. You can do it manually:"
    echo "1. Go to https://github.com/new"
    echo "2. Create a repository named 'dndice'"
    echo "3. Run: git remote add origin https://github.com/YOUR_USERNAME/dndice.git"
    echo "4. Run: git push -u origin main"
fi

