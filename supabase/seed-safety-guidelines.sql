-- Insert safety guidelines content
INSERT INTO content (page, section, key, value, language_code) VALUES 
  ('events', 'safety', 'guidelines_title', 'Safety Guidelines', 'en'),
  ('events', 'safety', 'guidelines_subtitle', 'Please review and accept these safety guidelines before signing up for an event:', 'en'),
  ('events', 'safety', 'guideline_1', 'Never go alone - always volunteer with a friend or group member', 'en'),
  ('events', 'safety', 'guideline_2', 'Tell someone where you''re going and when you expect to return', 'en'),
  ('events', 'safety', 'guideline_3', 'Keep your phone charged and with you at all times', 'en'),
  ('events', 'safety', 'guideline_4', 'Follow all instructions from event organizers and site supervisors', 'en'),
  ('events', 'safety', 'guideline_5', 'Report any safety concerns immediately to the event coordinator', 'en'),
  ('events', 'safety', 'accept_button', 'I Accept and Understand', 'en'),
  ('events', 'safety', 'cancel_button', 'Cancel', 'en')
ON CONFLICT (page, section, key, language_code) 
DO UPDATE SET 
  value = EXCLUDED.value, 
  updated_at = NOW();