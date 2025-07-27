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
  // If not forcing refresh and cache is still valid, return existing promise or resolve immediately
  if (!forceRefresh && !isCacheStale() && isContentLoaded) {
    return Promise.resolve();
  }

  // If already loading and not forcing refresh, return existing promise
  if (contentLoadingPromise && !forceRefresh) {
    return contentLoadingPromise;
  }

  contentLoadingPromise = (async () => {
    try {
      console.log('Loading fresh content from Supabase...');
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('language_code', languageCode);

      if (error) {
        console.error('Error loading content:', error);
        return;
      }

      // Clear existing cache if forcing refresh
      if (forceRefresh) {
        Object.keys(contentCache).forEach(key => delete contentCache[key]);
      }

      // Populate cache
      data?.forEach((item: ContentItem) => {
        const cacheKey = `${item.page}.${item.section}.${item.key}`;
        contentCache[cacheKey] = item.value;
      });

      isContentLoaded = true;
      lastLoadTime = Date.now();
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Content loaded: ${data?.length || 0} items in ${loadTime}ms`);
      
      // Debug: Log hero content specifically
      const heroContent = Object.entries(contentCache)
        .filter(([key]) => key.startsWith('home.hero.'))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      
      if (Object.keys(heroContent).length > 0) {
        console.log('🏠 Hero content loaded:', heroContent);
      }
    } catch (error) {
      console.error('Error loading content:', error);
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
  const [content, setContent] = useState<string>(() => 
    getContent(page, section, key, fallback)
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
      
      setContent(getContent(page, section, key, fallback));
    };

    initializeContent();

    // Subscribe to global content changes
    const unsubscribe = subscribeToContentChanges(() => {
      setContent(getContent(page, section, key, fallback));
    });

    return unsubscribe;
  }, [page, section, key, fallback]);

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
      const { error } = await supabase
        .from('content')
        .insert({
          page,
          section,
          key,
          value,
          language_code: languageCode
        });

      if (error) throw error;
      return { success: true };
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
      const { error } = await supabase
        .from('content')
        .update({ value })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
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
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
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
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('language_code', languageCode)
        .order('page')
        .order('section')
        .order('key');

      if (error) throw error;
      return { success: true, data };
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