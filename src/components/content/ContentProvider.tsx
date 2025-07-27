import { createContext, useContext, useEffect, ReactNode } from 'react';
import { preloadContent } from '@/hooks/useContent';

const ContentContext = createContext({});

interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider = ({ children }: ContentProviderProps) => {
  useEffect(() => {
    // Preload content when app starts
    preloadContent();
  }, []);

  return (
    <ContentContext.Provider value={{}}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContentContext = () => useContext(ContentContext);