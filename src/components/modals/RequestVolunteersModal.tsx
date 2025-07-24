import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { Link } from "react-router-dom";

interface RequestVolunteersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestVolunteersModal = ({ isOpen, onClose }: RequestVolunteersModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 sm:right-4 sm:top-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 touch-manipulation"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
        </button>

        {/* Modal Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E14F3D] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <span className="text-xl sm:text-2xl font-bold text-white font-montserrat">🤝</span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-montserrat font-bold mb-3 sm:mb-4 text-primary px-2">
            Request Volunteers
          </h2>

          {/* Beta Notice */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-montserrat font-bold text-orange-800 mb-2">
              We're in Beta!
            </h3>
            <p className="text-xs sm:text-sm text-orange-700 leading-relaxed font-montserrat">
              Community Connect is currently in beta testing. We're only allowing verified organizations to post volunteer opportunities at this time.
            </p>
            <p className="text-xs sm:text-sm text-orange-700 mt-2 font-montserrat">
              Individual volunteer requests will be available soon!
            </p>
          </div>

          {/* Organization Section */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-montserrat font-bold text-primary mb-2 sm:mb-3">
              Are you an organization?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 font-montserrat">
              Organizations can already post volunteer opportunities
            </p>
            <Link to="/organization-login" onClick={onClose}>
              <PrimaryButton className="w-full bg-[#00AFCE] hover:bg-[#00AFCE]/90 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl touch-manipulation">
                Organization Login
              </PrimaryButton>
            </Link>
          </div>

          {/* Individual Section */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-montserrat font-bold text-primary mb-2 sm:mb-3">
              Want to be notified when we launch?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 font-montserrat">
              Get in touch and we'll let you know when individual requests are available
            </p>
            <PrimaryButton 
              className="w-full bg-[#E14F3D] hover:bg-[#E14F3D]/90 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl touch-manipulation"
              onClick={() => {
                const subject = encodeURIComponent('Notify me when individual volunteer requests are available');
                const body = encodeURIComponent(`Hi Community Connect team,\n\nI'm interested in being notified when individual volunteer requests become available on your platform.\n\nPlease add me to your notification list.\n\nThank you!\n\nBest regards`);
                window.location.href = `mailto:hello@communityconnect.org?subject=${subject}&body=${body}`;
              }}
            >
              Email for More Info
            </PrimaryButton>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-montserrat touch-manipulation py-2"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestVolunteersModal;