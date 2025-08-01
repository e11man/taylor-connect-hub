-- Set the user as a PA
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5d495f84-97a3-41fb-bbb1-30a63d2058f0', 'pa')
ON CONFLICT (user_id, role) DO NOTHING;