# Safety Guidelines Feature

## Overview

This feature implements a mandatory safety guidelines acceptance flow before users can sign up for volunteer events. Users must review and accept 5 safety guidelines through a modal popup before their event registration is processed.

## Implementation Details

### Components Created

1. **SafetyGuidelinesModal** (`src/components/modals/SafetyGuidelinesModal.tsx`)
   - Modern modal with safety icon and clean UI
   - Displays 5 editable safety guidelines from the content database
   - Checkbox for acceptance confirmation
   - Accept/Cancel buttons with proper state management
   - Fallback content for when database content isn't loaded

### Components Modified

1. **OpportunitiesSection** (`src/components/sections/OpportunitiesSection.tsx`)
   - Added safety modal state management
   - Modified `handleSignUp` to show safety modal first
   - Added `handleSafetyAccept` to process signup after acceptance
   - Only processes event signup after guidelines are accepted

2. **GroupSignupModal** (`src/components/modals/GroupSignupModal.tsx`)
   - Added safety modal integration for group signups
   - Shows safety guidelines before processing multiple user signups
   - Maintains consistency with individual signup flow

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

1. User clicks "Sign Up" on an event
2. If not authenticated, auth modal appears first
3. If authenticated, safety guidelines modal appears
4. User must:
   - Read the 5 safety guidelines
   - Check the acceptance checkbox
   - Click "I Accept and Understand"
5. Only then is the user registered for the event
6. If user cancels, no registration occurs

## Admin Management

Administrators can edit the safety guidelines through the admin console:
1. Navigate to Admin Dashboard > Content Management
2. Filter by page "events" and section "safety"
3. Edit any guideline text
4. Changes appear immediately (with cache refresh)

## Features

- ✅ Modal appears once per signup attempt (not site-wide)
- ✅ Guidelines loaded from content table (not hardcoded)
- ✅ Fallback UI if content hasn't been initialized
- ✅ Users can cancel without signing up
- ✅ Works for both individual and group signups
- ✅ Only authenticated users can access this flow
- ✅ Clean, modern UI matching app design patterns

## Technical Notes

- Uses existing `useContentSection` hook for content loading
- Integrates with existing modal patterns and UI components
- Maintains state consistency across modal transitions
- Properly resets state when modals are closed/reopened