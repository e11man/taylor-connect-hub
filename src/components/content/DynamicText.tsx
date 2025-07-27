import { useContent } from '@/hooks/useContent';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

interface DynamicTextProps {
  page: string;
  section: string;
  contentKey: string;
  fallback?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: never;
  showSkeleton?: boolean;
  skeletonWidth?: string;
}

export const DynamicText = ({ 
  page, 
  section, 
  contentKey, 
  fallback = '', 
  as: Component = 'span',
  className,
  showSkeleton = true,
  skeletonWidth = 'w-24'
}: DynamicTextProps) => {
  const { content, loading } = useContent(page, section, contentKey, fallback);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // After first content load, don't show skeleton anymore
    if (!loading && content) {
      setIsInitialLoad(false);
    }
  }, [loading, content]);

  // Show skeleton only on initial load and if showSkeleton is true
  if (loading && isInitialLoad && showSkeleton) {
    return <Skeleton className={`h-4 ${skeletonWidth} ${className || ''}`} />;
  }

  // Always show content if available, even during subsequent loads
  const displayContent = content || fallback;
  
  if (!displayContent) {
    console.warn(`DynamicText: No content or fallback for ${page}.${section}.${contentKey}`);
  }

  return (
    <Component className={className}>
      {displayContent}
    </Component>
  );
};