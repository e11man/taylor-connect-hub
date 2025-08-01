-- Remove the foreign key constraint to auth.users and add PA role
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Set the user as a PA  
INSERT INTO public.user_roles (user_id, role) 
VALUES ('b9617385-bc39-4b46-9fc7-8a9eb1d72737', 'pa');