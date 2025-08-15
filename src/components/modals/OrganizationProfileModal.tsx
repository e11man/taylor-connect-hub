import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import { Tables } from "@/integrations/supabase/types";
import { DynamicText } from "@/components/content/DynamicText";

interface OrganizationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Tables<"organizations"> | null;
  onUpdate: (updatedOrg: Tables<"organizations">) => void;
}

interface FormData {
  name: string;
  description: string;
  phone: string;
  website: string;
  contact_email: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  website?: string;
}

const OrganizationProfileModal: React.FC<OrganizationProfileModalProps> = ({
  isOpen,
  onClose,
  organization,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    phone: "",
    website: "",
    contact_email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Initialize form data when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        description: organization.description || "",
        phone: organization.phone || "",
        website: organization.website || "",
        contact_email: organization.contact_email || "",
      });
      setErrors({});
      setHasAttemptedSubmit(false);
    }
  }, [organization]);

  // Phone number validation
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)\.]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Website URL validation
  const validateWebsite = (website: string): boolean => {
    if (!website) return true; // Website is optional
    try {
      // Allow URLs with or without protocol
      const urlToTest = website.startsWith('http') ? website : `https://${website}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (formData.website && !validateWebsite(formData.website)) {
      newErrors.website = "Please enter a valid website URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    
    if (!validateForm() || !organization) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare update data - only include fields that can be updated
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        contact_email: formData.contact_email.trim(),
      };

      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('user_id', organization.user_id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Organization profile updated successfully.",
      });

      onUpdate(data);
      onClose();
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update organization profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setHasAttemptedSubmit(false);
    setErrors({});
    onClose();
  };

  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Organization Profile</DialogTitle>
          <DialogDescription>
            Update your organization's profile information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label 
              htmlFor="org-name" 
              className={`${hasAttemptedSubmit && errors.name ? 'text-red-600' : 'text-foreground'}`}
            >
              Organization Name*
            </Label>
            <Input
              id="org-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organization name"
              className={`${hasAttemptedSubmit && errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {hasAttemptedSubmit && errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your organization's mission and activities"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="org-contact-email">Contact Email*</Label>
            <Input
              id="org-contact-email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="organization@example.com"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is the primary contact email for your organization
            </p>
          </div>

          <div>
            <Label 
              htmlFor="org-phone" 
              className={`${hasAttemptedSubmit && errors.phone ? 'text-red-600' : 'text-foreground'}`}
            >
              Phone Number
            </Label>
            <Input
              id="org-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className={`${hasAttemptedSubmit && errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {hasAttemptedSubmit && errors.phone && (
              <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label 
              htmlFor="org-website" 
              className={`${hasAttemptedSubmit && errors.website ? 'text-red-600' : 'text-foreground'}`}
            >
              Website
            </Label>
            <Input
              id="org-website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://www.yourorganization.com"
              className={`${hasAttemptedSubmit && errors.website ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {hasAttemptedSubmit && errors.website && (
              <p className="text-xs text-red-600 mt-1">{errors.website}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <PrimaryButton 
              onClick={handleSubmit}
              disabled={isLoading || !formData.name.trim()}
              className="flex-1"
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </PrimaryButton>
            <SecondaryButton 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationProfileModal;