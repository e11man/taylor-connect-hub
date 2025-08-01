#!/bin/bash

echo "Setting up Email Service for Taylor Connect Hub..."
echo "================================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found"

# Navigate to email-service directory
cd email-service

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Go back to project root
cd ..

echo ""
echo "🎉 Email service setup complete!"
echo ""
echo "To start the email server:"
echo "  npm run email-server"
echo ""
echo "To start both frontend and email server:"
echo "  npm run dev:full"
echo ""
echo "To test the email service:"
echo "  node test_email_integration.js" 