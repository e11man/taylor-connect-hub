import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, LogOut, MessageCircle, Clock, Shield } from "lucide-react";
import { formatEventDate, formatEventTimeRange } from "@/utils/formatEvent";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EventChatModal } from "@/components/chat/EventChatModal";
import { AddressAutocomplete, AddressDetails } from '@/components/ui/address-autocomplete';
import SafetyGuidelinesModal from '@/components/modals/SafetyGuidelinesModal';
import { filterUpcomingEvents, filterActiveEvents } from '@/utils/eventFilters';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  arrival_time: string | null;
  estimated_end_time: string | null;
  location: string;
  max_participants: number;
  created_at: string;
  organization_id: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  website: string;
  phone: string;
  contact_email: string;
}

const OrganizationDashboard = () => {
  const { user, signOut, refreshUserEvents, refreshEvents } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [safetyGuidelinesModalOpen, setSafetyGuidelinesModalOpen] = useState(false);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    arrival_time: '',
    estimated_end_time: '',
    location: '',
    max_participants: '6'
  });

  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);

  // Helper function to check if selected date is today
  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  // Helper function to get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (!user) {
      navigate('/organization-login');
      return;
    }
    
    fetchOrganizationData();
  }, [user, navigate]);

  const fetchOrganizationData = async () => {
    if (!user) return;

    try {
      // Get organization profile
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        navigate('/organization-login');
        return;
      }

      setOrganization(orgData);

      // Get organization's events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      } else {
        // Apply filtering: show only upcoming events (not within 12 hours of start)
        // and filter out expired events
        const filteredData = filterActiveEvents(filterUpcomingEvents(eventsData || []));
        setEvents(filteredData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!organization) return;

    setHasAttemptedSubmit(true);
    
    if (!newEvent.title || !newEvent.description || !newEvent.date || !newEvent.arrival_time || !newEvent.estimated_end_time || !selectedAddress || parseInt(newEvent.max_participants) < 6) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newEvent.arrival_time >= newEvent.estimated_end_time) {
      toast({
        title: "Error",
        description: "End time must be after arrival time",
        variant: "destructive",
      });
      return;
    }

    // Show safety guidelines modal
    setSafetyGuidelinesModalOpen(true);
  };

  const handleSafetyGuidelinesAccept = async () => {
    if (!organization) return;

    try {
      // Combine date and time fields into proper datetime strings
      const eventDate = `${newEvent.date}T${newEvent.arrival_time}:00`;
      const arrivalTime = `${newEvent.date}T${newEvent.arrival_time}:00`;
      const endTime = `${newEvent.date}T${newEvent.estimated_end_time}:00`;

      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          description: newEvent.description,
          date: eventDate,
          arrival_time: arrivalTime,
          estimated_end_time: endTime,
          location: selectedAddress?.formatted || newEvent.location || null,
          max_participants: parseInt(newEvent.max_participants) || null,
          organization_id: organization.id
        }])
        .select()
        .single();

      if (error) throw error;

      setEvents([...events, data]);
      setIsCreateModalOpen(false);
      setSafetyGuidelinesModalOpen(false);
      setNewEvent({ title: '', description: '', date: '', arrival_time: '', estimated_end_time: '', location: '', max_participants: '6' });
      setSelectedAddress(null); // Clear selected address after creation
      setHasAttemptedSubmit(false);
      
      toast({
        title: "Success!",
        description: "Event created successfully.",
      });
      
      // Trigger refresh in other components
      refreshEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event.",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date,
          arrival_time: newEvent.arrival_time || null,
          estimated_end_time: newEvent.estimated_end_time || null,
          location: selectedAddress?.formatted || newEvent.location || null,
          max_participants: parseInt(newEvent.max_participants) || null,
        })
        .eq('id', editingEvent.id)
        .select()
        .single();

      if (error) throw error;

      setEvents(events.map(event => event.id === editingEvent.id ? data : event));
      setIsEditModalOpen(false);
      setEditingEvent(null);
      setNewEvent({ title: '', description: '', date: '', arrival_time: '', estimated_end_time: '', location: '', max_participants: '' });
      setSelectedAddress(null); // Clear selected address after update
      
      toast({
        title: "Success!",
        description: "Event updated successfully.",
      });
      
      // Trigger refresh in other components
      refreshEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also remove all volunteer signups.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      
      toast({
        title: "Success!",
        description: "Event deleted successfully.",
      });
      
      // Trigger refresh in other components (both events and user events since signups are deleted)
      refreshEvents();
      refreshUserEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      date: event.date.split('T')[0], // Convert to YYYY-MM-DD format
      arrival_time: event.arrival_time || '',
      estimated_end_time: event.estimated_end_time || '',
      location: event.location || '',
      max_participants: event.max_participants?.toString() || ''
    });
    setSelectedAddress({ formatted: event.location }); // Pre-fill with current address
    setIsEditModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="section-padding">
          <div className="container-custom">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#00AFCE] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="section-padding">
          <div className="container-custom">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
              <p className="text-gray-600 mt-2">You don't have access to this dashboard.</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="section-padding">
        <div className="container-custom">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-primary mb-2">
                {organization.name} Dashboard
              </h1>
              <p className="text-lg text-muted-foreground font-montserrat">
                {organization.contact_email}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Organization Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm text-muted-foreground">{organization.description}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Website</Label>
                <p className="text-sm text-muted-foreground">{organization.website || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Phone</Label>
                <p className="text-sm text-muted-foreground">{organization.phone || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Events Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-montserrat font-bold text-primary">Your Opportunities</h2>
            <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
              setIsCreateModalOpen(open);
              if (!open) {
                setHasAttemptedSubmit(false);
              }
            }}>
              <DialogTrigger asChild>
                <PrimaryButton>
                  <Plus className="w-4 h-4" />
                  Add New Opportunity
                </PrimaryButton>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Opportunity</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new volunteer opportunity.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className={`${hasAttemptedSubmit && !newEvent.title ? 'text-red-600' : 'text-foreground'}`}>Title*</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Opportunity Title"
                      className={`${hasAttemptedSubmit && !newEvent.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && !newEvent.title && <p className="text-xs text-red-600 mt-1">Title is required</p>}
                  </div>
                  <div>
                    <Label htmlFor="description" className={`${hasAttemptedSubmit && !newEvent.description ? 'text-red-600' : 'text-foreground'}`}>Description*</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="Describe the opportunity"
                      rows={3}
                      className={`${hasAttemptedSubmit && !newEvent.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && !newEvent.description && <p className="text-xs text-red-600 mt-1">Description is required</p>}
                  </div>
                  <div>
                    <Label htmlFor="date" className={`${hasAttemptedSubmit && !newEvent.date ? 'text-red-600' : 'text-foreground'}`}>Date*</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className={`${hasAttemptedSubmit && !newEvent.date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && !newEvent.date && <p className="text-xs text-red-600 mt-1">Date is required</p>}
                  </div>
                  <div>
                    <Label htmlFor="arrival_time" className={`${hasAttemptedSubmit && !newEvent.arrival_time ? 'text-red-600' : 'text-foreground'}`}>Arrival Time*</Label>
                    <Input
                      id="arrival_time"
                      type="time"
                      value={newEvent.arrival_time}
                      min={isToday(newEvent.date) ? getCurrentTime() : undefined}
                      onChange={(e) => setNewEvent({...newEvent, arrival_time: e.target.value})}
                      className={`${hasAttemptedSubmit && !newEvent.arrival_time ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && !newEvent.arrival_time && <p className="text-xs text-red-600 mt-1">Arrival time is required</p>}
                  </div>
                  <div>
                    <Label htmlFor="estimated_end_time" className={`${hasAttemptedSubmit && (!newEvent.estimated_end_time || (newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time)) ? 'text-red-600' : 'text-foreground'}`}>End Time*</Label>
                    <Input
                      id="estimated_end_time"
                      type="time"
                      value={newEvent.estimated_end_time}
                      min={newEvent.arrival_time || (isToday(newEvent.date) ? getCurrentTime() : undefined)}
                      onChange={(e) => setNewEvent({...newEvent, estimated_end_time: e.target.value})}
                      className={`${hasAttemptedSubmit && (!newEvent.estimated_end_time || (newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time)) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && !newEvent.estimated_end_time && <p className="text-xs text-red-600 mt-1">End time is required</p>}
                    {hasAttemptedSubmit && newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time && <p className="text-xs text-red-600 mt-1">End time must be after arrival time</p>}
                  </div>
                  <div>
                    <Label htmlFor="location" className={`${hasAttemptedSubmit && !selectedAddress ? 'text-red-600' : 'text-foreground'}`}>Location*</Label>
                    <AddressAutocomplete
                      onSelect={(addr) => {
                        setSelectedAddress(addr);
                        setNewEvent({ ...newEvent, location: addr ? addr.formatted : '' });
                      }}
                      placeholder="Search for an address"
                      initialValue={selectedAddress}
                      className={`${hasAttemptedSubmit && !selectedAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && !selectedAddress && <p className="text-xs text-red-600 mt-1">Location is required</p>}
                  </div>
                  <div>
                    <Label htmlFor="max_participants" className={`${hasAttemptedSubmit && parseInt(newEvent.max_participants) < 6 ? 'text-red-600' : 'text-foreground'}`}>Max Volunteers*</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      min="6"
                      value={newEvent.max_participants}
                      onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                      placeholder="Minimum 6 volunteers"
                      className={`${hasAttemptedSubmit && parseInt(newEvent.max_participants) < 6 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && parseInt(newEvent.max_participants) < 6 && <p className="text-xs text-red-600 mt-1">Minimum 6 volunteers required</p>}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <PrimaryButton 
                      onClick={handleCreateEvent}
                      disabled={
                        !newEvent.title ||
                        !newEvent.description ||
                        !newEvent.date ||
                        !newEvent.arrival_time ||
                        !newEvent.estimated_end_time ||
                        !selectedAddress ||
                        parseInt(newEvent.max_participants) < 6 ||
                        newEvent.arrival_time >= newEvent.estimated_end_time
                      }
                      className="flex-1"
                    >
                      Create Opportunity
                    </PrimaryButton>
                    <SecondaryButton onClick={() => {
                      setIsCreateModalOpen(false);
                      setHasAttemptedSubmit(false);
                    }}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't created any opportunities yet.</p>
                <PrimaryButton onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Create Your First Opportunity
                </PrimaryButton>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatEventDate(event.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatEventTimeRange(event.arrival_time, event.estimated_end_time)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.max_participants && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Max {event.max_participants} volunteers
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setChatModalOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Chat
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditModal(event)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Opportunity</DialogTitle>
                <DialogDescription>
                  Update the details for this opportunity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title*</Label>
                  <Input
                    id="edit-title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Opportunity Title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description*</Label>
                  <Textarea
                    id="edit-description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Describe the opportunity"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date*</Label>
                  <Input
                    id="edit-date"
                    type="datetime-local"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-arrival_time">Arrival Time</Label>
                  <Input
                    id="edit-arrival_time"
                    type="datetime-local"
                    value={newEvent.arrival_time}
                    onChange={(e) => setNewEvent({...newEvent, arrival_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-estimated_end_time">Estimated End Time</Label>
                  <Input
                    id="edit-estimated_end_time"
                    type="datetime-local"
                    value={newEvent.estimated_end_time}
                    onChange={(e) => setNewEvent({...newEvent, estimated_end_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <AddressAutocomplete
                    onSelect={(addr) => {
                      setSelectedAddress(addr);
                      setNewEvent({ ...newEvent, location: addr ? addr.formatted : '' });
                    }}
                    placeholder="Search for an address"
                    initialValue={selectedAddress}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max_participants">Max Volunteers</Label>
                  <Input
                    id="edit-max_participants"
                    type="number"
                    value={newEvent.max_participants}
                    onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                    placeholder="Maximum number of volunteers"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <PrimaryButton 
                    onClick={handleEditEvent}
                    disabled={!newEvent.title || !newEvent.description || !newEvent.date || !selectedAddress}
                    className="flex-1"
                  >
                    Update Opportunity
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </SecondaryButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      
      {selectedEvent && (
        <EventChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedEvent(null);
          }}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          organizationId={selectedEvent.organization_id || organization?.id || ''}
        />
      )}

      {/* Safety Guidelines Modal */}
      <SafetyGuidelinesModal
        isOpen={safetyGuidelinesModalOpen}
        onClose={() => {
          setSafetyGuidelinesModalOpen(false);
        }}
        onAccept={handleSafetyGuidelinesAccept}
        userType="organization"
      />
      
      <Footer />
    </div>
  );
};

export default OrganizationDashboard;