-- Create content table for dynamic text management
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique content keys per page/section/language
  UNIQUE(page, section, key, language_code)
);

-- Enable Row Level Security
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Create policies for content access
CREATE POLICY "Content is viewable by everyone" 
ON public.content 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage content" 
ON public.content 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_content_page_section ON public.content(page, section);
CREATE INDEX idx_content_language ON public.content(language_code);
CREATE INDEX idx_content_lookup ON public.content(page, section, key, language_code);

-- Insert initial content from existing pages
INSERT INTO public.content (page, section, key, value, language_code) VALUES
-- Home page hero section
('home', 'hero', 'title', 'Connect. Volunteer. Make a Difference.', 'en'),
('home', 'hero', 'subtitle', 'Join our vibrant community of passionate volunteers and discover meaningful opportunities to create positive change in Upland and beyond.', 'en'),
('home', 'hero', 'cta_primary', 'Find Opportunities', 'en'),
('home', 'hero', 'cta_secondary', 'Learn More', 'en'),

-- Home page search section
('home', 'search', 'title', 'Find Your Perfect Volunteer Match', 'en'),
('home', 'search', 'subtitle', 'Discover opportunities that align with your passions and schedule', 'en'),
('home', 'search', 'search_placeholder', 'Search opportunities...', 'en'),
('home', 'search', 'filter_all', 'All Categories', 'en'),

-- Home page opportunities section
('home', 'opportunities', 'title', 'Featured Opportunities', 'en'),
('home', 'opportunities', 'subtitle', 'Discover meaningful ways to make a difference in your community', 'en'),
('home', 'opportunities', 'view_all', 'View All Opportunities', 'en'),

-- Home page impact section
('home', 'impact', 'title', 'Our Community Impact', 'en'),
('home', 'impact', 'volunteers_label', 'Active Volunteers', 'en'),
('home', 'impact', 'hours_label', 'Hours Contributed', 'en'),
('home', 'impact', 'events_label', 'Events Completed', 'en'),
('home', 'impact', 'organizations_label', 'Partner Organizations', 'en'),

-- Home page programs section
('home', 'programs', 'title', 'Our Programs', 'en'),
('home', 'programs', 'subtitle', 'Explore our diverse range of volunteer programs designed to create lasting impact', 'en'),

-- Home page testimonials section
('home', 'testimonials', 'title', 'What Our Volunteers Say', 'en'),
('home', 'testimonials', 'subtitle', 'Hear from community members who are making a difference', 'en'),

-- Home page CTA section
('home', 'cta', 'title', 'Ready to Make a Difference?', 'en'),
('home', 'cta', 'subtitle', 'Join our community of passionate volunteers and start creating positive change today.', 'en'),
('home', 'cta', 'button_text', 'Get Started Today', 'en'),

-- About page mission section
('about', 'mission', 'title', 'Our Mission', 'en'),
('about', 'mission', 'description', 'Community Connect is dedicated to fostering meaningful relationships between passionate volunteers and impactful opportunities. We believe that when individuals come together with shared purpose, they can create transformative change that extends far beyond individual efforts. Our platform serves as a bridge, connecting hearts and hands to build stronger, more resilient Upland through collective action.', 'en'),

-- Header navigation
('header', 'nav', 'home', 'Home', 'en'),
('header', 'nav', 'about', 'About', 'en'),
('header', 'nav', 'opportunities', 'Opportunities', 'en'),
('header', 'nav', 'contact', 'Contact', 'en'),
('header', 'nav', 'login', 'Login', 'en'),
('header', 'nav', 'get_started', 'Get Started', 'en'),

-- Footer
('footer', 'brand', 'name', 'Community Connect', 'en'),
('footer', 'nav', 'about', 'About', 'en'),
('footer', 'nav', 'contact', 'Contact', 'en'),
('footer', 'nav', 'opportunities', 'Opportunities', 'en'),
('footer', 'nav', 'privacy', 'Privacy', 'en'),
('footer', 'nav', 'terms', 'Terms', 'en'),
('footer', 'footer', 'copyright', '© 2024 Community Connect. All rights reserved.', 'en'),
('footer', 'footer', 'partnership', 'Made in partnership with Taylor University and Upland community organizations.', 'en'),

-- Admin content
('admin', 'login', 'title', 'Admin Console', 'en'),
('admin', 'login', 'subtitle', 'Sign in to access the admin dashboard', 'en'),
('admin', 'dashboard', 'title', 'Admin Dashboard', 'en'),
('admin', 'content', 'title', 'Content Management', 'en'),
('admin', 'content', 'description', 'Manage all text content across the application', 'en');

-- Enable realtime for content table
ALTER TABLE public.content REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content;