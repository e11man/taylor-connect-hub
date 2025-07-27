import { useEffect, useState } from 'react';
import { useContentSection } from '@/hooks/useContent';
import { X, Bug, RefreshCw } from 'lucide-react';
import { refreshContent } from '@/hooks/useContent';

export const ContentDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { content: heroContent, loading } = useContentSection('home', 'hero');
  const { content: impactContent } = useContentSection('home', 'impact');
  
  // Auto-show on mount for debugging
  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  const handleRefresh = async () => {
    await refreshContent();
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isMinimized ? 'w-auto' : 'w-96'}`}>
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-sm">Content Debugger</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Refresh content"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <span className="text-xs">{isMinimized ? '▲' : '▼'}</span>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-3 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {/* Loading State */}
              {loading && (
                <div className="text-yellow-400 text-xs">Loading content...</div>
              )}

              {/* Hero Content */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-1">Hero Section Content:</h3>
                <div className="bg-gray-800 rounded p-2 text-xs font-mono space-y-1">
                  {Object.keys(heroContent).length > 0 ? (
                    Object.entries(heroContent).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-blue-400">{key}:</span>
                        <span className="text-green-400 break-all">"{value}"</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No hero content found</div>
                  )}
                </div>
              </div>

              {/* Impact Content */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-1">Impact Section Content:</h3>
                <div className="bg-gray-800 rounded p-2 text-xs font-mono space-y-1">
                  {Object.keys(impactContent).length > 0 ? (
                    Object.entries(impactContent).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-blue-400">{key}:</span>
                        <span className="text-green-400 break-all">"{value}"</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No impact content found</div>
                  )}
                </div>
              </div>

              {/* Debug Info */}
              <div className="pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                  <div>Total hero keys: {Object.keys(heroContent).length}</div>
                  <div>Total impact keys: {Object.keys(impactContent).length}</div>
                  <div>Last refresh: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};