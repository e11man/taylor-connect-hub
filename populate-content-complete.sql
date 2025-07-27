-- Complete Content Population Script for Dynamic Content System
-- This script populates the content table with ALL text for the entire application

-- Clear existing content (optional - comment out if you want to preserve existing content)
-- DELETE FROM content;

-- ========================================
-- HOME PAGE
-- ========================================

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

-- ========================================
-- ORGANIZATION PAGES
-- ========================================

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

-- Organization Login Page
INSERT INTO content (page, section, key, value, language_code) VALUES
('organizationLogin', 'main', 'title', 'Organization Login', 'en'),
('organizationLogin', 'main', 'subtitle', 'Access your organization dashboard', 'en'),
('organizationLogin', 'main', 'noAccountText', 'Don''t have an account?', 'en'),
('organizationLogin', 'main', 'signUpLink', 'Sign up', 'en');

-- Organization Login Form
INSERT INTO content (page, section, key, value, language_code) VALUES
('organizationLogin', 'form', 'emailLabel', 'Email', 'en'),
('organizationLogin', 'form', 'emailPlaceholder', 'Enter your email', 'en'),
('organizationLogin', 'form', 'passwordLabel', 'Password', 'en'),
('organizationLogin', 'form', 'passwordPlaceholder', 'Enter your password', 'en'),
('organizationLogin', 'form', 'forgotPassword', 'Forgot your password?', 'en'),
('organizationLogin', 'form', 'submitButton', 'Sign In', 'en'),
('organizationLogin', 'form', 'signingIn', 'Signing in...', 'en');

-- Organization Login Messages
INSERT INTO content (page, section, key, value, language_code) VALUES
('organizationLogin', 'messages', 'successTitle', 'Success!', 'en'),
('organizationLogin', 'messages', 'successDescription', 'Welcome back to your organization dashboard.', 'en'),
('organizationLogin', 'messages', 'errorTitle', 'Error', 'en'),
('organizationLogin', 'messages', 'errorNotOrganization', 'This account is not registered as an organization', 'en');

-- ========================================
-- ADMIN PAGES
-- ========================================

-- Admin Login Page
INSERT INTO content (page, section, key, value, language_code) VALUES
('admin', 'login', 'title', 'Admin Console', 'en'),
('admin', 'login', 'subtitle', 'Sign in to access the admin dashboard', 'en'),
('admin', 'login', 'emailLabel', 'Email', 'en'),
('admin', 'login', 'emailPlaceholder', 'admin@example.com', 'en'),
('admin', 'login', 'passwordLabel', 'Password', 'en'),
('admin', 'login', 'passwordPlaceholder', '••••••••', 'en'),
('admin', 'login', 'submitButton', 'Sign In', 'en'),
('admin', 'login', 'signingIn', 'Signing in...', 'en'),
('admin', 'login', 'testCredentialsNote', 'Test credentials: admin@taylor.edu / admin123', 'en'),
('admin', 'login', 'errorInvalidCredentials', 'Invalid email or password', 'en'),
('admin', 'login', 'errorEmailNotConfirmed', 'Please confirm your email address first', 'en'),
('admin', 'login', 'errorNoPrivileges', 'You do not have admin privileges', 'en'),
('admin', 'login', 'errorDatabase', 'Database configuration error. Please contact system administrator.', 'en'),
('admin', 'login', 'successMessage', 'Welcome back! 🎉', 'en'),
('admin', 'login', 'successDescription', 'Successfully logged in to admin dashboard.', 'en');

-- ========================================
-- HEADER & NAVIGATION
-- ========================================

-- Header Navigation
INSERT INTO content (page, section, key, value, language_code) VALUES
('header', 'nav', 'home', 'Home', 'en'),
('header', 'nav', 'about', 'About', 'en'),
('header', 'nav', 'opportunities', 'Opportunities', 'en'),
('header', 'nav', 'contact', 'Contact', 'en'),
('header', 'nav', 'organizationPortal', 'Organization Portal', 'en'),
('header', 'nav', 'adminPortal', 'Admin', 'en');

-- Header Brand
INSERT INTO content (page, section, key, value, language_code) VALUES
('header', 'brand', 'name', 'Community Connect', 'en');

-- Header Buttons
INSERT INTO content (page, section, key, value, language_code) VALUES
('header', 'buttons', 'login', 'Log in', 'en'),
('header', 'buttons', 'signOut', 'Sign Out', 'en'),
('header', 'buttons', 'requestVolunteers', 'Request Volunteers', 'en');

-- ========================================
-- FOOTER
-- ========================================

-- Footer Brand
INSERT INTO content (page, section, key, value, language_code) VALUES
('footer', 'brand', 'name', 'Community Connect', 'en'),
('footer', 'brand', 'tagline', 'Connecting volunteers with meaningful opportunities', 'en'),
('footer', 'brand', 'partnership', 'In partnership with Taylor University', 'en');

-- Footer Links
INSERT INTO content (page, section, key, value, language_code) VALUES
('footer', 'links', 'about', 'About', 'en'),
('footer', 'links', 'contact', 'Contact', 'en'),
('footer', 'links', 'opportunities', 'Opportunities', 'en'),
('footer', 'links', 'privacy', 'Privacy', 'en'),
('footer', 'links', 'terms', 'Terms', 'en');

-- Footer Copyright
INSERT INTO content (page, section, key, value, language_code) VALUES
('footer', 'copyright', 'text', '© 2024 Community Connect', 'en');

-- ========================================
-- ERROR PAGES
-- ========================================

-- 404 Page
INSERT INTO content (page, section, key, value, language_code) VALUES
('notFound', 'main', 'title', '404', 'en'),
('notFound', 'main', 'subtitle', 'Oops! Page not found', 'en'),
('notFound', 'main', 'linkText', 'Go back home', 'en');

