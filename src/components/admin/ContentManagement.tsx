import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

export const ContentManagement = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  
  // Debug: Log when editingItem changes
  useEffect(() => {
    console.log('editingItem changed:', editingItem);
  }, [editingItem]);
  const [newContent, setNewContent] = useState({
    page: '',
    section: '',
    key: '',
    value: '',
    language_code: 'en'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to check if a field is a boolean field
  const isBooleanField = (key: string) => {
    if (!key || typeof key !== 'string') return false;
    return key.endsWith('_hidden') || key === 'true' || key === 'false';
  };

  // Helper function to get a user-friendly label for boolean fields
  const getBooleanFieldLabel = (key: string) => {
    if (!key || typeof key !== 'string') return '';
    if (key.endsWith('_hidden')) {
      const platform = key.replace('_hidden', '');
      return `Hide ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
    }
    return key;
  };

  // Load content from Supabase
  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('page')
        .order('section')
        .order('key');
      if (error) {
        setError(error.message);
        setContent([]);
        return;
      }
      setContent(data || []);
      setFilteredContent(data || []);
      // Debug log
      console.log('ContentManagement: Loaded content:', data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  // Load content on mount
  useEffect(() => {
    loadContent();
  }, []);

  // Filter content based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredContent(content);
    } else {
      const filtered = content.filter(item =>
        item.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContent(filtered);
    }
  }, [content, searchQuery]);

  const handleCreate = async () => {
    if (!newContent.page || !newContent.section || !newContent.key || !newContent.value) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Creating new content:', newContent);
      
      const { data, error } = await supabase
        .from('content')
        .insert([
          {
            page: newContent.page,
            section: newContent.section,
            key: newContent.key,
            value: newContent.value,
            language_code: newContent.language_code,
          },
        ])
        .select();

      if (error) {
        console.error('ContentManagement: Error creating content:', error);
        toast({
          title: 'Error',
          description: `Failed to create content: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      console.log('Create successful, data:', data);
      
      toast({
        title: 'Success! ✅',
        description: `"${newContent.key}" has been created successfully`,
      });
      setIsCreateModalOpen(false);
      setNewContent({ page: '', section: '', key: '', value: '', language_code: 'en' });
      await loadContent();
    } catch (error) {
      console.error('ContentManagement: Unexpected error creating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to create content. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    console.log('🔧 UPDATE DEBUG:');
    console.log('- ID:', editingItem.id);
    console.log('- New value:', editingItem.value);
    console.log('- Supabase URL:', supabase.supabaseUrl);

    const { data, error } = await supabase
      .from('content')
      .update({ value: editingItem.value })
      .eq('id', editingItem.id)
      .select();

    console.log('🔧 UPDATE RESULT:');
    console.log('- Data:', data);
    console.log('- Error:', error);

    if (error) {
      console.error('❌ UPDATE FAILED:', error);
      toast({
        title: 'Error',
        description: `Failed to update: ${error.message}`,
        variant: 'destructive',
      });
    } else {
      console.log('✅ UPDATE SUCCESS:', data);
      toast({
        title: 'Success',
        description: 'Content updated',
      });
      setEditingItem(null);
      loadContent();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('Deleting content with ID:', id);
      
      const { data, error } = await supabase
        .from('content')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('ContentManagement: Error deleting content:', error);
        toast({
          title: 'Error',
          description: `Failed to delete content: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      console.log('Delete successful, data:', data);
      
      toast({
        title: 'Success! ✅',
        description: 'Content has been deleted successfully',
      });
      await loadContent();
    } catch (error) {
      console.error('ContentManagement: Unexpected error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const groupedContent = filteredContent.reduce((acc, item) => {
    const pageKey = item.page;
    if (!acc[pageKey]) {
      acc[pageKey] = {};
    }
    if (!acc[pageKey][item.section]) {
      acc[pageKey][item.section] = [];
    }
    acc[pageKey][item.section].push(item);
    return acc;
  }, {} as Record<string, Record<string, ContentItem[]>>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Management</CardTitle>
        <CardDescription>
          Manage all text content across the application. Changes will be reflected immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={loadContent} variant="outline" disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin mr-2' : 'mr-2'} />
            Reload
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Content
          </Button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800 font-medium">Error loading content: {error}</p>
            <p className="text-xs text-gray-500 mt-2">VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</p>
            <p className="text-xs text-gray-500">VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'Not set'}</p>
          </div>
        )}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div>
            {Object.entries(groupedContent).map(([page, sections]) => (
              <Card key={page}>
                <CardHeader>
                  <CardTitle className="text-lg">{page.charAt(0).toUpperCase() + page.slice(1)} Page</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(sections).map(([section, items]) => (
                    <div key={section} className="mb-6">
                      <h4 className="text-md font-semibold mb-3 text-muted-foreground">
                        {section.charAt(0).toUpperCase() + section.slice(1)} Section
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value / Status</TableHead>
                            <TableHead className="w-32">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono text-sm">{item.key}</TableCell>
                                                             <TableCell className="max-w-xs truncate">
                                 {item.key && isBooleanField(item.key) ? (
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={item.value === 'true'}
                                      onCheckedChange={async (checked) => {
                                        const updatedItem = { ...item, value: checked ? 'true' : 'false' };
                                        const result = await supabase
                                          .from('content')
                                          .update({ value: updatedItem.value })
                                          .eq('id', updatedItem.id)
                                          .select()
                                          .single();
                                        if (result.error) {
                                          toast({
                                            title: 'Error',
                                            description: `Failed to update content: ${result.error.message}`,
                                            variant: 'destructive',
                                          });
                                        } else {
                                          toast({
                                            title: 'Success',
                                            description: 'Content updated successfully',
                                          });
                                          loadContent(); // Refresh the content
                                        }
                                      }}
                                      className="data-[state=checked]:bg-[#00AFCE]"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      {item.value === 'true' ? (
                                        <span className="flex items-center gap-1 text-red-600">
                                          <EyeOff className="h-3 w-3" />
                                          Hidden
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-green-600">
                                          <Eye className="h-3 w-3" />
                                          Visible
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  item.value
                                )}
                              </TableCell>
                              <TableCell>
                                                                 <div className="flex gap-2">
                                   <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                                     <DialogTrigger asChild>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => {
                                           console.log('Edit button clicked for item:', item);
                                           setEditingItem({ ...item });
                                         }}
                                       >
                                         <Pencil className="h-3 w-3" />
                                       </Button>
                                     </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Content</DialogTitle>
                                        <DialogDescription>
                                          Update the content for {item.page}.{item.section}.{item.key}
                                        </DialogDescription>
                                      </DialogHeader>
                                                                             {editingItem && (
                                         <div className="py-4">
                                           {editingItem.key && isBooleanField(editingItem.key) ? (
                                            <div className="space-y-4">
                                              <Label className="text-base font-medium">
                                                {getBooleanFieldLabel(editingItem.key)}
                                              </Label>
                                              <div className="flex items-center gap-3">
                                                <Switch
                                                  checked={editingItem.value === 'true'}
                                                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, value: checked ? 'true' : 'false' })}
                                                  className="data-[state=checked]:bg-[#00AFCE]"
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                  {editingItem.value === 'true' ? 'Hidden' : 'Visible'}
                                                </span>
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                {editingItem.value === 'true' 
                                                  ? 'This item will be hidden from the website.'
                                                  : 'This item will be visible on the website.'
                                                }
                                              </p>
                                            </div>
                                          ) : (
                                            <>
                                              <Label htmlFor="edit-value">Value</Label>
                                              <Textarea
                                                id="edit-value"
                                                value={editingItem.value}
                                                onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                                className="mt-2"
                                              />
                                            </>
                                          )}
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditingItem(null)}>
                                          Cancel
                                        </Button>
                                        <Button onClick={handleUpdate} disabled={loading}>
                                          Update
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this content item? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            {filteredContent.length === 0 && !error && (
              <div className="text-center text-gray-500 py-8">No content found.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};