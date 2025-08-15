-- Add missing content entries for WhatWeDoSection and ProgramsSection

-- WhatWeDoSection main content
INSERT INTO content (page, section, key, value) VALUES
('about', 'what_we_do', 'title', 'What We Do'),
('about', 'what_we_do', 'description', 'Discover meaningful ways to serve and make a difference in our community through Taylor World Outreach programs.');

-- WhatWeDoSection service entries
INSERT INTO content (page, section, key, value) VALUES
('about', 'what_we_do', 'local_ministries_title', 'Local Ministries'),
('about', 'what_we_do', 'local_ministries_description', 'Taylor World Outreach (TWO) ministries provide hands-on opportunities to serve in our local Upland and beyond. These programs focus on meeting immediate needs while building lasting relationships.'),
('about', 'what_we_do', 'community_plunge_title', 'Community Plunge'),
('about', 'what_we_do', 'community_plunge_description', 'Our signature immersive experience where volunteers dive deep into service in Upland, building connections and creating lasting impact through intensive, focused engagement.'),
('about', 'what_we_do', 'world_opportunities_title', 'World Opportunities'),
('about', 'what_we_do', 'world_opportunities_description', 'Learn about opportunities to serve globally, from short-term mission trips to long-term international partnerships that expand your impact beyond local borders.'),
('about', 'what_we_do', 'community_outreach_title', 'Community Outreach Programs'),
('about', 'what_we_do', 'community_outreach_description', 'Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships.');

-- ProgramsSection main content
INSERT INTO content (page, section, key, value) VALUES
('about', 'programs', 'title', 'Community Outreach Programs'),
('about', 'programs', 'description', 'Share the love of Christ through diverse service opportunities that address real needs in Upland and foster meaningful relationships.');

-- ProgramsSection program entries
INSERT INTO content (page, section, key, value) VALUES
('about', 'programs', 'basics_title', 'Basics'),
('about', 'programs', 'basics_description', 'Essential needs support for families and individuals'),
('about', 'programs', 'basics_jr_title', 'Basics Jr.'),
('about', 'programs', 'basics_jr_description', 'Youth-focused programs for children and teens'),
('about', 'programs', 'carpenters_hands_title', 'Carpenter''s Hands'),
('about', 'programs', 'carpenters_hands_description', 'Home repair and construction projects'),
('about', 'programs', 'esl_title', 'ESL'),
('about', 'programs', 'esl_description', 'English as Second Language tutoring and support'),
('about', 'programs', 'lift_title', 'Lift'),
('about', 'programs', 'lift_description', 'Mentorship and encouragement programs'),
('about', 'programs', 'realife_title', 'ReaLife'),
('about', 'programs', 'realife_description', 'Real-life skills and life coaching');