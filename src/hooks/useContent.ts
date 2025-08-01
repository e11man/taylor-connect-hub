import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContentItem {
  id: string;
  page: string;
  section: string;
  key: string;
  value: string;
  language_code: string;
  created_at: string;
  updated_at: string;
}

interface ContentCache {
  [key: string]: string;
}

// Global content cache with fallbacks
const contentCache: ContentCache = {};
const fallbackContent: ContentCache = {
  'home.hero.title': 'Connect. Volunteer. Make a Difference.',
  'home.hero.subtitle': 'Join our vibrant community of passionate volunteers.',
  'header.nav.home': 'Home',
  'header.nav.about': 'About',
  'footer.brand.name': 'Community Connect',
  'admin.login.title': 'Admin Console',
};

// Content loading state
let isContentLoaded = false;
let contentLoadingPromise: Promise<void> | null = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Global real-time subscription
let globalSubscription: any = null;
const subscribedComponents = new Set<() => void>();

// Check if cache is stale
const isCacheStale = (): boolean => {
  return Date.now() - lastLoadTime > CACHE_DURATION;
};

// Load all content into cache
const loadContent = async (languageCode: string = 'en', forceRefresh: boolean = false): Promise<void> => {
  console.log('useContent: loadContent called', { languageCode, forceRefresh, isCacheStale: isCacheStale(), isContentLoaded });
  
  // If not forcing refresh and cache is still valid, return existing promise or resolve immediately
  if (!forceRefresh && !isCacheStale() && isContentLoaded) {
    console.log('useContent: Using cached content, returning immediately');
    return Promise.resolve();
  }

  // If already loading and not forcing refresh, return existing promise
  if (contentLoadingPromise && !forceRefresh) {
    console.log('useContent: Content already loading, returning existing promise');
    return contentLoadingPromise;
  }

  contentLoadingPromise = (async () => {
    try {
      console.log('useContent: Loading fresh content from Supabase...');
      const startTime = Date.now();
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Content loading timeout')), 10000); // 10 second timeout
      });
      
      console.log('useContent: About to query Supabase content table');
      console.log('useContent: Supabase client:', supabase);
      
      const contentPromise = supabase
        .from('content')
        .select('*')
        .eq('language_code', languageCode);

      const { data, error } = await Promise.race([contentPromise, timeoutPromise]) as any;

      console.log('useContent: Supabase query completed', { dataLength: data?.length, error });

      if (error) {
        console.error('useContent: Error loading content:', error);
        // Don't return here, continue with fallback content
      }

      // Clear existing cache if forcing refresh
      if (forceRefresh) {
        console.log('useContent: Clearing existing cache for force refresh');
        Object.keys(contentCache).forEach(key => delete contentCache[key]);
      }

      // Populate cache with data or fallback content
      if (data && data.length > 0) {
        console.log('useContent: Populating cache with data from Supabase');
        data.forEach((item: ContentItem) => {
          const cacheKey = `${item.page}.${item.section}.${item.key}`;
          contentCache[cacheKey] = item.value;
        });
      } else {
        console.log('useContent: No data from Supabase, using fallback content');
        // Populate with fallback content
        Object.entries(fallbackContent).forEach(([key, value]) => {
          contentCache[key] = value;
        });
      }

      isContentLoaded = true;
      lastLoadTime = Date.now();
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ useContent: Content loaded: ${data?.length || 0} items in ${loadTime}ms`);
      
      // Debug: Log hero content specifically
      const heroContent = Object.entries(contentCache)
        .filter(([key]) => key.startsWith('homepage.hero.'))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      
      if (Object.keys(heroContent).length > 0) {
        console.log('🏠 useContent: Hero content loaded:', heroContent);
      } else {
        console.log('⚠️ useContent: No hero content found in cache');
      }
    } catch (error) {
      console.error('useContent: Error loading content:', error);
      // Use fallback content on error
      console.log('useContent: Using fallback content due to error');
      Object.entries(fallbackContent).forEach(([key, value]) => {
        contentCache[key] = value;
      });
      isContentLoaded = true;
      lastLoadTime = Date.now();
    }
  })();

  return contentLoadingPromise;
};

// Get content with fallback
const getContent = (page: string, section: string, key: string, fallback?: string): string => {
  const cacheKey = `${page}.${section}.${key}`;
  
  // Return cached content if available
  if (contentCache[cacheKey]) {
    return contentCache[cacheKey];
  }
  
  // Log only when content is not found in cache
  console.warn(`Content not found in cache: ${cacheKey}, using fallback`);
  
  // Return fallback content if available
  if (fallbackContent[cacheKey]) {
    return fallbackContent[cacheKey];
  }
  
  // Return provided fallback or generic fallback
  return fallback || key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Global real-time subscription manager
const setupGlobalSubscription = () => {
  if (globalSubscription) return;

  console.log('Setting up real-time content subscription...');
  
  globalSubscription = supabase
    .channel('global-content-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'content'
      },
      (payload) => {
        console.log('Content change detected:', payload);
        
        if (payload.eventType === 'DELETE') {
          const oldRecord = payload.old as ContentItem;
          if (oldRecord) {
            const cacheKey = `${oldRecord.page}.${oldRecord.section}.${oldRecord.key}`;
            delete contentCache[cacheKey];
          }
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = payload.new as ContentItem;
          if (record) {
            const cacheKey = `${record.page}.${record.section}.${record.key}`;
            contentCache[cacheKey] = record.value;
            
            // Update last load time to prevent unnecessary refreshes
            lastLoadTime = Date.now();
          }
        }
        
        // Notify all subscribed components immediately
        subscribedComponents.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Error in content change callback:', error);
          }
        });
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to content changes');
      }
    });
};

const subscribeToContentChanges = (callback: () => void) => {
  subscribedComponents.add(callback);
  setupGlobalSubscription();
  
  return () => {
    subscribedComponents.delete(callback);
    
    // Clean up global subscription if no components are subscribed
    if (subscribedComponents.size === 0 && globalSubscription) {
      supabase.removeChannel(globalSubscription);
      globalSubscription = null;
    }
  };
};

// Hook for getting content
export const useContent = (page: string, section: string, key: string, fallback?: string) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeContent = async () => {
      try {
        // Always check for fresh content on component mount
        const shouldRefresh = !isContentLoaded || isCacheStale();
        
        if (shouldRefresh && !hasInitialized) {
          setLoading(true);
          await loadContent('en', shouldRefresh);
          setHasInitialized(true);
        }
        
        // Get content after ensuring it's loaded
        const fetchedContent = getContent(page, section, key, fallback);
        if (isMounted) {
          setContent(fetchedContent);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in useContent:', error);
        if (isMounted) {
          setContent(fallback || '');
          setLoading(false);
        }
      }
    };

    initializeContent();

    // Subscribe to global content changes
    const unsubscribe = subscribeToContentChanges(() => {
      if (isMounted) {
        const updatedContent = getContent(page, section, key, fallback);
        setContent(updatedContent);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [page, section, key, fallback, hasInitialized]);

  return { content, loading };
};

// Helper function to get section content
const getSectionContent = (page: string, section: string): Record<string, string> => {
  const sectionContent: Record<string, string> = {};
  Object.entries(contentCache).forEach(([cacheKey, value]) => {
    if (cacheKey.startsWith(`${page}.${section}.`)) {
      const key = cacheKey.split('.').slice(2).join('.');
      sectionContent[key] = value;
    }
  });
  return sectionContent;
};

// Hook for getting multiple content items
export const useContentSection = (page: string, section: string) => {
  const [content, setContent] = useState<Record<string, string>>(() => 
    getSectionContent(page, section)
  );
  const [loading, setLoading] = useState(!isContentLoaded);

  useEffect(() => {
    const initializeContent = async () => {
      // Always check for fresh content on component mount
      const shouldRefresh = !isContentLoaded || isCacheStale();
      
      if (shouldRefresh) {
        setLoading(true);
        await loadContent('en', shouldRefresh);
        setLoading(false);
      }
      
      setContent(getSectionContent(page, section));
    };

    initializeContent();

    // Subscribe to global content changes
    const unsubscribe = subscribeToContentChanges(() => {
      setContent(getSectionContent(page, section));
    });

    return unsubscribe;
  }, [page, section]);

  return { content, loading };
};

// Admin hook for managing content
export const useContentAdmin = () => {
  const [loading, setLoading] = useState(false);

  const createContent = useCallback(async (
    page: string,
    section: string,
    key: string,
    value: string,
    languageCode: string = 'en'
  ) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page,
          section,
          key,
          value,
          language_code: languageCode
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating content:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContent = useCallback(async (
    id: string,
    value: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          value
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating content:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContent = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/content?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting content:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllContent = useCallback(async (languageCode: string = 'en') => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/content');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Filter by language code if needed
        const filteredData = languageCode === 'en' 
          ? result.data 
          : result.data.filter((item: any) => item.language_code === languageCode);
        
        return { success: true, data: filteredData };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching content:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createContent,
    updateContent,
    deleteContent,
    getAllContent
  };
};

// Force reload content cache
export const reloadContent = async (languageCode: string = 'en'): Promise<void> => {
  // Reset loading state
  isContentLoaded = false;
  contentLoadingPromise = null;
  lastLoadTime = 0;
  
  // Clear cache
  Object.keys(contentCache).forEach(key => delete contentCache[key]);
  
  // Reload content
  await loadContent(languageCode, true);
  
  // Notify all subscribed components
  subscribedComponents.forEach(callback => callback());
};

// Preload content on app start
export const preloadContent = () => {
  // Always load fresh content on app start
  if (!contentLoadingPromise) {
    loadContent('en', true);
  }
  
  // Add window focus listener to refresh content when tab becomes active
  const handleFocus = () => {
    if (isCacheStale()) {
      loadContent('en', true);
    }
  };
  
  window.addEventListener('focus', handleFocus);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('focus', handleFocus);
  };
};

// Export function to manually refresh content
export const refreshContent = async (): Promise<void> => {
  await loadContent('en', true);
  subscribedComponents.forEach(callback => callback());
};