-- ========================================
-- USER SECTIONS
-- ========================================

-- User Dashboard
INSERT INTO content (page, section, key, value, language_code) VALUES
('userDashboard', 'main', 'welcomeTitle', 'Welcome back!', 'en'),
('userDashboard', 'main', 'subtitle', 'Here''s what''s happening in your community', 'en'),
('userDashboard', 'stats', 'hoursVolunteered', 'Hours Volunteered', 'en'),
('userDashboard', 'stats', 'eventsJoined', 'Events Joined', 'en'),
('userDashboard', 'stats', 'upcomingEvents', 'Upcoming Events', 'en');

-- Search Section
INSERT INTO content (page, section, key, value, language_code) VALUES
('search', 'main', 'title', 'Find Your Perfect Volunteer Opportunity', 'en'),
('search', 'main', 'subtitle', 'Search from hundreds of opportunities in your area', 'en'),
('search', 'form', 'searchPlaceholder', 'Search opportunities...', 'en'),
('search', 'form', 'locationPlaceholder', 'Enter location', 'en'),
('search', 'filters', 'allCategories', 'All Categories', 'en'),
('search', 'filters', 'searchButton', 'Search', 'en');

-- Opportunities Section
INSERT INTO content (page, section, key, value, language_code) VALUES
('opportunities', 'main', 'title', 'Featured Opportunities', 'en'),
('opportunities', 'main', 'subtitle', 'Make a difference in your community today', 'en'),
('opportunities', 'card', 'viewDetails', 'View Details', 'en'),
('opportunities', 'card', 'applyNow', 'Apply Now', 'en'),
('opportunities', 'card', 'spotsLeft', 'spots left', 'en');

-- Testimonials Section
INSERT INTO content (page, section, key, value, language_code) VALUES
('testimonials', 'main', 'title', 'What Our Volunteers Say', 'en'),
('testimonials', 'main', 'subtitle', 'Real stories from real people making a difference', 'en');

-- Contact Section
INSERT INTO content (page, section, key, value, language_code) VALUES
('contact', 'main', 'title', 'Get in Touch', 'en'),
('contact', 'main', 'subtitle', 'Have questions? We''d love to hear from you', 'en'),
('contact', 'form', 'nameLabel', 'Name', 'en'),
('contact', 'form', 'namePlaceholder', 'Your name', 'en'),
('contact', 'form', 'emailLabel', 'Email', 'en'),
('contact', 'form', 'emailPlaceholder', 'your@email.com', 'en'),
('contact', 'form', 'messageLabel', 'Message', 'en'),
('contact', 'form', 'messagePlaceholder', 'How can we help?', 'en'),
('contact', 'form', 'submitButton', 'Send Message', 'en'),
('contact', 'form', 'sending', 'Sending...', 'en');

-- Call to Action Section
INSERT INTO content (page, section, key, value, language_code) VALUES
('cta', 'main', 'title', 'Ready to Make a Difference?', 'en'),
('cta', 'main', 'subtitle', 'Join our community of volunteers and start creating positive change today', 'en'),
('cta', 'buttons', 'getStarted', 'Get Started Now', 'en'),
('cta', 'buttons', 'learnMore', 'Learn More', 'en');

-- ========================================
-- MODALS
-- ========================================

-- User Auth Modal
INSERT INTO content (page, section, key, value, language_code) VALUES
('userAuth', 'tabs', 'login', 'Log In', 'en'),
('userAuth', 'tabs', 'signup', 'Sign Up', 'en'),
('userAuth', 'login', 'title', 'Welcome Back', 'en'),
('userAuth', 'login', 'subtitle', 'Log in to access your volunteer dashboard', 'en'),
('userAuth', 'signup', 'title', 'Join Our Community', 'en'),
('userAuth', 'signup', 'subtitle', 'Create an account to start volunteering', 'en');

-- Request Volunteers Modal
INSERT INTO content (page, section, key, value, language_code) VALUES
('requestVolunteers', 'main', 'title', 'Request Volunteers', 'en'),
('requestVolunteers', 'main', 'subtitle', 'Tell us about your volunteer opportunity', 'en'),
('requestVolunteers', 'form', 'eventNameLabel', 'Event Name', 'en'),
('requestVolunteers', 'form', 'eventNamePlaceholder', 'Enter event name', 'en'),
('requestVolunteers', 'form', 'dateLabel', 'Date', 'en'),
('requestVolunteers', 'form', 'volunteersNeededLabel', 'Volunteers Needed', 'en'),
('requestVolunteers', 'form', 'descriptionLabel', 'Description', 'en'),
('requestVolunteers', 'form', 'descriptionPlaceholder', 'Describe the volunteer opportunity...', 'en'),
('requestVolunteers', 'form', 'submitButton', 'Submit Request', 'en');

-- Forgot Password Modal
INSERT INTO content (page, section, key, value, language_code) VALUES
('forgotPassword', 'main', 'title', 'Reset Password', 'en'),
('forgotPassword', 'main', 'subtitle', 'Enter your email to receive reset instructions', 'en'),
('forgotPassword', 'form', 'emailLabel', 'Email', 'en'),
('forgotPassword', 'form', 'emailPlaceholder', 'Enter your email', 'en'),
('forgotPassword', 'form', 'submitButton', 'Send Reset Link', 'en'),
('forgotPassword', 'form', 'sending', 'Sending...', 'en'),
('forgotPassword', 'form', 'backToLogin', 'Back to login', 'en');

-- Verify content was inserted
SELECT COUNT(*) as total_content_items FROM content;
SELECT page, section, COUNT(*) as items FROM content GROUP BY page, section ORDER BY page, section;