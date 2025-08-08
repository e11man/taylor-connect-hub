-- Ensure content keys exist for pages/sections used in the app
-- Uses ON CONFLICT to avoid duplicates based on unique(page, section, key, language_code)

-- Reset Password Page
INSERT INTO public.content (page, section, key, value, language_code)
VALUES
  ('resetPassword','main','title','Reset Your Password','en'),
  ('resetPassword','main','subtitle','Enter your new password below','en'),
  ('resetPassword','form','new_password_label','New Password','en'),
  ('resetPassword','form','password_requirements','Password must be at least 6 characters long','en'),
  ('resetPassword','form','confirm_password_label','Confirm New Password','en'),
  ('resetPassword','form','updating','Updating Password...','en'),
  ('resetPassword','form','update_button','Update Password','en'),
  ('resetPassword','success','title','Password Updated!','en'),
  ('resetPassword','success','description','Your password has been successfully updated. You will be redirected to the login page shortly.','en'),
  ('resetPassword','success','homeButton','Go to Home','en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET value = EXCLUDED.value;

-- Opportunities Section
INSERT INTO public.content (page, section, key, value, language_code)
VALUES
  ('opportunities','main','title','Volunteer Opportunities','en'),
  ('opportunities','main','loading','Loading events...','en'),
  ('opportunities','main','no_events','No events found','en'),
  ('opportunities','main','adjust_filters','Try adjusting your search or filters','en'),
  ('opportunities','main','search_error_title','Search Error','en'),
  ('opportunities','filters','show_full_events','Show full events','en'),
  ('opportunities','labels','event_full','Event Full','en'),
  ('opportunities','labels','date','Date:','en'),
  ('opportunities','labels','time','Time:','en'),
  ('opportunities','labels','location','Location:','en'),
  ('opportunities','labels','participants','Participants:','en'),
  ('opportunities','labels','participants_suffix','participants','en'),
  ('opportunities','labels','signed_up','Signed Up ✓','en'),
  ('opportunities','buttons','sign_up','Sign Up','en'),
  ('opportunities','buttons','add_group','Add Group','en'),
  ('opportunities','buttons','max_reached','Max Reached','en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET value = EXCLUDED.value;

-- Organization Register
INSERT INTO public.content (page, section, key, value, language_code)
VALUES
  ('organizationRegister','main','title','Register Your Organization','en'),
  ('organizationRegister','main','subtitle','Join our community to post volunteer opportunities.','en'),
  ('organizationRegister','form','organizationNameLabel','Organization Name','en'),
  ('organizationRegister','form','organizationNamePlaceholder','Enter your organization\'s name','en'),
  ('organizationRegister','form','contactNameLabel','Contact Person Name','en'),
  ('organizationRegister','form','emailLabel','Email','en'),
  ('organizationRegister','form','passwordLabel','Password','en'),
  ('organizationRegister','form','confirmPasswordLabel','Confirm Password','en'),
  ('organizationRegister','form','descriptionLabel','Organization Description','en'),
  ('organizationRegister','form','websiteLabel','Website','en'),
  ('organizationRegister','form','phoneLabel','Phone Number','en'),
  ('organizationRegister','form','submitButton','Create Account','en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET value = EXCLUDED.value;

-- Organization Pending Approval
INSERT INTO public.content (page, section, key, value, language_code)
VALUES
  ('organizationPendingApproval','main','title','Registration Submitted Successfully!','en'),
  ('organizationPendingApproval','main','statusBadge','Pending Admin Approval','en'),
  ('organizationPendingApproval','main','subtitle','Thank you for submitting your organization registration!','en'),
  ('organizationPendingApproval','main','description','Your application is currently under review by our administrative team. We will notify you via email once your organization has been approved and you can begin using the platform.','en'),
  ('organizationPendingApproval','main','nextStepsTitle','What happens next?','en'),
  ('organizationPendingApproval','main','step1','Our admin team will review your organization details and credentials','en'),
  ('organizationPendingApproval','main','step2','You\'ll receive an email notification when your application is approved','en'),
  ('organizationPendingApproval','main','step3','Once approved, you can log in and start creating events for the community','en'),
  ('organizationPendingApproval','main','timelineTitle','Typical Review Timeline','en'),
  ('organizationPendingApproval','main','timelineDescription','Most organization applications are reviewed within 2-3 business days. During peak periods, it may take up to 5 business days.','en'),
  ('organizationPendingApproval','main','contactButton','Contact Support','en'),
  ('organizationPendingApproval','main','homeButton','Return Home','en'),
  ('organizationPendingApproval','main','additionalInfo','Questions about your application status?','en'),
  ('organizationPendingApproval','main','supportEmail','support@example.com','en'),
  ('organizationPendingApproval','main','supportPhone','(555) 123-4567','en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET value = EXCLUDED.value;

-- Admin Login page essentials
INSERT INTO public.content (page, section, key, value, language_code)
VALUES
  ('admin','login','title','Admin Console','en'),
  ('admin','login','subtitle','Sign in to access the admin dashboard','en'),
  ('admin','login','emailLabel','Email','en'),
  ('admin','login','passwordLabel','Password','en'),
  ('admin','login','submitButton','Sign In','en'),
  ('admin','login','signingIn','Signing in...','en'),
  ('admin','login','emailPlaceholder','admin@example.com','en'),
  ('admin','login','passwordPlaceholder','••••••••','en'),
  ('admin','login','errorInvalidCredentials','Invalid email or password','en'),
  ('admin','login','errorEmailNotConfirmed','Please confirm your email address first','en'),
  ('admin','login','errorNoPrivileges','You do not have admin privileges','en'),
  ('admin','login','errorDatabase','Database configuration error. Please contact system administrator.','en'),
  ('admin','login','successMessage','Welcome back! 🎉','en'),
  ('admin','login','successDescription','Successfully logged in to admin dashboard.','en'),
  ('admin','login','testCredentialsNote','Test credentials: admin@taylor.edu / admin123','en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET value = EXCLUDED.value;

-- Not Found (404) Page
INSERT INTO public.content (page, section, key, value, language_code)
VALUES
  ('notFound','main','title','404','en'),
  ('notFound','main','subtitle','Oops! Page not found','en'),
  ('notFound','main','linkText','Go back home','en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET value = EXCLUDED.value;