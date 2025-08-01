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
import { useContentAdmin } from '@/hooks/useContent';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [newContent, setNewContent] = useState({
    page: '',
    section: '',
    key: '',
    value: '',
    language_code: 'en'
  });

  const { loading, createContent, updateContent, deleteContent, getAllContent } = useContentAdmin();
  const { toast } = useToast();

  // Helper function to check if a field is a boolean field
  const isBooleanField = (key: string) => {
    return key.endsWith('_hidden') || key === 'true' || key === 'false';
  };

  // Helper function to get a user-friendly label for boolean fields
  const getBooleanFieldLabel = (key: string) => {
    if (key.endsWith('_hidden')) {
      const platform = key.replace('_hidden', '');
      return `Hide ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
    }
    return key;
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

  const loadContent = async () => {
    const result = await getAllContent();
    if (result.success && result.data) {
      setContent(result.data);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to load content',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async () => {
    if (!newContent.page || !newContent.section || !newContent.key || !newContent.value) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await createContent(
      newContent.page,
      newContent.section,
      newContent.key,
      newContent.value,
      newContent.language_code
    );

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Content created successfully',
      });
      setIsCreateModalOpen(false);
      setNewContent({ page: '', section: '', key: '', value: '', language_code: 'en' });
      loadContent();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create content',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    const result = await updateContent(editingItem.id, editingItem.value);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });
      setEditingItem(null);
      loadContent();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteContent(id);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Content deleted successfully',
      });
      loadContent();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete content',
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            Manage all text content across the application. Changes will be reflected immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Content</DialogTitle>
                  <DialogDescription>
                    Create a new content entry for the application.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="page">Page</Label>
                      <Input
                        id="page"
                        value={newContent.page}
                        onChange={(e) => setNewContent({ ...newContent, page: e.target.value })}
                        placeholder="e.g., home, about"
                      />
                    </div>
                    <div>
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={newContent.section}
                        onChange={(e) => setNewContent({ ...newContent, section: e.target.value })}
                        placeholder="e.g., hero, nav"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Input
                      id="key"
                      value={newContent.key}
                      onChange={(e) => setNewContent({ ...newContent, key: e.target.value })}
                      placeholder="e.g., title, subtitle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Textarea
                      id="value"
                      value={newContent.value}
                      onChange={(e) => setNewContent({ ...newContent, value: e.target.value })}
                      placeholder="Enter the content text..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={loading}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading && content.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
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
                                  {isBooleanField(item.key) ? (
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={item.value === 'true'}
                                        onCheckedChange={async (checked) => {
                                          const updatedItem = { ...item, value: checked ? 'true' : 'false' };
                                          const result = await updateContent(updatedItem.id, updatedItem.value);
                                          if (result.success) {
                                            toast({
                                              title: 'Success',
                                              description: 'Content updated successfully',
                                            });
                                            loadContent(); // Refresh the content
                                          } else {
                                            toast({
                                              title: 'Error',
                                              description: 'Failed to update content',
                                              variant: 'destructive',
                                            });
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
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setEditingItem({ ...item })}
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
                                            {isBooleanField(editingItem.key) ? (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};