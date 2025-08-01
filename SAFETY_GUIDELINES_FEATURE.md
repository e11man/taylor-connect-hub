# Safety Guidelines Feature

## Overview

This feature implements a mandatory safety guidelines acceptance flow for both users and organizations:
- Users must review and accept 5 safety guidelines before signing up for volunteer events
- Organizations must review and accept the same guidelines before creating new volunteer opportunities

## Implementation Details

### Components Created

1. **SafetyGuidelinesModal** (`src/components/modals/SafetyGuidelinesModal.tsx`)
   - Modern modal with safety icon and clean UI
   - Displays 5 editable safety guidelines from the content database
   - Checkbox for acceptance confirmation
   - Accept/Cancel buttons with proper state management
   - Fallback content for when database content isn't loaded
   - Fully responsive with mobile-optimized styles

### Performance Optimizations

The SafetyGuidelinesModal has been optimized for better performance and user experience:

1. **Memoization**
   - `useMemo` for guidelines array to prevent unnecessary re-renders
   - `useMemo` for content values with fallbacks
   - `useMemo` for loading state calculation
   - `useCallback` for event handlers to maintain stable references

2. **Better UX**
   - Added backdrop blur for better focus
   - Gradient header with Shield icon for visual appeal
   - Hover effects on guidelines for better interactivity
   - Animated checkmark icon when accepting
   - Fixed footer with actions always visible
   - Scrollable content area with proper max-height
   - Prevents body scroll when modal is open

3. **Visual Enhancements**
   - Gradient backgrounds and buttons
   - Smooth transitions and animations
   - Better spacing and typography
   - Numbered badges with gradient styling
   - Hover scale effects for better feedback

4. **Fallback Content**
   - Centralized `FALLBACK_CONTENT` constant
   - Immediate display of content (no blank state)
   - Graceful handling of missing database content

### Components Modified

1. **OpportunitiesSection** (`src/components/sections/OpportunitiesSection.tsx`)
   - Modified `handleSignUp` to show safety modal first
   - Added `handleSafetyAccept` to process signup after acceptance
   - Only processes event signup after guidelines are accepted

2. **GroupSignupModal** (`src/components/modals/GroupSignupModal.tsx`)
   - Added safety modal integration for group signups
   - Shows safety guidelines before processing multiple user signups
   - Maintains consistency with individual signup flow

3. **OrganizationDashboard** (`src/pages/OrganizationDashboard.tsx`)
   - Added safety modal integration for opportunity creation
   - Modified `handleCreateEvent` to show safety modal before creating
   - Added `handleSafetyGuidelinesAccept` to process creation after acceptance
   - Prevents opportunity creation without guideline acceptance

### Content Structure

The safety guidelines are stored in the `content` table with the following structure:
- Page: `events`
- Section: `safety`
- Keys:
  - `guidelines_title`: Modal title
  - `guidelines_subtitle`: Subtitle text
  - `guideline_1` through `guideline_5`: Individual safety rules
  - `accept_button`: Accept button text
  - `cancel_button`: Cancel button text

### Database Seeding

To seed the safety guidelines content, run:
```sql
-- Execute the SQL file
psql $DATABASE_URL < supabase/seed-safety-guidelines.sql
```

Or manually through the admin console by adding content with:
- Page: `events`
- Section: `safety`
- Keys and values as listed above

## User Flow

### For Users (Event Signup)
1. User clicks "Sign Up" on an event
2. If not authenticated, auth modal appears first
3. If authenticated, safety guidelines modal appears
4. User must:
   - Read the 5 safety guidelines
   - Check the acceptance checkbox
   - Click "I Accept and Understand"
5. Only then is the user registered for the event
6. If user cancels, no registration occurs

### For Organizations (Opportunity Creation)
1. Organization clicks "Create New Opportunity"
2. Organization fills out opportunity details
3. Upon clicking "Create Opportunity", safety guidelines modal appears
4. Organization must:
   - Read the 5 safety guidelines
   - Check the acceptance checkbox
   - Click "I Accept and Understand"
5. Only then is the opportunity created
6. If organization cancels, opportunity creation is aborted

## Admin Management

Administrators can edit the safety guidelines through the admin console:
1. Navigate to Admin Dashboard > Content Management
2. Filter by page "events" and section "safety"
3. Edit any guideline text
4. Changes appear immediately (with cache refresh) for both users and organizations

## Features

- ✅ Modal appears once per signup/creation attempt
- ✅ Guidelines loaded from content table (not hardcoded)
- ✅ Reuses same content for both users and organizations
- ✅ Responsive design for mobile devices
- ✅ Prevents action without acceptance
- ✅ Graceful error handling and fallback content

## Technical Notes

- The same `SafetyGuidelinesModal` component is reused for both users and organizations
- Content is fetched using the `useContentSection` hook from the central content management system
- The modal state is managed locally in each parent component
- Guidelines are fetched from `events.safety.*` content keys
- Mobile responsive styles are built into the modal component