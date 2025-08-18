-- Update branding from Taylor Connect Hub to Main Street Connect
UPDATE content 
SET value = 'Main Street Connect' 
WHERE value = 'Taylor Connect Hub';

UPDATE content 
SET value = 'Main Street Connect is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.'
WHERE page = 'privacy' AND section = 'main' AND key = 'intro_text';

UPDATE content 
SET value = 'Welcome to Main Street Connect. These Terms of Service govern your use of our platform and services. By accessing or using our platform, you agree to be bound by these terms and all applicable laws and regulations.'
WHERE page = 'terms' AND section = 'main' AND key = 'intro_text';

UPDATE content 
SET value = 'Main Street Connect provides a platform that connects students with volunteer opportunities offered by community organizations. Our services include:'
WHERE page = 'terms' AND section = 'services' AND key = 'description';

UPDATE content 
SET value = 'Main Street Connect serves as a platform to connect volunteers with organizations. We are not responsible for the conduct of individual users or organizations, nor for any injuries, damages, or losses that may occur during volunteer activities. Users participate in events at their own risk.'
WHERE page = 'terms' AND section = 'liability' AND key = 'description';

UPDATE content 
SET value = 'About Main Street Connect'
WHERE page = 'about' AND section = 'main' AND key = 'title';

UPDATE content 
SET value = 'Main Street Connect is a comprehensive platform designed to connect students and community members with meaningful volunteer opportunities in the local community. Our mission is to foster civic engagement, build lasting relationships, and create positive impact through service.'
WHERE page = 'about' AND section = 'main' AND key = 'description';

UPDATE content 
SET value = '© 2024 Main Street Connect. All rights reserved.'
WHERE page = 'footer' AND section = 'copyright' AND key = 'text';

UPDATE content 
SET value = 'Sign in to your Main Street Connect account.'
WHERE page = 'userLogin' AND section = 'header' AND key = 'subtitle';