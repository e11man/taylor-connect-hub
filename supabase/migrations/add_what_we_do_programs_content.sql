-- Add missing content entries for WhatWeDoSection and ProgramsSection

-- WhatWeDoSection main content
INSERT INTO content (page, section, key, value) VALUES
('about', 'what_we_do', 'title', 'Connection Points'),
('about', 'what_we_do', 'description', 'Discover meaningful ways to serve and make a difference in our community by getting connected to Upland organizations.');

-- WhatWeDoSection service entries
INSERT INTO content (page, section, key, value) VALUES
('about', 'what_we_do', 'local_ministries_title', 'Local Ministries'),
('about', 'what_we_do', 'local_ministries_description', 'Hands-on opportunities to serve in local churches and ministry opportunities. These programs focus on meeting immediate needs while building lasting relationships.'),
('about', 'what_we_do', 'community_plunge_title', 'Community Plunge'),
('about', 'what_we_do', 'community_plunge_description', 'An annual service day bringing together hundreds of Taylor students, faculty and staff to join together in bettering our community.'),
('about', 'what_we_do', 'non_profit_organizations_title', 'Non-Profit Organizations'),
('about', 'what_we_do', 'non_profit_organizations_description', 'Local groups dedicated to fostering a charming and welcoming small-town community that bring together people from all walks of life.'),
('about', 'what_we_do', 'town_events_title', 'Town Events'),
('about', 'what_we_do', 'town_events_description', 'Upland is home to countless festivities and events that make this town truly special. Whether it is the Labor Day parade or the Christmastime tree lighting ceremony, there are plenty of opportunities for students to join in the fun.');

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