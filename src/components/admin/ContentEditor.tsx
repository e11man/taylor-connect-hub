import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Eye, Save, X, RefreshCw, Globe, Type, Image, Layout, Edit3, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

interface PageSection {
  page: string;
  section: string;
  items: ContentItem[];
}

export const ContentEditor = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('about');
  const [selectedSection, setSelectedSection] = useState<string>('hero');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();
  const editingRef = useRef<HTMLDivElement>(null);

  // Group content by page and section
  const pageSections: PageSection[] = content.reduce((acc, item) => {
    const existingPage = acc.find(p => p.page === item.page);
    if (existingPage) {
      const existingSection = existingPage.items.find(i => i.section === item.section);
      if (existingSection) {
        existingPage.items.push(item);
      } else {
        existingPage.items.push(item);
      }
    } else {
      acc.push({
        page: item.page,
        section: item.section,
        items: [item]
      });
    }
    return acc;
  }, [] as PageSection[]);

  const pages = [...new Set(content.map(item => item.page))];
  const sections = pageSections
    .filter(ps => ps.page === selectedPage)
    .map(ps => ps.section);

  // Load content from Supabase
  const loadContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('page')
        .order('section')
        .order('key');
      
      if (error) throw error;
      setContent(data || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load content',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Keyboard shortcuts for editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingField) {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          handleSaveEdit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelEdit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingField, editingValue]);

  const handleStartEdit = (key: string, currentValue: string) => {
    setEditingField(key);
    setEditingValue(currentValue);
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;

    const item = content.find(i => i.key === editingField && i.page === selectedPage && i.section === selectedSection);
    if (!item) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('content')
        .update({
          value: editingValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      // Update local state
      setContent(prev => prev.map(contentItem => 
        contentItem.id === item.id ? { ...contentItem, value: editingValue } : contentItem
      ));

      toast({
        title: "Success",
        description: "Content updated successfully",
      });

      setEditingField(null);
      setEditingValue('');
      setEditMode(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update content',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
    setEditMode(false);
  };

  // Get value for a specific key
  const getValue = (key: string) => {
    const item = content.find(i => i.key === key && i.page === selectedPage && i.section === selectedSection);
    return item?.value || '';
  };

  // Render the actual site content with CSS styles
  const renderSiteContent = () => {
    switch (selectedPage) {
      case 'about':
        switch (selectedSection) {
          case 'hero':
            return (
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                      <span 
                        className={`text-blue-600 ${editMode ? 'cursor-pointer hover:bg-blue-100 px-1 rounded transition-colors' : ''}`}
                        onClick={() => editMode && handleStartEdit('titleLine1', getValue('titleLine1'))}
                        title={editMode ? "Click to edit" : ""}
                      >
                        {editingField === 'titleLine1' ? (
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="text-4xl md:text-6xl font-bold text-blue-600 bg-transparent border-none p-0 text-center"
                            autoFocus
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                        ) : (
                          getValue('titleLine1')
                        )}
                      </span>
                      <br />
                      <span 
                        className={`text-indigo-600 ${editMode ? 'cursor-pointer hover:bg-indigo-100 px-1 rounded transition-colors' : ''}`}
                        onClick={() => editMode && handleStartEdit('titleLine2', getValue('titleLine2'))}
                        title={editMode ? "Click to edit" : ""}
                      >
                        {editingField === 'titleLine2' ? (
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="text-4xl md:text-6xl font-bold text-indigo-600 bg-transparent border-none p-0 text-center"
                            autoFocus
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                        ) : (
                          getValue('titleLine2')
                        )}
                      </span>
                    </h1>
                    <p 
                      className={`text-xl text-gray-600 mb-8 max-w-2xl mx-auto ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('subtitle', getValue('subtitle'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'subtitle' ? (
                        <Textarea
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-xl text-gray-600 bg-transparent border-none p-0 text-center resize-none"
                          rows={2}
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('subtitle')
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg ${editMode ? 'cursor-pointer' : ''}`}
                        onClick={() => editMode && handleStartEdit('ctaButton', getValue('ctaButton'))}
                        title={editMode ? "Click to edit" : ""}
                      >
                        {editingField === 'ctaButton' ? (
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="bg-transparent border-none p-0 text-center text-white text-lg"
                            autoFocus
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                        ) : (
                          getValue('ctaButton')
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        className={`px-8 py-3 text-lg ${editMode ? 'cursor-pointer' : ''}`}
                        onClick={() => editMode && handleStartEdit('secondaryButton', getValue('secondaryButton'))}
                        title={editMode ? "Click to edit" : ""}
                      >
                        {editingField === 'secondaryButton' ? (
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="bg-transparent border-none p-0 text-center text-lg"
                            autoFocus
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                        ) : (
                          getValue('secondaryButton')
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          case 'mission':
            return (
              <div className="min-h-screen bg-white">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto">
                    <h2 
                      className={`text-3xl font-bold text-gray-900 mb-6 text-center ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('title', getValue('title'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'title' ? (
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-3xl font-bold text-gray-900 bg-transparent border-none p-0 text-center"
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('title')
                      )}
                    </h2>
                    <p 
                      className={`text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('description', getValue('description'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'description' ? (
                        <Textarea
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-lg text-gray-600 bg-transparent border-none p-0 text-center resize-none"
                          rows={3}
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('description')
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          case 'main':
            return (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto">
                    <h2 
                      className={`text-3xl font-bold text-gray-900 mb-8 text-center ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('title', getValue('title'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'title' ? (
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-3xl font-bold text-gray-900 bg-transparent border-none p-0 text-center"
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('title')
                      )}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-lg shadow-sm">
                        <h3 
                          className={`text-xl font-semibold mb-4 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('section1Title', getValue('section1Title'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'section1Title' ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-xl font-semibold bg-transparent border-none p-0"
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('section1Title')
                          )}
                        </h3>
                        <p 
                          className={`text-gray-600 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('section1Content', getValue('section1Content'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'section1Content' ? (
                            <Textarea
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-gray-600 bg-transparent border-none p-0 resize-none"
                              rows={3}
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('section1Content')
                          )}
                        </p>
                      </div>
                      <div className="bg-white p-8 rounded-lg shadow-sm">
                        <h3 
                          className={`text-xl font-semibold mb-4 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('section2Title', getValue('section2Title'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'section2Title' ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-xl font-semibold bg-transparent border-none p-0"
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('section2Title')
                          )}
                        </h3>
                        <p 
                          className={`text-gray-600 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('section2Content', getValue('section2Content'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'section2Content' ? (
                            <Textarea
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-gray-600 bg-transparent border-none p-0 resize-none"
                              rows={3}
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('section2Content')
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          default:
            return (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-xl font-semibold mb-4">{selectedSection}</h3>
                    {content
                      .filter(item => item.page === selectedPage && item.section === selectedSection)
                      .map(item => (
                        <div key={item.id} className="mb-4">
                          <Label className="text-sm font-medium text-gray-700">{item.key}</Label>
                          <p className="text-gray-900 mt-1">{item.value}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            );
        }
      case 'contact':
        switch (selectedSection) {
          case 'main':
            return (
              <div className="min-h-screen bg-gradient-to-r from-green-600 to-teal-600 text-white">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 
                      className={`text-4xl md:text-6xl font-bold mb-4 ${editMode ? 'cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('title', getValue('title'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'title' ? (
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-4xl md:text-6xl font-bold bg-transparent border-none p-0 text-center text-white"
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('title')
                      )}
                    </h1>
                    <p 
                      className={`text-xl mb-8 opacity-90 ${editMode ? 'cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('subtitle', getValue('subtitle'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'subtitle' ? (
                        <Textarea
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-xl bg-transparent border-none p-0 text-center text-white opacity-90 resize-none"
                          rows={2}
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('subtitle')
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          case 'info':
            return (
              <div className="min-h-screen bg-white">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto">
                    <h2 
                      className={`text-3xl font-bold text-gray-900 mb-8 text-center ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('title', getValue('title'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'title' ? (
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-3xl font-bold text-gray-900 bg-transparent border-none p-0 text-center"
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('title')
                      )}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 
                          className={`text-xl font-semibold mb-3 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('addressTitle', getValue('addressTitle'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'addressTitle' ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-xl font-semibold bg-transparent border-none p-0"
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('addressTitle')
                          )}
                        </h3>
                        <p 
                          className={`text-gray-600 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('address', getValue('address'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'address' ? (
                            <Textarea
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-gray-600 bg-transparent border-none p-0 resize-none"
                              rows={2}
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('address')
                          )}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 
                          className={`text-xl font-semibold mb-3 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('contactTitle', getValue('contactTitle'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'contactTitle' ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-xl font-semibold bg-transparent border-none p-0"
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('contactTitle')
                          )}
                        </h3>
                        <p 
                          className={`text-gray-600 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('email', getValue('email'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'email' ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-gray-600 bg-transparent border-none p-0"
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('email')
                          )}
                        </p>
                        <p 
                          className={`text-gray-600 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors' : ''}`}
                          onClick={() => editMode && handleStartEdit('phone', getValue('phone'))}
                          title={editMode ? "Click to edit" : ""}
                        >
                          {editingField === 'phone' ? (
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="text-gray-600 bg-transparent border-none p-0"
                              autoFocus
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          ) : (
                            getValue('phone')
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          default:
            return (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-xl font-semibold mb-4">{selectedSection}</h3>
                    {content
                      .filter(item => item.page === selectedPage && item.section === selectedSection)
                      .map(item => (
                        <div key={item.id} className="mb-4">
                          <Label className="text-sm font-medium text-gray-700">{item.key}</Label>
                          <p className="text-gray-900 mt-1">{item.value}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            );
        }
      case 'home':
        switch (selectedSection) {
          case 'hero':
            return (
              <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto text-center">
                    <h1 
                      className={`text-4xl md:text-6xl font-bold mb-4 ${editMode ? 'cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('title', getValue('title'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'title' ? (
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-4xl md:text-6xl font-bold bg-transparent border-none p-0 text-center text-white"
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('title')
                      )}
                    </h1>
                    <p 
                      className={`text-xl mb-8 opacity-90 ${editMode ? 'cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors' : ''}`}
                      onClick={() => editMode && handleStartEdit('subtitle', getValue('subtitle'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'subtitle' ? (
                        <Textarea
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="text-xl bg-transparent border-none p-0 text-center text-white opacity-90 resize-none"
                          rows={2}
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('subtitle')
                      )}
                    </p>
                    <Button 
                      className={`bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg ${editMode ? 'cursor-pointer' : ''}`}
                      onClick={() => editMode && handleStartEdit('ctaButton', getValue('ctaButton'))}
                      title={editMode ? "Click to edit" : ""}
                    >
                      {editingField === 'ctaButton' ? (
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="bg-transparent border-none p-0 text-center text-blue-600 text-lg"
                          autoFocus
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        getValue('ctaButton')
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          default:
            return (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-16">
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-xl font-semibold mb-4">{selectedSection}</h3>
                    {content
                      .filter(item => item.page === selectedPage && item.section === selectedSection)
                      .map(item => (
                        <div key={item.id} className="mb-4">
                          <Label className="text-sm font-medium text-gray-700">{item.key}</Label>
                          <p className="text-gray-900 mt-1">{item.value}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            );
        }
      default:
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-semibold mb-4">{selectedPage} - {selectedSection}</h3>
                {content
                  .filter(item => item.page === selectedPage && item.section === selectedSection)
                  .map(item => (
                    <div key={item.id} className="mb-4">
                      <Label className="text-sm font-medium text-gray-700">{item.key}</Label>
                      <p className="text-gray-900 mt-1">{item.value}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visual Content Editor</h2>
          <p className="text-gray-600">Edit content directly on the rendered page</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadContent} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reload
          </Button>
          <Button 
            onClick={() => setEditMode(!editMode)} 
            variant={editMode ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {editMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Page & Section Navigation */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pages.map(page => (
                  <Button
                    key={page}
                    variant={selectedPage === page ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedPage(page)}
                  >
                    {page.charAt(0).toUpperCase() + page.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections.map(section => (
                  <Button
                    key={section}
                    variant={selectedSection === section ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedSection(section)}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {editMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit Mode Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Click on any text to edit</p>
                  <p>• Press Enter to save</p>
                  <p>• Press Esc to cancel</p>
                  <p>• Ctrl+Enter for multi-line</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area - Rendered Site */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </CardTitle>
              <CardDescription>
                {editMode ? "Click on text to edit directly" : "Enter edit mode to make changes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden relative">
                {editMode && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs z-10">
                    Edit Mode
                  </div>
                )}
                {renderSiteContent()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 