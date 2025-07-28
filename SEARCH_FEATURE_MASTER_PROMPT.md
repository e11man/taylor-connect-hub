# Master Prompt: Search Feature Implementation and Mobile Responsiveness

## Current State Analysis

The search functionality in your Taylor Connect Hub application currently has the following structure:

### Files Involved:
- **`src/components/sections/SearchSection.tsx`** - Main search interface with filters
- **`src/components/sections/OpportunitiesSection.tsx`** - Displays opportunities (currently not connected to search)
- **`src/pages/Index.tsx`** - Layout structure
- **`src/hooks/use-mobile.tsx`** - Mobile detection hook
- **`tailwind.config.ts`** - Responsive breakpoints configuration

### Current Issues Identified:

1. **Search-Results Disconnect**: The `SearchSection` and `OpportunitiesSection` are not connected - search queries don't filter the displayed opportunities
2. **Missing State Management**: No shared state between search and results
3. **Mobile Responsiveness Gaps**: Some components need better mobile optimization
4. **Performance Issues**: No debouncing for search inputs
5. **Accessibility Concerns**: Missing ARIA labels and keyboard navigation

## Required Fixes and Implementation

### 1. **State Management Integration** 
**File: `src/contexts/SearchContext.tsx`** (NEW)
```typescript
// Create a new context to manage search state across components
interface SearchState {
  query: string;
  activeCategory: string;
  filteredEvents: Event[];
  isLoading: boolean;
}

// Implement debounced search with proper state management
// Add mobile-responsive state handling
```

### 2. **Search-Results Connection**
**Files to Modify:**
- **`src/components/sections/SearchSection.tsx`** - Add context integration
- **`src/components/sections/OpportunitiesSection.tsx`** - Connect to search state
- **`src/pages/Index.tsx`** - Wrap with SearchProvider

### 3. **Mobile Responsiveness Enhancements**

**File: `src/components/sections/SearchSection.tsx`**
```typescript
// Current mobile issues to fix:
// - Search input too small on mobile
// - Category filters overflow on small screens
// - Touch targets too small
// - Horizontal scroll not smooth

// Required changes:
// - Increase input padding: py-4 sm:py-5
// - Larger touch targets: min-h-[48px] for mobile
// - Better horizontal scroll: snap-x snap-mandatory
// - Responsive font sizes: text-sm sm:text-base md:text-lg
```

**File: `src/components/sections/OpportunitiesSection.tsx`**
```typescript
// Current mobile issues to fix:
// - Cards too wide on mobile (85vw is too narrow)
// - Text overflow in cards
// - Button touch targets too small
// - Loading states not mobile-optimized

// Required changes:
// - Responsive card widths: w-[90vw] sm:w-72 md:w-80
// - Better text truncation: line-clamp-2 for titles
// - Larger touch targets: min-h-[44px] for buttons
// - Mobile-optimized loading skeleton
```

### 4. **Performance Optimizations**

**File: `src/hooks/useSearch.ts`** (NEW)
```typescript
// Implement debounced search hook
// Add search result caching
// Implement virtual scrolling for large result sets
// Add search analytics tracking
```

### 5. **Accessibility Improvements**

**Files to Update:**
- **`src/components/sections/SearchSection.tsx`**
- **`src/components/sections/OpportunitiesSection.tsx`**

```typescript
// Add proper ARIA labels
// Implement keyboard navigation
// Add screen reader support
// Ensure color contrast compliance
// Add focus management
```

### 6. **Database Query Optimization**

**File: `src/integrations/supabase/client.ts`**
```typescript
// Add full-text search capabilities
// Implement category-based filtering
// Add search result ranking
// Optimize queries for mobile performance
```

## Implementation Steps

### Phase 1: Core Integration
1. **Create SearchContext** (`src/contexts/SearchContext.tsx`)
2. **Update SearchSection** with context integration
3. **Update OpportunitiesSection** to use filtered results
4. **Test basic search functionality**

