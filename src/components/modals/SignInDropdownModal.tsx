import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Building2, Users } from 'lucide-react';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import SecondaryButton from '@/components/buttons/SecondaryButton';
import { DynamicText } from '@/components/content/DynamicText';
import '@/styles/modal.css';

interface SignInDropdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationSignup: () => void;
  onVolunteerSignup: () => void;
}

const SignInDropdownModal = ({ 
  isOpen, 
  onClose, 
  onOrganizationSignup, 
  onVolunteerSignup 
}: SignInDropdownModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xl border-2 border-gray-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              <DynamicText 
                page="header" 
                section="signin_modal" 
                contentKey="title"
                fallback="Join Taylor Connect Hub"
                as="span"
              />
            </h2>
            <p className="text-gray-600">
              <DynamicText 
                page="header" 
                section="signin_modal" 
                contentKey="subtitle"
                fallback="Choose how you'd like to get started"
                as="span"
              />
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Organization Option */}
            <div className="border border-gray-200 rounded-xl p-6 hover:border-primary/30 hover:bg-gray-50/50 transition-all duration-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">
                    <DynamicText 
                      page="header" 
                      section="signin_modal" 
                      contentKey="organization_title"
                      fallback="For Organizations"
                      as="span"
                    />
                  </h3>
                  <p className="text-sm text-gray-600">
                    <DynamicText 
                      page="header" 
                      section="signin_modal" 
                      contentKey="organization_description"
                      fallback="Post volunteer opportunities and manage events"
                      as="span"
                    />
                  </p>
                </div>
              </div>
              <PrimaryButton
                onClick={onOrganizationSignup}
                className="w-full"
              >
                <DynamicText 
                  page="header" 
                  section="signin_modal" 
                  contentKey="organization_button"
                  fallback="Sign Up as Organization"
                  as="span"
                />
              </PrimaryButton>
            </div>

            {/* Volunteer Option */}
            <div className="border border-gray-200 rounded-xl p-6 hover:border-secondary/30 hover:bg-gray-50/50 transition-all duration-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">
                    <DynamicText 
                      page="header" 
                      section="signin_modal" 
                      contentKey="volunteer_title"
                      fallback="For Volunteers"
                      as="span"
                    />
                  </h3>
                  <p className="text-sm text-gray-600">
                    <DynamicText 
                      page="header" 
                      section="signin_modal" 
                      contentKey="volunteer_description"
                      fallback="Find and sign up for volunteer opportunities"
                      as="span"
                    />
                  </p>
                </div>
              </div>
              <SecondaryButton
                onClick={onVolunteerSignup}
                className="w-full"
              >
                <DynamicText 
                  page="header" 
                  section="signin_modal" 
                  contentKey="volunteer_button"
                  fallback="Sign Up as Volunteer"
                  as="span"
                />
              </SecondaryButton>
            </div>
          </div>

          {/* Already have account */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <DynamicText 
                page="header" 
                section="signin_modal" 
                contentKey="already_have_account"
                fallback="Already have an account?"
                as="span"
              />
              {' '}
              <button
                onClick={onClose}
                className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
              >
                <DynamicText 
                  page="header" 
                  section="signin_modal" 
                  contentKey="use_login_button"
                  fallback="Use the Log In button"
                  as="span"
                />
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDropdownModal;