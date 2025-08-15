-- Add missing testimonials data to content table
-- This ensures all testimonials are dynamically loaded from the database

-- Add main testimonials section content
INSERT INTO content (page, section, key, value, language_code) VALUES
('testimonials', 'main', 'title', 'Stories of Impact', 'en'),
('testimonials', 'main', 'subtitle', 'Discover how Community Connect is bringing people together and making a difference in our community.', 'en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Add missing author and role data for existing testimonials
INSERT INTO content (page, section, key, value, language_code) VALUES
-- Testimonial 1 - Sarah Johnson
('testimonials', 'testimonial1', 'author', 'Sarah Johnson', 'en'),
('testimonials', 'testimonial1', 'role', 'Volunteer', 'en'),

-- Testimonial 2 - Marcus Chen  
('testimonials', 'testimonial2', 'author', 'Marcus Chen', 'en'),
('testimonials', 'testimonial2', 'role', 'Program Director', 'en'),

-- Testimonial 3 - Emma Rodriguez
('testimonials', 'testimonial3', 'author', 'Emma Rodriguez', 'en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Update testimonial 3 role to Student (it was incorrectly set)
UPDATE content 
SET value = 'Student', updated_at = NOW()
WHERE page = 'testimonials' 
  AND section = 'testimonial3' 
  AND key = 'role' 
  AND language_code = 'en';

-- Update testimonial 3 author to Emma Rodriguez (it was incorrectly set to Local Animal Shelter)
UPDATE content 
SET value = 'Emma Rodriguez', updated_at = NOW()
WHERE page = 'testimonials' 
  AND section = 'testimonial3' 
  AND key = 'author' 
  AND language_code = 'en';

-- Insert testimonial content
INSERT INTO content (page, section, key, value, language_code) VALUES
('testimonials', 'testimonial1', 'content', 'Main Street Connect helped me find the perfect volunteer opportunity. I''ve made lifelong friends while making a real difference in our community.', 'en'),
('testimonials', 'testimonial2', 'content', 'The platform made it so easy to find volunteers for our literacy program. We''ve been able to reach twice as many students this year.', 'en'),
('testimonials', 'testimonial3', 'content', 'I love how the opportunities are categorized and filtered. It''s never been easier to find causes I''m passionate about.', 'en')
ON CONFLICT (page, section, key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();