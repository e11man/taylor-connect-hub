import { useEffect } from 'react';

export const usePageTitle = (pageTitle?: string) => {
  useEffect(() => {
    const appName = 'Main Street Connect';
    if (pageTitle) {
      document.title = `${pageTitle} | ${appName}`;
    } else {
      document.title = appName;
    }
  }, [pageTitle]);
};