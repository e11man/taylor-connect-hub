-- Create admin user through signup and assign admin role
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- First check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@taylor.edu';
    
    -- If user doesn't exist, we need to create one manually for admin access
    IF admin_user_id IS NULL THEN
        -- Insert admin user directly into auth.users (for development purposes)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@taylor.edu',
            crypt('admin123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}'
        )
        RETURNING id INTO admin_user_id;
    END IF;
    
    -- Ensure admin role exists in user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::user_role)
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::user_role;
    
END $$;