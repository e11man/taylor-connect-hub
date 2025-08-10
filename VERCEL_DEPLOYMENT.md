# Vercel Deployment Guide

## Overview
This project is now properly configured for Vercel deployment with the following setup:

## Configuration Files

### vercel.json
- **buildCommand**: `npm run build` - Uses Vite to build the project
- **outputDirectory**: `dist` - Serves the built files from the dist directory
- **framework**: `vite` - Optimized for Vite projects
- **API Functions**: Configured to handle both Node.js (.js) and Python (.py) API routes
- **Security Headers**: Added X-Frame-Options, X-Content-Type-Options, and X-XSS-Protection

### .vercelignore
- Excludes development files, logs, and unnecessary build artifacts
- Keeps essential files for deployment while reducing bundle size
- Properly configured for both frontend and backend files

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the project**:
   ```bash
   vercel
   ```
   - Follow the prompts to link your project
   - Vercel will automatically detect the configuration

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

## Environment Variables
Make sure to set up your environment variables in the Vercel dashboard:
- Supabase credentials
- API keys
- Any other sensitive configuration

## API Routes
The project includes both JavaScript and Python API routes in the `/api` directory:
- Node.js functions will use the `nodejs18.x` runtime
- Python functions will use the `python3.9` runtime

## Build Optimization
The build process creates optimized chunks:
- Vendor libraries (React, React DOM)
- Router components
- UI components
- Main application code

Note: Some chunks are larger than 500KB. Consider implementing code splitting for better performance if needed.

## Troubleshooting
- Ensure all dependencies are listed in package.json
- Check that API routes follow Vercel's serverless function format
- Verify environment variables are properly set in Vercel dashboard