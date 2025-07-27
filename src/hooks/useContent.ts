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

    // Subscribe to real-time updates
    const channel = supabase
      .channel('content-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content'
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as ContentItem;
            const cacheKey = `${oldRecord.page}.${oldRecord.section}.${oldRecord.key}`;
            delete contentCache[cacheKey];
          } else {
            const record = payload.new as ContentItem;
            const cacheKey = `${record.page}.${record.section}.${record.key}`;
            contentCache[cacheKey] = record.value;
          }
          
          // Update content if it matches current hook
          setContent(getContent(page, section, key, fallback));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, section, key, fallback]);

  return { content, loading };
};

// Hook for getting multiple content items
export const useContentSection = (page: string, section: string) => {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!isContentLoaded);

  useEffect(() => {
    const initializeContent = async () => {
      if (!isContentLoaded) {
        setLoading(true);
        await loadContent();
        setLoading(false);
      }
      
      // Filter content for this page/section
      const sectionContent: Record<string, string> = {};
      Object.entries(contentCache).forEach(([cacheKey, value]) => {
        if (cacheKey.startsWith(`${page}.${section}.`)) {
          const key = cacheKey.split('.').slice(2).join('.');
          sectionContent[key] = value;
        }
      });
      
      setContent(sectionContent);
    };

    initializeContent();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('content-section-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `page=eq.${page}`
        },
        () => {
          // Reload section content
          const sectionContent: Record<string, string> = {};
          Object.entries(contentCache).forEach(([cacheKey, value]) => {
            if (cacheKey.startsWith(`${page}.${section}.`)) {
              const key = cacheKey.split('.').slice(2).join('.');
              sectionContent[key] = value;
            }
          });
          setContent(sectionContent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

// Preload content on app start
export const preloadContent = () => {
  if (!isContentLoaded && !contentLoadingPromise) {
    loadContent();
  }
};