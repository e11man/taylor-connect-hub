import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  description: string;
  website: string;
  phone: string;
  contact_email: string;
}

interface OrganizationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onUpdate: (updatedOrg: Organization) => void;
}

export const OrganizationProfileModal: React.FC<OrganizationProfileModalProps> = ({
  isOpen,
  onClose,
  organization,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    phone: '',
    contact_email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update form data when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        website: organization.website || '',
        phone: organization.phone || '',
        contact_email: organization.contact_email || ''
      });
    }
  }, [organization]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.website && !isValidUrl(formData.website)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid website URL.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.contact_email && !isValidEmail(formData.contact_email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid contact email address.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !organization) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          website: formData.website.trim() || null,
          phone: formData.phone.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your organization profile has been successfully updated.",
      });

      onUpdate(data);
      onClose();
    } catch (error) {
      console.error('Error updating organization profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update organization profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatWebsiteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Organization Profile</DialogTitle>
          <DialogDescription>
            Update your organization's information and contact details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organization name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your organization and its mission"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Include https:// or we'll add it automatically
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="contact@organization.com"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This email will be displayed to volunteers for contact purposes
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 