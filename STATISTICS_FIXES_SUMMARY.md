# Statistics Feature - Input and Save Fixes

## Issues Fixed

### 1. Input Focus Loss on Mobile
**Problem**: Keyboard dismissed after typing one digit on mobile devices.

**Solution**:
- Changed input type from `type="number"` to `type="text"` with `inputMode="numeric"`
- Added `pattern="[0-9]*"` for numeric keyboard on mobile
- Added `autoComplete="off"` to prevent auto-suggestions
- Used controlled input with custom `handleInputChange` that filters non-digits
- Added `setTimeout` to ensure proper focus after render

### 2. Failed Update Error
**Problem**: Save button showed "Failed to update statistics" error.

**Solution**:
- Removed API endpoint dependency and use direct Supabase client
- Added proper `.eq('stat_type', statType)` filter for updates
- Added detailed console logging for debugging
- Improved error messages to show actual Supabase errors
- Added `.select()` to return updated data after save

## Implementation Details

### Input Improvements
```tsx
<Input
  ref={inputRef}
  type="text"                    // Changed from "number"
  inputMode="numeric"            // Shows numeric keyboard on mobile
  pattern="[0-9]*"              // iOS numeric keyboard support
  value={editingState.value}
  onChange={handleInputChange}   // Custom handler to filter non-digits
  onKeyDown={handleKeyDown}
  className="h-9 w-32"
  disabled={isSaving}
  placeholder="0"
  autoComplete="off"            // Prevent autocomplete
/>
```

### Custom Input Handler
```tsx
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Only allow digits
  const value = e.target.value.replace(/[^\d]/g, '');
  setEditingState(prev => ({ ...prev, value }));
};
```

### Direct Supabase Update
```tsx
const { data, error } = await supabase
  .from('site_stats')
  .update({ 
    [updateField]: value,
    updated_at: new Date().toISOString()
  })
  .eq('stat_type', editingState.statType)  // Critical: filter by stat_type
  .select();                                // Return updated data
```

### Additional UX Improvements

1. **Click Outside to Cancel**
   - Added `editingContainerRef` to detect clicks outside
   - Automatically cancels editing when clicking elsewhere

2. **Better Focus Management**
   - Uses `setTimeout` to ensure input is rendered before focusing
   - Selects all text when editing starts

3. **Keyboard Shortcuts**
   - Enter to save
   - Escape to cancel
   - Added `preventDefault()` to avoid form submission

4. **Loading States**
   - Shows spinner in save button while updating
   - Disables input and buttons during save

## Database Schema
The `site_stats` table structure:
```sql
CREATE TABLE public.site_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_type TEXT NOT NULL UNIQUE,        -- 'active_volunteers', 'hours_contributed', 'partner_organizations'
  confirmed_total INTEGER NOT NULL DEFAULT 0,
  current_estimate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## Testing the Fix

1. Navigate to Admin Dashboard → Statistics tab
2. Click Edit button next to any value
3. Type multiple digits - keyboard should stay open
4. Click Save or press Enter - should update successfully
5. Check console for any errors
6. Verify values update on home page

## Troubleshooting

If updates still fail:
1. Check browser console for Supabase errors
2. Verify user has admin role in profiles table
3. Run migration: `npx supabase db push`
4. Run populate script: `node scripts/populate-site-stats.js`