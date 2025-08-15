-- Add missing contact information content entries to content table
-- This migration adds dynamic content for hardcoded fallback values in ContactSection

-- Phone description
INSERT INTO content (page, section, key, value, language_code)
VALUES ('contact', 'info', 'phone_description', 'Monday - Friday, 9AM - 5PM', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Address description
INSERT INTO content (page, section, key, value, language_code)
VALUES ('contact', 'info', 'address_description', 'Taylor University Campus', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Email description
INSERT INTO content (page, section, key, value, language_code)
VALUES ('contact', 'info', 'email_description', 'Send us a message anytime', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Contact info section title
INSERT INTO content (page, section, key, value, language_code)
VALUES ('sections', 'contact', 'contact_info_title', 'Contact Information', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Quick response title
INSERT INTO content (page, section, key, value, language_code)
VALUES ('sections', 'contact', 'quick_response_title', 'Quick Response', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Send message title
INSERT INTO content (page, section, key, value, language_code)
VALUES ('sections', 'contact', 'send_message_title', 'Send us a Message', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Contact section main title
INSERT INTO content (page, section, key, value, language_code)
VALUES ('sections', 'contact', 'title', 'Get In Touch', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

-- Mission section content
INSERT INTO content (page, section, key, value, language_code)
VALUES ('homepage', 'mission', 'title', 'Our Mission', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;

INSERT INTO content (page, section, key, value, language_code)
VALUES ('homepage', 'mission', 'description', 'Community Connect is dedicated to fostering meaningful relationships between passionate volunteers and impactful opportunities. We believe that when individuals come together with shared purpose, they can create transformative change that extends far beyond individual efforts. Our platform serves as a bridge, connecting hearts and hands to build stronger, more resilient Upland through collective action.', 'en')
ON CONFLICT (page, section, key, language_code) DO NOTHING;