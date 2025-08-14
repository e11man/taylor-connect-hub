# Debugging Production Error on Vercel

## Issue Summary
You're experiencing a generic "Something went wrong" error when accessing non-existent routes (like `/projects`) on your Vercel deployment.

## Changes Made to Fix the Issue

### 1. Enhanced Error Logging
- Updated `ErrorBoundary.tsx` to log more detailed error information in production
- Added structured logging that will appear in Vercel's function logs
- Error details now include timestamp, URL, and user agent for better debugging

### 2. Removed Problematic 404.html
- Deleted `public/404.html` which was causing a redirect loop
- Vercel's SPA handling with the existing `vercel.json` configuration is sufficient

### 3. Improved NotFound Component
- Enhanced error handling in the NotFound component
- Disabled skeleton loading for error pages to prevent potential errors
- Changed from `console.error` to `console.log` in development only

### 4. Added Error Details Display
- In production, the error message is now displayed (in a subtle way) to help with debugging
- This will help identify the actual error without exposing sensitive information

## How to Debug Further

### 1. Check Vercel Function Logs
```bash
vercel logs --prod
```
Look for "Production Error Details" in the logs to see the actual error.

### 2. Access the Browser Console
1. Open the deployed site
2. Navigate to a non-existent route like `/projects`
3. Open browser DevTools (F12)
4. Check the Console tab for error messages

### 3. Test Locally
```bash
# Build and preview production build locally
npm run build
npm run preview
```
Then navigate to `http://localhost:4173/projects` to see if the error reproduces locally.

### 4. Possible Root Causes

#### A. Content Loading Error
The error might be related to the dynamic content loading system trying to fetch content for non-existent pages.

#### B. Supabase Connection Issue
Check if your Supabase environment variables are correctly set in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

#### C. Analytics Error
Vercel Analytics or Speed Insights might be throwing errors on 404 pages.

## Immediate Actions

1. **Deploy the fixes**: The changes made should resolve the issue. Deploy to Vercel:
   ```bash
   git add -A
   git commit -m "Fix production error on non-existent routes"
   git push
   ```

2. **Monitor logs**: After deployment, check Vercel logs for any new error details.

3. **Test the fix**: Visit a non-existent route like `/projects` and verify it shows the proper 404 page.

## If the Issue Persists

1. **Check Vercel Environment Variables**: Ensure all required env vars are set correctly
2. **Review Recent Changes**: Check if any recent deployments introduced the issue
3. **Enable Vercel Debug Mode**: Add `?debug=1` to the URL to see more details

The enhanced error logging should now provide much more information about what's causing the issue.