-- Content Population Script for Dynamic Content System
-- This script populates the content table with all necessary text for the application

-- Clear existing content (optional - comment out if you want to preserve existing content)
-- DELETE FROM content;

-- Home Page - Hero Section
INSERT INTO content (page, section, key, value, language_code) VALUES
('home', 'hero', 'titleLine1', 'Connect.', 'en'),
('home', 'hero', 'titleLine2', 'Volunteer.', 'en'),
('home', 'hero', 'titleLine3', 'Make a Difference.', 'en'),
('home', 'hero', 'subtitle', 'Join thousands of volunteers making a positive impact in their communities. Find opportunities that match your skills and passion.', 'en'),
('home', 'hero', 'ctaButton', 'Get Started', 'en'),
('home', 'hero', 'secondaryButton', 'Learn More', 'en');

-- Home Page - Impact Section
INSERT INTO content (page, section, key, value, language_code) VALUES
('home', 'impact', 'volunteers_label', 'Active Volunteers', 'en'),
('home', 'impact', 'hours_label', 'Hours Volunteered', 'en'),
('home', 'impact', 'organizations_label', 'Partner Organizations', 'en');

-- Organization Register Page
INSERT INTO content (page, section, key, value, language_code) VALUES
('organizationRegister', 'main', 'title', 'Register Your Organization', 'en'),
('organizationRegister', 'main', 'subtitle', 'Join our community to post volunteer opportunities.', 'en'),
('organizationRegister', 'main', 'signInLink', 'Already have an account? Sign In', 'en');

-- Organization Register Form
INSERT INTO content (page, section, key, value, language_code) VALUES
('organizationRegister', 'form', 'organizationNameLabel', 'Organization Name', 'en'),
('organizationRegister', 'form', 'organizationNamePlaceholder', 'Enter your organization''s name', 'en'),
('organizationRegister', 'form', 'contactNameLabel', 'Contact Person Name', 'en'),
('organizationRegister', 'form', 'contactNamePlaceholder', 'Enter contact person''s full name', 'en'),
('organizationRegister', 'form', 'emailLabel', 'Email', 'en'),
('organizationRegister', 'form', 'emailPlaceholder', 'Enter your organization''s email', 'en'),
('organizationRegister', 'form', 'passwordLabel', 'Password', 'en'),
('organizationRegister', 'form', 'passwordPlaceholder', 'Create a password', 'en'),
('organizationRegister', 'form', 'confirmPasswordLabel', 'Confirm Password', 'en'),
('organizationRegister', 'form', 'confirmPasswordPlaceholder', 'Confirm your password', 'en'),
('organizationRegister', 'form', 'organizationDescriptionLabel', 'Organization Description', 'en'),
('organizationRegister', 'form', 'organizationDescriptionPlaceholder', 'Tell us about your organization (e.g., mission, what you do, target demographics)', 'en'),
('organizationRegister', 'form', 'websiteLabel', 'Website (Optional)', 'en'),
('organizationRegister', 'form', 'websitePlaceholder', 'e.g., https://your-organization.org', 'en'),
('organizationRegister', 'form', 'phoneNumberLabel', 'Phone Number (Optional)', 'en'),
('organizationRegister', 'form', 'phoneNumberPlaceholder', 'e.g., +1 555 123 4567', 'en'),
('organizationRegister', 'form', 'submitButton', 'Register', 'en');

-- Admin Login Page
INSERT INTO content (page, section, key, value, language_code) VALUES
('admin', 'login', 'title', 'Admin Console', 'en'),
('admin', 'login', 'subtitle', 'Sign in to access the admin dashboard', 'en'),
('admin', 'login', 'emailLabel', 'Email', 'en'),
('admin', 'login', 'emailPlaceholder', 'admin@example.com', 'en'),
('admin', 'login', 'passwordLabel', 'Password', 'en'),
('admin', 'login', 'passwordPlaceholder', '••••••••', 'en'),
('admin', 'login', 'submitButton', 'Sign In', 'en'),
('admin', 'login', 'errorInvalidCredentials', 'Invalid email or password', 'en'),
('admin', 'login', 'errorEmailNotConfirmed', 'Please confirm your email address first', 'en'),
('admin', 'login', 'errorNoPrivileges', 'You do not have admin privileges', 'en');

-- Header Navigation
INSERT INTO content (page, section, key, value, language_code) VALUES
('header', 'nav', 'home', 'Home', 'en'),
('header', 'nav', 'about', 'About', 'en'),
('header', 'nav', 'opportunities', 'Opportunities', 'en'),
('header', 'nav', 'contact', 'Contact', 'en'),
('header', 'nav', 'organizationPortal', 'Organization Portal', 'en'),
('header', 'nav', 'adminPortal', 'Admin', 'en');

-- Footer
INSERT INTO content (page, section, key, value, language_code) VALUES
('footer', 'brand', 'name', 'Community Connect', 'en'),
('footer', 'brand', 'tagline', 'Connecting volunteers with meaningful opportunities', 'en'),
('footer', 'links', 'privacyPolicy', 'Privacy Policy', 'en'),
('footer', 'links', 'termsOfService', 'Terms of Service', 'en'),
('footer', 'links', 'contactUs', 'Contact Us', 'en'),
('footer', 'copyright', 'text', '© 2024 Community Connect. All rights reserved.', 'en');

-- 404 Page
INSERT INTO content (page, section, key, value, language_code) VALUES
('notFound', 'main', 'title', '404', 'en'),
('notFound', 'main', 'subtitle', 'Oops! Page not found', 'en'),
('notFound', 'main', 'linkText', 'Go back home', 'en');

-- Add more content entries as needed for other pages...

-- Verify content was inserted
SELECT page, section, key, value FROM content ORDER BY page, section, key;