### Phase 2: Mobile Optimization
1. **Enhance responsive design** in both components
2. **Implement touch-friendly interactions**
3. **Add mobile-specific loading states**
4. **Test on various mobile devices**

### Phase 3: Performance & Accessibility
1. **Add debounced search**
2. **Implement keyboard navigation**
3. **Add ARIA labels and screen reader support**
4. **Optimize database queries**

### Phase 4: Advanced Features
1. **Add search analytics**
2. **Implement search suggestions**
3. **Add search history**
4. **Implement advanced filters**

## Mobile-Specific Requirements

### Touch Targets
- Minimum 44px height for all interactive elements
- Adequate spacing between touch targets (8px minimum)
- Visual feedback for touch interactions

### Responsive Breakpoints
- **Mobile**: < 768px (current breakpoint)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Performance Considerations
- Lazy load search results
- Implement virtual scrolling for large lists
- Optimize images for mobile networks
- Minimize bundle size for mobile

## Testing Requirements

### Mobile Testing
- Test on iOS Safari, Chrome Mobile, Firefox Mobile
- Test various screen sizes (320px - 768px)
- Test touch interactions and gestures
- Test with slow network conditions

### Accessibility Testing
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast verification
- Focus management testing

## File Structure After Implementation

```
src/
├── contexts/
│   └── SearchContext.tsx (NEW)
├── hooks/
│   ├── useSearch.ts (NEW)
│   └── use-mobile.tsx (ENHANCED)
├── components/
│   └── sections/
│       ├── SearchSection.tsx (UPDATED)
│       └── OpportunitiesSection.tsx (UPDATED)
├── utils/
│   └── searchHelpers.ts (NEW)
└── pages/
    └── Index.tsx (UPDATED)
```

## Success Criteria

1. **Search Functionality**: Users can search and filter opportunities in real-time
2. **Mobile Responsiveness**: Perfect experience on all mobile devices
3. **Performance**: Search results load within 200ms
4. **Accessibility**: WCAG 2.1 AA compliance
5. **User Experience**: Intuitive and smooth interactions

## Detailed Implementation Guide

### Step 1: Create Search Context

**File: `src/contexts/SearchContext.tsx`**
```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchState {
  query: string;
  activeCategory: string;
  filteredEvents: Event[];
  isLoading: boolean;
  error: string | null;
}

interface SearchContextType extends SearchState {
  setQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SearchState>({
    query: '',
    activeCategory: 'all',
    filteredEvents: [],
    isLoading: false,
    error: null,
  });

  const debouncedQuery = useDebounce(state.query, 300);

  const searchEvents = useCallback(async () => {
    if (!debouncedQuery && state.activeCategory === 'all') {
      // Show all events when no search criteria
      setState(prev => ({ ...prev, filteredEvents: [], isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let query = supabase.from('events').select('*');

      // Apply category filter
      if (state.activeCategory !== 'all') {
        query = query.eq('category', state.activeCategory);
      }

      // Apply search query
      if (debouncedQuery) {
        query = query.or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        filteredEvents: data || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to search events',
        isLoading: false,
      }));
    }
  }, [debouncedQuery, state.activeCategory]);

  useEffect(() => {
    searchEvents();
  }, [searchEvents]);

  const setQuery = (query: string) => {
    setState(prev => ({ ...prev, query }));
  };

  const setActiveCategory = (category: string) => {
    setState(prev => ({ ...prev, activeCategory: category }));
  };

  const clearSearch = () => {
    setState(prev => ({
      ...prev,
      query: '',
      activeCategory: 'all',
      filteredEvents: [],
    }));
  };

  return (
    <SearchContext.Provider
      value={{
        ...state,
        setQuery,
        setActiveCategory,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
```

### Step 2: Create Debounce Hook

**File: `src/hooks/useDebounce.ts`**
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Step 3: Update SearchSection

