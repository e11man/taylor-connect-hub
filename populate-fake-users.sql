-- Populate Database with Fake Users
-- This script creates a diverse set of fake users for testing

-- 1. Disable RLS temporarily to insert data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Create a function to generate random UUIDs for consistent fake data
CREATE OR REPLACE FUNCTION generate_test_uuid(base_text text, index int)
RETURNS uuid AS $$
BEGIN
  RETURN uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, base_text || index::text);
END;
$$ LANGUAGE plpgsql;

-- 3. Insert fake Taylor University users
DO $$
DECLARE
  dorms text[] := ARRAY['Wengatz Hall', 'Olson Hall', 'Morris Hall', 'English Hall', 'Breuninger Hall', 'Campbell Hall', 'Swallow Robin Hall', 'Gerig Hall'];
  wings text[] := ARRAY['First West', 'First East', 'First Center', 'Second West', 'Second East', 'Second Center', 'Third West', 'Third East', 'Third Center'];
  first_names text[] := ARRAY['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Oliver', 'Amelia', 'Benjamin', 'Harper', 'Lucas', 'Evelyn', 'Henry', 'Abigail', 'Alexander', 'Emily', 'Michael', 'Elizabeth', 'Daniel', 'Sofia', 'Jackson', 'Avery', 'Sebastian', 'Ella', 'Aiden', 'Madison', 'Matthew', 'Scarlett', 'Logan', 'Victoria', 'David', 'Aria', 'Joseph'];
  last_names text[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips'];
  statuses text[] := ARRAY['active', 'active', 'active', 'active', 'active', 'active', 'active', 'pending'];
  roles text[] := ARRAY['user', 'user', 'user', 'user', 'user', 'user', 'pa', 'user'];
  i int;
  j int;
  user_count int := 0;
  user_uuid uuid;
  user_email text;
  user_dorm text;
  user_wing text;
  user_status text;
  user_role text;
  first_name text;
  last_name text;
BEGIN
  -- Insert regular Taylor users
  FOR i IN 1..120 LOOP
    first_name := first_names[1 + (i % array_length(first_names, 1))];
    last_name := last_names[1 + (i % array_length(last_names, 1))];
    user_email := lower(first_name || '.' || last_name || i::text || '@taylor.edu');
    user_uuid := generate_test_uuid('taylor-user-', i);
    user_dorm := dorms[1 + (i % array_length(dorms, 1))];
    user_wing := wings[1 + (i % array_length(wings, 1))];
    user_status := statuses[1 + (i % array_length(statuses, 1))];
    user_role := roles[1 + (i % array_length(roles, 1))];
    
    -- Insert profile
    INSERT INTO profiles (id, user_id, email, dorm, wing, status, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      user_uuid,
      user_email,
      user_dorm,
      user_wing,
      user_status,
      NOW() - (random() * interval '90 days'),
      NOW() - (random() * interval '30 days')
    ) ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      dorm = EXCLUDED.dorm,
      wing = EXCLUDED.wing,
      status = EXCLUDED.status,
      updated_at = NOW();
    
    -- Insert role
    INSERT INTO user_roles (id, user_id, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      user_uuid,
      user_role::user_role,
      NOW() - (random() * interval '90 days'),
      NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
    
    user_count := user_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Inserted % regular users', user_count;
END $$;

-- 4. Insert specific test accounts
INSERT INTO profiles (id, user_id, email, dorm, wing, status, created_at, updated_at)
VALUES 
  -- Admin users
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'admin@taylor.edu', 'Admin Building', 'Administration', 'active', NOW() - interval '180 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('admin-', 2), 'superadmin@taylor.edu', 'Admin Building', 'Administration', 'active', NOW() - interval '365 days', NOW()),
  
  -- PA users
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'jane.smith@taylor.edu', 'Olson Hall', 'Second East', 'active', NOW() - interval '120 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('pa-', 1), 'sarah.pa@taylor.edu', 'Wengatz Hall', 'Third West', 'active', NOW() - interval '90 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('pa-', 2), 'michael.pa@taylor.edu', 'Morris Hall', 'First Center', 'active', NOW() - interval '60 days', NOW()),
  
  -- Special test users
  (gen_random_uuid(), generate_test_uuid('test-', 1), 'test.user@taylor.edu', 'English Hall', 'Second West', 'active', NOW() - interval '30 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('pending-', 1), 'pending.user@taylor.edu', 'Breuninger Hall', 'First East', 'pending', NOW() - interval '2 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('blocked-', 1), 'blocked.user@taylor.edu', 'Campbell Hall', 'Third Center', 'blocked', NOW() - interval '45 days', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  dorm = EXCLUDED.dorm,
  wing = EXCLUDED.wing,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 5. Insert roles for specific test accounts
INSERT INTO user_roles (id, user_id, role, created_at, updated_at)
VALUES
  -- Admin roles
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'admin', NOW() - interval '180 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('admin-', 2), 'admin', NOW() - interval '365 days', NOW()),
  
  -- PA roles
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'pa', NOW() - interval '120 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('pa-', 1), 'pa', NOW() - interval '90 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('pa-', 2), 'pa', NOW() - interval '60 days', NOW()),
  
  -- Regular user roles
  (gen_random_uuid(), generate_test_uuid('test-', 1), 'user', NOW() - interval '30 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('pending-', 1), 'user', NOW() - interval '2 days', NOW()),
  (gen_random_uuid(), generate_test_uuid('blocked-', 1), 'user', NOW() - interval '45 days', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 6. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Ensure proper RLS policies for anon access
DROP POLICY IF EXISTS "Public read access to profiles" ON profiles;
CREATE POLICY "Public read access to profiles" 
ON profiles FOR SELECT 
TO anon
USING (true);

DROP POLICY IF EXISTS "Public read access to user_roles" ON user_roles;
CREATE POLICY "Public read access to user_roles" 
ON user_roles FOR SELECT 
TO anon
USING (true);

-- 8. Create summary statistics
WITH user_stats AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_users,
    COUNT(CASE WHEN p.status = 'blocked' THEN 1 END) as blocked_users,
    COUNT(CASE WHEN ur.role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN ur.role = 'pa' THEN 1 END) as pa_users,
    COUNT(CASE WHEN ur.role = 'user' THEN 1 END) as regular_users
  FROM profiles p
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id
),
dorm_stats AS (
  SELECT dorm, COUNT(*) as user_count
  FROM profiles
  GROUP BY dorm
  ORDER BY user_count DESC
)
SELECT 
  '📊 User Statistics' as section,
  total_users || ' total users' as stat_1,
  active_users || ' active users' as stat_2,
  pending_users || ' pending users' as stat_3,
  blocked_users || ' blocked users' as stat_4,
  admin_users || ' admins' as stat_5,
  pa_users || ' PAs' as stat_6,
  regular_users || ' regular users' as stat_7
FROM user_stats
UNION ALL
SELECT 
  '🏢 Top Dorms' as section,
  dorm || ': ' || user_count || ' users' as stat_1,
  '' as stat_2,
  '' as stat_3,
  '' as stat_4,
  '' as stat_5,
  '' as stat_6,
  '' as stat_7
FROM dorm_stats
LIMIT 10;

-- 9. Display sample users
SELECT 
  '📧 Sample Users' as category,
  p.email,
  p.dorm || ', ' || p.wing as location,
  p.status,
  ur.role,
  to_char(p.created_at, 'MM/DD/YYYY') as joined_date
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC
LIMIT 20;

-- 10. Success message
SELECT '✅ Successfully populated database with ' || COUNT(*) || ' fake users!' as message
FROM profiles;

-- 11. Clean up temporary function
DROP FUNCTION IF EXISTS generate_test_uuid(text, int);