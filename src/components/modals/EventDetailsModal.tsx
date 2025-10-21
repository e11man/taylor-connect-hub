import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, User, Phone, Info, X } from 'lucide-react';
import { formatEventDate, formatEventTimeRange } from '@/utils/formatEvent';
import AddressLink from '@/components/ui/AddressLink';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import SecondaryButton from '@/components/buttons/SecondaryButton';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  arrival_time: string | null;
  estimated_end_time: string | null;
  location: string | null;
  max_participants: number | null;
  meeting_point: string | null;
  contact_person: string | null;
  contact_person_phone: string | null;
  special_instructions: string | null;
  organization_name?: string;
  currentParticipants?: number;
  isFull?: boolean;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onSignUp?: (eventId: string) => void;
  isSignedUp?: boolean;
  canSignUp?: boolean;
  signUpDisabled?: boolean;
  signUpButtonText?: string;
  showSignUpButton?: boolean;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onSignUp,
  isSignedUp = false,
  canSignUp = true,
  signUpDisabled = false,
  signUpButtonText = 'Sign Up',
  showSignUpButton = true
}) => {
  if (!event) return null;

  const handleSignUp = () => {
    if (onSignUp && !isSignedUp && !signUpDisabled) {
      onSignUp(event.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl md:text-2xl font-bold text-primary pr-8">
            {event.title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Status */}
          {event.isFull && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Event Full
                </div>
                <span className="text-red-700 text-sm">This event has reached maximum capacity</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">About This Opportunity</h3>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Key Event Details */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary">Event Details</h3>
            <div className="grid gap-4">
              {/* Organization */}
              {event.organization_name && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#00AFCE]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#00AFCE]" />
                  </div>
                  <div>
                    <span className="font-medium text-primary">Organization:</span>
                    <span className="ml-2 text-gray-700">{event.organization_name}</span>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00AFCE]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#00AFCE]" />
                </div>
                <div>
                  <span className="font-medium text-primary">Date:</span>
                  <span className="ml-2 text-gray-700">{formatEventDate(event.date)}</span>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00AFCE]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[#00AFCE]" />
                </div>
                <div>
                  <span className="font-medium text-primary">Time:</span>
                  <span className="ml-2 text-gray-700">
                    {formatEventTimeRange(event.arrival_time, event.estimated_end_time)}
                  </span>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#00AFCE]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#00AFCE]" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-primary">Location:</span>
                    <div className="ml-2 inline-block">
                      <AddressLink address={event.location} className="text-gray-700 hover:text-[#00AFCE]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Participants */}
              {event.max_participants && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#00AFCE]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#00AFCE]" />
                  </div>
                  <div>
                    <span className="font-medium text-primary">Participants:</span>
                    <span className="ml-2 text-gray-700">
                      {event.currentParticipants || 0} / {event.max_participants} participants
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {(event.meeting_point || event.contact_person || event.contact_person_phone || event.special_instructions) && (
            <div>
              <h3 className="font-semibold text-lg mb-4 text-primary">Additional Information</h3>
              <div className="space-y-4">
                {/* Meeting Point */}
                {event.meeting_point && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Meeting Point</h4>
                        <p className="text-blue-800">{event.meeting_point}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {(event.contact_person || event.contact_person_phone) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 mb-1">Contact Information</h4>
                        {event.contact_person && (
                          <p className="text-green-800">
                            <span className="font-medium">Contact Person:</span> {event.contact_person}
                          </p>
                        )}
                        {event.contact_person_phone && (
                          <p className="text-green-800">
                            <span className="font-medium">Phone:</span> {event.contact_person_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                {event.special_instructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900 mb-1">Special Instructions</h4>
                        <p className="text-amber-800">{event.special_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showSignUpButton && (
            <div className="flex gap-3 pt-4 border-t">
              <SecondaryButton onClick={onClose} className="flex-1">
                Close
              </SecondaryButton>
              {isSignedUp ? (
                <div className="flex-1 bg-green-100 text-green-800 text-center py-3 px-4 rounded-xl font-semibold flex items-center justify-center">
                  Signed Up ✓
                </div>
              ) : (
                <PrimaryButton
                  onClick={handleSignUp}
                  disabled={signUpDisabled || event.isFull}
                  className="flex-1"
                >
                  {event.isFull ? 'Event Full' : signUpButtonText}
                </PrimaryButton>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;