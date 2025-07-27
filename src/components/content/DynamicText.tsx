import { useContent } from '@/hooks/useContent';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicTextProps {
  page: string;
  section: string;
  contentKey: string;
  fallback?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: never;
  showSkeleton?: boolean;
}

export const DynamicText = ({ 
  page, 
  section, 
  contentKey, 
  fallback, 
  as: Component = 'span',
  className,
  showSkeleton = true
}: DynamicTextProps) => {
  const { content, loading } = useContent(page, section, contentKey, fallback);

  if (loading && showSkeleton) {
    return <Skeleton className={`h-4 w-24 ${className || ''}`} />;
  }

  return (
    <Component className={className}>
      {content}
    </Component>
  );
};