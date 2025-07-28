# Complete Content Migration Guide

## Current Status

### ✅ Completed Pages (Using Dynamic Content):
1. **Header** - All navigation, brand, and button text
2. **Footer** - All links, brand, copyright text
3. **HeroSection** - All titles, subtitles, and buttons
4. **OrganizationRegister** - All form fields and text
5. **AdminLogin** - All labels, placeholders, and messages
6. **NotFound** - All error text and links

### 🚧 Remaining Pages to Migrate:

#### High Priority:
1. **OrganizationLogin** - Login form, messages
2. **OrganizationDashboard** - Dashboard text, stats, labels
3. **AdminDashboard** - All dashboard content
4. **UserDashboard** - Welcome messages, stats
5. **About** page and all its sections

#### Components:
1. **SearchSection** - Search placeholders, filters
2. **OpportunitiesSection** - Card text, buttons
3. **TestimonialsSection** - Section titles
4. **ContactSection** - Contact form labels
5. **CallToActionSection** - CTA text

#### Modals:
1. **UserAuthModal** - Login/signup text
2. **RequestVolunteersModal** - Form labels
3. **ForgotPasswordModal** - Reset password text
4. **ChangeDormModal** - Dorm selection text

## Migration Pattern

For each component/page:

1. **Import Dynamic Content Tools:**
```typescript
import { DynamicText } from "@/components/content/DynamicText";
import { useContentSection } from "@/hooks/useContent";
```

2. **Load Content Sections:**
```typescript
const { content: sectionContent } = useContentSection('pageName', 'sectionName');
```

3. **Replace Hardcoded Text:**
```typescript
// Before:
<h1>Welcome to Dashboard</h1>

// After:
<h1>
  <DynamicText 
    page="dashboard" 
    section="main" 
    contentKey="title"
    fallback="Welcome to Dashboard"
    as="span"
  />
</h1>
```

4. **Handle Dynamic Values:**
For placeholders and attributes that need dynamic content:
```typescript
const { content: placeholder } = useContent('page', 'section', 'key', 'fallback');
<input placeholder={placeholder} />
```

## SQL Content Structure

All content follows this pattern:
```sql
INSERT INTO content (page, section, key, value, language_code) VALUES
('pageName', 'sectionName', 'contentKey', 'Display Text', 'en');
```

## Best Practices

1. **Always provide fallback values** - This ensures the app works even if content isn't loaded
2. **Use semantic keys** - Make keys descriptive: `submitButton`, `emailLabel`, `errorInvalidCredentials`
3. **Group by sections** - Organize content logically: `form`, `errors`, `success`, `navigation`
4. **Keep translations in mind** - Structure supports multiple languages via `language_code`

## Testing

1. Run the SQL script to populate all content
2. Clear browser cache
3. Check console for content loading logs
4. Verify all text appears correctly
5. Test real-time updates by changing content in Supabase

## Benefits

- ✅ All text is editable without code changes
- ✅ Supports multiple languages
- ✅ Real-time updates via Supabase subscriptions
- ✅ No hardcoded strings in the codebase
- ✅ Content changes don't require deployments