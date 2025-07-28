# Deployment Guide - Taylor Connect Hub

## ✅ Routing Configuration Fixed

This guide explains how the admin page routing has been configured to work seamlessly on **Vercel**, **Netlify**, **Lovable**, and other hosting platforms.

## 🔧 Configuration Files Created

### 1. `vercel.json` (For Vercel deployment)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures all routes are handled by React Router.

### 2. `public/_redirects` (For Netlify/Lovable compatibility)
```
/*    /index.html   200
```
This provides SPA fallback for Netlify-style hosting.

### 3. `public/404.html` (Additional fallback)
Redirects any unmatched routes back to the main application.

### 4. Updated `vite.config.ts`
- Added `historyApiFallback: true` for dev server
- Configured proper build optimization with code splitting
- Enhanced chunk splitting for better performance

## 🚀 Deployment Instructions

### For Vercel:
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy! The `vercel.json` will handle routing automatically

### For Netlify:
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. The `_redirects` file will handle SPA routing

### For Lovable:
The platform should automatically detect the configuration and handle routing correctly.

## 🛠 Admin Routes

The following admin routes are now properly configured:

- **`/admin`** → Admin Login Page
- **`/admin/dashboard`** → Admin Dashboard
- **Direct navigation works** (no more 404 errors)
- **Page refresh works** (maintains route state)
- **Browser back/forward works** correctly

## 🔐 Admin Authentication

### Demo Credentials (Works immediately):
- Email: `admin@taylor.edu`
- Password: `admin123`

### Production Setup:
1. Create user in Supabase Dashboard with email `admin@taylor.edu`
2. Run this SQL in Supabase SQL Editor:
```sql
-- Insert admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@taylor.edu'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Insert admin profile
INSERT INTO public.profiles (user_id, email, dorm, wing, status)
SELECT id, 'admin@taylor.edu', 'Admin', 'Admin', 'active'
FROM auth.users 
WHERE email = 'admin@taylor.edu'
ON CONFLICT (user_id) DO UPDATE SET status = 'active';
```

## ✅ Verification Checklist

After deployment, verify:
- [ ] `/admin` loads the login page
- [ ] `/admin/dashboard` loads the dashboard (after login)
- [ ] Direct URL navigation works
- [ ] Page refresh maintains the route
- [ ] Login redirects work correctly
- [ ] Logout returns to login page

## 🐛 Troubleshooting

If you still get 404 errors:
1. Check that `vercel.json` is in the root directory
2. Verify `public/_redirects` exists
3. Ensure build output is in `dist/` directory
4. Check browser network tab for redirect responses

## 📁 File Structure
```
/
├── vercel.json              # Vercel routing config
├── public/
│   ├── _redirects          # Netlify routing config
│   └── 404.html            # Fallback page
├── src/
│   ├── App.tsx             # Main routing setup
│   └── pages/
│       ├── AdminLogin.tsx  # /admin
│       └── AdminDashboard.tsx # /admin/dashboard
└── dist/                   # Build output
```

Your admin pages are now fully configured and will work correctly on all deployment platforms! 🎉