**File: `src/components/sections/SearchSection.tsx`** (Updated)
```typescript
import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/ui/animated-section";
import AnimatedText from "@/components/ui/animated-text";
import { motion } from "framer-motion";
import { useSearch } from "@/contexts/SearchContext";
import { useIsMobile } from "@/hooks/use-mobile";

const SearchSection = () => {
  const { query, activeCategory, setQuery, setActiveCategory, clearSearch } = useSearch();
  const isMobile = useIsMobile();

  const categories = [
    { id: "all", name: "All" },
    { id: "community", name: "Community" },
    { id: "education", name: "Education" },
    { id: "environment", name: "Environment" },
    { id: "health", name: "Health" },
    { id: "fundraising", name: "Fundraising" },
    { id: "other", name: "Other" }
  ];

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <AnimatedSection variant="slideUp" delay={0.1}>
          <div className="text-center mb-8 sm:mb-12 px-4 sm:px-0">
            <AnimatedText variant="blur" delay={0.2}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold mb-4 sm:mb-6 text-primary">
                Find Your Perfect Volunteer Opportunity
              </h2>
            </AnimatedText>
            
            <AnimatedText variant="fade" delay={0.3}>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Search and filter opportunities based on your interests, skills, and availability.
              </p>
            </AnimatedText>
          </div>
        </AnimatedSection>

        {/* Search Bar */}
        <AnimatedSection variant="scale" delay={0.4}>
          <div className="max-w-2xl mx-auto mb-8 sm:mb-12 px-4 sm:px-0">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { duration: 0.4, delay: 0.5 }
                }}
                viewport={{ once: false }}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.5, delay: 0.6 }
                }}
                viewport={{ once: false }}
              >
                <Input
                  type="text"
                  placeholder="Search by title, description, or category..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-12 sm:pr-4 py-4 sm:py-5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-[#00AFCE] bg-white transition-all duration-300 hover:shadow-md focus:shadow-lg min-h-[48px] sm:min-h-[56px]"
                  aria-label="Search opportunities"
                />
                
                {/* Clear button for mobile */}
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 h-8 w-8 rounded-full hover:bg-gray-100"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Category Filters */}
        <AnimatedSection variant="slideUp" delay={0.7}>
          <div className="mb-8 sm:mb-12">
            <div className="text-center mb-6 sm:mb-8 px-4 sm:px-0">
              <AnimatedText variant="slideUp" delay={0.8}>
                <h3 className="text-xl sm:text-2xl font-montserrat font-semibold mb-3 sm:mb-4 text-primary">Filter Opportunities</h3>
              </AnimatedText>
              
              <AnimatedText variant="fade" delay={0.9}>
                <p className="text-muted-foreground text-sm sm:text-base">Click on a category to filter opportunities</p>
              </AnimatedText>
            </div>

            <div className="overflow-x-auto pb-4 scroll-smooth" style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}>
              <style>
                {`.overflow-x-auto::-webkit-scrollbar { display: none; }`}
              </style>
              <motion.div 
                className="flex gap-3 sm:gap-4 min-w-max px-4 snap-x snap-mandatory"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 1.0
                    }
                  }
                }}
              >
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-montserrat font-semibold transition-all duration-300 border-2 whitespace-nowrap text-sm sm:text-base min-h-[44px] sm:min-h-[48px] snap-start
                      ${activeCategory === category.id
                        ? 'bg-[#E14F3D] text-white border-[#E14F3D] shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#00AFCE] hover:text-[#00AFCE]'
                      }
                    `}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.9 },
                      visible: { 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: { duration: 0.3 }
                      }
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={activeCategory === category.id}
                    aria-label={`Filter by ${category.name} category`}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default SearchSection;
```

### Step 4: Update OpportunitiesSection

**File: `src/components/sections/OpportunitiesSection.tsx`** (Updated)
```typescript
import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, MessageCircle, Search } from "lucide-react";
import { formatEventDate, formatEventTime, formatParticipants } from "@/utils/formatEvent";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EventChatModal } from "@/components/chat/EventChatModal";
import GroupSignupModal from "@/components/modals/GroupSignupModal";
import { useSearch } from "@/contexts/SearchContext";
import { useIsMobile } from "@/hooks/use-mobile";

