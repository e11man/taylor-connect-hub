import { createContext, useContext, useEffect, ReactNode } from 'react';
import { preloadContent, refreshContent } from '@/hooks/useContent';
import { useLocation } from 'react-router-dom';

interface ContentContextValue {
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextValue>({
  refreshContent: async () => {}
});

interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider = ({ children }: ContentProviderProps) => {
  const location = useLocation();

  useEffect(() => {
    // Preload content when app starts
    const cleanup = preloadContent();
    
    // Set up visibility change listener for refreshing content when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh content when user returns to the tab
        refreshContent().catch(error => {
          console.error('Error refreshing content on visibility change:', error);
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up online/offline listener
    const handleOnline = () => {
      // Refresh content when coming back online
      refreshContent().catch(error => {
        console.error('Error refreshing content on online:', error);
      });
    };
    
    window.addEventListener('online', handleOnline);
    
    // Set up popstate listener for browser back/forward navigation
    const handlePopState = () => {
      // Refresh content when navigating via browser buttons
      refreshContent().catch(error => {
        console.error('Error refreshing content on popstate:', error);
      });
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      if (cleanup) cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Refresh content on route change
  useEffect(() => {
    // Implement stale-while-revalidate: show existing content immediately
    // while fetching fresh content in the background
    refreshContent().catch(error => {
      console.error('Error refreshing content on route change:', error);
    });
  }, [location.pathname]);

  const contextValue: ContentContextValue = {
    refreshContent
  };

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContentContext = () => useContext(ContentContext);