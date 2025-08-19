#!/usr/bin/env python3
import re

# Read the original file
with open('src/pages/OrganizationLogin.tsx', 'r') as f:
    content = f.read()

# Fix 1: Remove animation classes from header div
content = re.sub(
    r'<div className="text-center mb-8 animate-slide-up">',
    '<div className="text-center mb-8">',
    content
)

# Fix 2: Fix the login form container animations
content = re.sub(
    r'<div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style=\{\{ animationDelay: \'0\.2s\' \}\}>',
    '<div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">',
    content
)

# Fix 3: Update input transition duration and add disabled state
content = re.sub(
    r'className="pl-10 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-\[#00AFCE\] focus:ring-\[#00AFCE\] transition-all duration-300"',
    'className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-colors duration-200"',
    content
)

content = re.sub(
    r'className="pl-10 pr-12 h-12 border-2 border-gray-200 rounded-xl font-montserrat focus:border-\[#00AFCE\] focus:ring-\[#00AFCE\] transition-all duration-300"',
    'className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl font-montserrat focus:border-[#00AFCE] focus:ring-[#00AFCE] transition-colors duration-200"',
    content
)

# Fix 4: Add disabled prop to inputs
content = re.sub(
    r'(\s+required\n\s+)(\/>)',
    r'\1disabled={isLoading}\n                    \2',
    content
)

# Fix 5: Fix submit button - change from type="button" onClick to type="submit"
content = re.sub(
    r'<Button\n\s+type="button" onClick=\{handleSubmit\}\n\s+className="w-full h-12 font-montserrat font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"\n\s+disabled=\{isLoading\}',
    '<Button\n                  type="submit"\n                  className="w-full h-12 font-montserrat font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow duration-200"\n                  disabled={isLoading || !email || !password}',
    content
)

# Write the fixed content
with open('src/pages/OrganizationLogin.tsx', 'w') as f:
    f.write(content)

print("Fixed OrganizationLogin.tsx successfully!")