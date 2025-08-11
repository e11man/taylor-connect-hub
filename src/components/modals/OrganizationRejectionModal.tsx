import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizationRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  organizationName: string;
  isLoading?: boolean;
}

const OrganizationRejectionModal: React.FC<OrganizationRejectionModalProps> = ({
  isOpen,
  onClose,
  onReject,
  organizationName,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleReject = () => {
    if (!reason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }
    
    onReject(reason.trim());
    handleClose();
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-left">Reject Organization</DialogTitle>
              <DialogDescription className="text-left">
                You are about to reject "{organizationName}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Important:</p>
                <p>Once rejected, the organization will be notified via email and cannot reapply with the same account.</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="rejection-reason" className="text-foreground">
              Reason for Rejection *
            </Label>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="Please provide a detailed reason for rejecting this organization application..."
              rows={4}
              className={cn(
                "mt-1 resize-none",
                error && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              disabled={isLoading}
            />
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              This reason will be included in the notification email sent to the organization.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="destructive"
            className="flex-1"
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Organization
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationRejectionModal;