// ... existing interfaces ...

const OpportunitiesSection = () => {
  const { filteredEvents, isLoading, error } = useSearch();
  const isMobile = useIsMobile();
  
  // ... existing state and functions ...

  // Use filtered events from search context instead of all events
  const displayEvents = filteredEvents.length > 0 ? filteredEvents : events;

  if (isLoading) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-[#00AFCE] animate-pulse mr-2" />
              <p className="text-xl text-muted-foreground">Searching opportunities...</p>
            </div>
            {/* Mobile-optimized loading skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl h-80 sm:h-96"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <p className="text-xl text-red-600 mb-4">Error loading opportunities</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (displayEvents.length === 0) {
    return (
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-montserrat font-semibold mb-2 text-primary">
              No opportunities found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search terms or filters to find more opportunities.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        {/* Opportunities Horizontal Scroll */}
        <div className="mb-8 md:mb-12">
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-6 scroll-smooth snap-x snap-mandatory" style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <style>
              {`.overflow-x-auto::-webkit-scrollbar { display: none; }`}
            </style>
          {displayEvents.map((event, index) => (
            <div 
              key={event.id}
              className="group animate-scale-in flex-shrink-0 w-[90vw] sm:w-72 md:w-80 min-w-[90vw] sm:min-w-72 md:min-w-80 snap-start"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-[#00AFCE] hover:shadow-lg transition-all duration-300 h-full flex flex-col min-h-[350px] sm:min-h-[380px] md:min-h-[400px]">
                {/* Title and Description */}
                <h3 className="text-lg md:text-xl font-montserrat font-bold mb-3 text-primary group-hover:text-[#00AFCE] transition-all duration-300 line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 line-clamp-3 leading-relaxed">
                  {event.description}
                </p>

                {/* Key Details */}
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Date:</span>
                    <span className="text-muted-foreground truncate">
                      {formatEventDate(event.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Time:</span>
                    <span className="text-muted-foreground">
                      {formatEventTime(event.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Location:</span>
                    <span className="text-muted-foreground truncate">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-[#00AFCE] flex-shrink-0" />
                    <span className="font-medium text-primary">Participants:</span>
                    <span className="text-muted-foreground">
                      {formatParticipants(eventSignupCounts[event.id] || 0, event.max_participants)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto space-y-2 md:space-y-3">
                  {/* ... existing button logic ... */}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* ... existing modals ... */}
    </section>
  );
};

export default OpportunitiesSection;
```

### Step 5: Update Index.tsx

**File: `src/pages/Index.tsx`** (Updated)
```typescript
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CallToActionSection from "@/components/sections/CallToActionSection";
import SearchSection from "@/components/sections/SearchSection";
import OpportunitiesSection from "@/components/sections/OpportunitiesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import ContactSection from "@/components/sections/ContactSection";
import UserDashboard from "@/components/sections/UserDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { ContentDebugger } from "@/components/debug/ContentDebugger";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SearchProvider>
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <HeroSection />
          {user ? (
            <>
              <UserDashboard />
              <div id="search">
                <SearchSection />
              </div>
              <div id="opportunities">
                <OpportunitiesSection />
              </div>
            </>
          ) : (
            <>
              <CallToActionSection />
              <div id="search">
                <SearchSection />
              </div>
              <div id="opportunities">
                <OpportunitiesSection />
              </div>
              <TestimonialsSection />
              <ContactSection />
            </>
          )}
        </main>
        <Footer />
        
        {/* Temporary debug component - remove in production */}
        <ContentDebugger />
      </div>
    </SearchProvider>
  );
};

export default Index;
```

This master prompt provides a comprehensive roadmap for implementing a robust, mobile-responsive search feature that integrates seamlessly with your existing codebase while maintaining the high-quality user experience your application deserves. 