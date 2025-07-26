-- Setup Database for Admin Console
-- This script sets up the necessary tables, policies, and test data

-- 1. Disable RLS temporarily to insert data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Clear existing test data (optional)
DELETE FROM user_roles WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

DELETE FROM profiles WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- 3. Insert test users into profiles
INSERT INTO profiles (id, user_id, email, dorm, wing, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'admin@taylor.edu', 'Admin Building', 'Administration', 'active', NOW(), NOW()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'john.doe@taylor.edu', 'Wengatz Hall', 'Third West', 'active', NOW(), NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'jane.smith@taylor.edu', 'Olson Hall', 'Second East', 'active', NOW(), NOW()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'mike.johnson@taylor.edu', 'Morris Hall', 'First North', 'pending', NOW(), NOW()),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'sara.williams@taylor.edu', 'English Hall', 'Third Center', 'active', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  dorm = EXCLUDED.dorm,
  wing = EXCLUDED.wing,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 4. Insert user roles
INSERT INTO user_roles (id, user_id, role, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'admin', NOW(), NOW()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'user', NOW(), NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'pa', NOW(), NOW()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'user', NOW(), NOW()),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'user', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE
SET 
  role = EXCLUDED.role,
  updated_at = NOW();

-- 5. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Set up proper RLS policies for public access (anon key)
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

-- 7. Verify the data
SELECT 
  p.email,
  p.dorm,
  p.wing,
  p.status,
  ur.role,
  p.created_at
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC;

-- 8. Count summary
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_users,
  COUNT(CASE WHEN ur.role = 'admin' THEN 1 END) as admin_users
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id;

-- Success message
SELECT '✅ Database setup completed! Users have been created and the admin console should now display them.' as message;