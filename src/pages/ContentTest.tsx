import { useContentSection, useContent, refreshContent } from '@/hooks/useContent';
import { DynamicText } from '@/components/content/DynamicText';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const ContentTest = () => {
  // Test individual content hooks
  const { content: title1, loading: loading1 } = useContent('home', 'hero', 'titleLine1', 'Connect.');
  const { content: title2, loading: loading2 } = useContent('home', 'hero', 'titleLine2', 'Volunteer.');
  
  // Test section content hook
  const { content: heroContent, loading: heroLoading } = useContentSection('home', 'hero');
  const { content: impactContent, loading: impactLoading } = useContentSection('home', 'impact');
  
  const handleRefresh = async () => {
    await refreshContent();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Content Loading Test Page</h1>
        
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Force Refresh Content
        </Button>
        
        {/* Test Individual Content Hooks */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Individual Content Hooks</h2>
          <div className="space-y-2">
            <div>
              <strong>Title Line 1:</strong> "{title1}" (Loading: {loading1 ? 'Yes' : 'No'})
            </div>
            <div>
              <strong>Title Line 2:</strong> "{title2}" (Loading: {loading2 ? 'Yes' : 'No'})
            </div>
          </div>
        </div>
        
        {/* Test Section Content */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Section Content Hook</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Hero Content ({Object.keys(heroContent).length} keys):</h3>
              <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(heroContent, null, 2)}
              </pre>
              <p className="text-sm text-gray-600 mt-2">Loading: {heroLoading ? 'Yes' : 'No'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Impact Content ({Object.keys(impactContent).length} keys):</h3>
              <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(impactContent, null, 2)}
              </pre>
              <p className="text-sm text-gray-600 mt-2">Loading: {impactLoading ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
        
        {/* Test DynamicText Component */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">DynamicText Component</h2>
          <div className="space-y-2">
            <div>
              <strong>Title Line 1:</strong> <DynamicText page="home" section="hero" contentKey="titleLine1" fallback=<DynamicText page="homepage" section="hero" contentKey="titleLine1" fallback=<DynamicText page="sections" section="hero" contentKey="title_line_1" fallback="Connect." /> /> />
            </div>
            <div>
              <strong>Title Line 2:</strong> <DynamicText page="home" section="hero" contentKey="titleLine2" fallback=<DynamicText page="homepage" section="hero" contentKey="titleLine2" fallback=<DynamicText page="sections" section="hero" contentKey="title_line_2" fallback="Volunteer." /> /> />
            </div>
            <div>
              <strong>CTA Button:</strong> <DynamicText page="home" section="hero" contentKey="ctaButton" fallback=<DynamicText page="cta" section="main" contentKey="primary_button" fallback=<DynamicText page="header" section="buttons" contentKey="get_started" fallback=<DynamicText page="homepage" section="hero" contentKey="ctaButton" fallback=<DynamicText page="sections" section="hero" contentKey="cta_button" fallback="Get Started" /> /> /> /> />
            </div>
          </div>
        </div>
        
        {/* Direct Content Display */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Direct Content Display from heroContent</h2>
          <div className="space-y-2">
            <div><strong>titleLine1:</strong> {heroContent.titleLine1 || '[not loaded]'}</div>
            <div><strong>titleLine2:</strong> {heroContent.titleLine2 || '[not loaded]'}</div>
            <div><strong>titleLine3:</strong> {heroContent.titleLine3 || '[not loaded]'}</div>
            <div><strong>subtitle:</strong> {heroContent.subtitle || '[not loaded]'}</div>
            <div><strong>ctaButton:</strong> {heroContent.ctaButton || '[not loaded]'}</div>
            <div><strong>secondaryButton:</strong> {heroContent.secondaryButton || '[not loaded]'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentTest;