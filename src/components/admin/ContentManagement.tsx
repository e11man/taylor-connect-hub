import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Eye, Save, X, RefreshCw, Search, Filter, FileText, Globe, Edit3, Trash2, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export const ContentManagement = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  // Get unique pages and sections
  const pages = ['all', ...Array.from(new Set(content.map(item => item.page)))];
  const sections = ['all', ...Array.from(new Set(
    content
      .filter(item => selectedPage === 'all' || item.page === selectedPage)
      .map(item => item.section)
  ))];

  // Filter content based on selections
  const filteredContent = content.filter(item => {
    const matchesPage = selectedPage === 'all' || item.page === selectedPage;
    const matchesSection = selectedSection === 'all' || item.section === selectedSection;
    const matchesSearch = item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.section.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPage && matchesSection && matchesSearch;
  });

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('content')
        .update({
          value: editingItem.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      // Update local state
      setContent(prev => prev.map(item => 
        item.id === editingItem.id ? editingItem : item
      ));

      toast({
        title: "Success",
        description: "Content updated successfully",
      });

      setIsEditModalOpen(false);
      setEditingItem(null);
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

  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to delete "${item.key}"?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      // Update local state
      setContent(prev => prev.filter(contentItem => contentItem.id !== item.id));

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete content',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportContent = () => {
    const dataStr = JSON.stringify(filteredContent, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-gray-600">Manage all text content across the application</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportContent} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={loadContent} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by key, value, page, or section..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger>
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map(page => (
                  <SelectItem key={page} value={page}>
                    {page === 'all' ? 'All Pages' : page.charAt(0).toUpperCase() + page.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section} value={section}>
                    {section === 'all' ? 'All Sections' : section.charAt(0).toUpperCase() + section.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Content Items
          </CardTitle>
          <CardDescription>
            {filteredContent.length} items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContent.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {item.page}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {item.section}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.key}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={item.value}>
                        {item.value}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          className="flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedPage !== 'all' || selectedSection !== 'all' 
                ? 'No content found matching your criteria' 
                : 'No content available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
              Update the content for {editingItem?.key}
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Page</Label>
                  <Input value={editingItem.page} disabled />
                </div>
                <div>
                  <Label>Section</Label>
                  <Input value={editingItem.section} disabled />
                </div>
              </div>
              <div>
                <Label>Key</Label>
                <Input value={editingItem.key} disabled />
              </div>
              <div>
                <Label>Value</Label>
                <Textarea
                  value={editingItem.value}
                  onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                  rows={6}
                  placeholder="Enter content..."
                />
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date(editingItem.updated_at).toLocaleString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};