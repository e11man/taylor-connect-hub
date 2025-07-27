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

// Global real-time subscription
let globalSubscription: any = null;
const subscribedComponents = new Set<() => void>();

// Load all content into cache
const loadContent = async (languageCode: string = 'en'): Promise<void> => {
  if (contentLoadingPromise) {
    return contentLoadingPromise;
  }

  contentLoadingPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('language_code', languageCode);

      if (error) {
        console.error('Error loading content:', error);
        return;
      }

      // Populate cache
      data?.forEach((item: ContentItem) => {
        const cacheKey = `${item.page}.${item.section}.${item.key}`;
        contentCache[cacheKey] = item.value;
      });

      isContentLoaded = true;
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
          const cacheKey = `${oldRecord.page}.${oldRecord.section}.${oldRecord.key}`;
          delete contentCache[cacheKey];
        } else {
          const record = payload.new as ContentItem;
          const cacheKey = `${record.page}.${record.section}.${record.key}`;
          contentCache[cacheKey] = record.value;
        }
        
        // Notify all subscribed components
        subscribedComponents.forEach(callback => callback());
      }
    )
    .subscribe();
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
      if (!isContentLoaded) {
        setLoading(true);
        await loadContent();
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
      if (!isContentLoaded) {
        setLoading(true);
        await loadContent();
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
  
  // Clear cache
  Object.keys(contentCache).forEach(key => delete contentCache[key]);
  
  // Reload content
  await loadContent(languageCode);
  
  // Notify all subscribed components
  subscribedComponents.forEach(callback => callback());
};

// Preload content on app start
export const preloadContent = () => {
  if (!isContentLoaded && !contentLoadingPromise) {
    loadContent();
  }
};