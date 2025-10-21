import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, LogOut, MessageCircle, Clock, Shield, Repeat, FileText } from "lucide-react";
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import SafetyGuidelinesModal from '@/components/modals/SafetyGuidelinesModal';
import OrganizationProfileModal from '@/components/modals/OrganizationProfileModal';
import { filterActiveEvents } from '@/utils/eventFilters';
import { SignupSuccess } from '@/components/ui/SignupSuccess';
import { OrganizationNotificationPreferences } from '@/components/settings/OrganizationNotificationPreferences';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  arrival_time: string | null;
  estimated_end_time: string | null;
  location: string;
  max_participants: number;
  meeting_point?: string | null;
  contact_person?: string | null;
  contact_person_phone?: string | null;
  special_instructions?: string | null;
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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [eventSignupCounts, setEventSignupCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccessVisible, setCreateSuccessVisible] = useState(false);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    arrival_time: '',
    estimated_end_time: '',
    location: '',
    max_participants: '6',
    meeting_point: '',
    contact_person: '',
    contact_person_phone: '',
    special_instructions: ''
  });

  // Mobile-specific touch handling for form inputs
  const handleMobileInputTouch = (e: React.TouchEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    // Ensure proper focus and touch handling on mobile
    e.currentTarget.focus();
    // Prevent default touch behavior that might interfere with input
    e.preventDefault();
  };

  // Function to set default values for new events
  const setDefaultEventValues = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setNewEvent({
      title: '',
      description: '',
      date: tomorrow.toISOString().split('T')[0], // Tomorrow's date
      arrival_time: '09:00', // 9:00 AM
      estimated_end_time: '10:00', // 10:00 AM
      location: '',
      max_participants: '6',
      meeting_point: '',
      contact_person: '',
      contact_person_phone: '',
      special_instructions: ''
    });
  };

  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);
  // Recurrence state
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'one_time'|'weekly'|'biweekly'|'monthly_weekday'|'monthly_date'|'custom_weekdays'>('one_time');
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([]);
  const [recurrenceMonthday, setRecurrenceMonthday] = useState<number | ''>('');
  const [recurrenceWeekNumber, setRecurrenceWeekNumber] = useState<number | ''>('');
  const [recurrenceWeekday, setRecurrenceWeekday] = useState<number | ''>('');
  const [seriesCountLimit, setSeriesCountLimit] = useState<number | ''>('');
  const [seriesEndDate, setSeriesEndDate] = useState<string>('');
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = isMobile ? 4 : 3;

  // Swipe navigation refs
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Draft persistence
  const DRAFT_KEY = 'org_create_opportunity_draft_v1';

  // Step validation
  // Step 1: Basic information (title, description, date, time range)
  const step1Valid = Boolean(
    newEvent.title &&
    newEvent.description &&
    newEvent.date &&
    newEvent.arrival_time &&
    newEvent.estimated_end_time &&
    newEvent.arrival_time < newEvent.estimated_end_time
  );
  // Step 2: Location & capacity
  const step2Valid = Boolean(selectedAddress && parseInt(newEvent.max_participants) >= 6);
  // Step 3: Recurrence (optional)
  const step3Valid = (() => {
    if (!recurrenceOpen || recurrencePattern === 'one_time') return true;
    if (recurrencePattern === 'weekly' || recurrencePattern === 'custom_weekdays') {
      return recurrenceWeekdays.length > 0;
    }
    if (recurrencePattern === 'monthly_date') {
      return Boolean(recurrenceMonthday);
    }
    if (recurrencePattern === 'monthly_weekday') {
      return Boolean(recurrenceWeekNumber) && Boolean(recurrenceWeekday);
    }
    return true;
  })();

  // Ensure recurrence opens when on step 3 (mobile)
  useEffect(() => {
    if (isMobile && currentStep === 3 && !recurrenceOpen) {
      setRecurrenceOpen(true);
    }
  }, [isMobile, currentStep, recurrenceOpen]);

  // Load draft on open
  useEffect(() => {
    if (!isCreateModalOpen) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.newEvent) setNewEvent(parsed.newEvent);
        if (parsed.selectedAddress) setSelectedAddress(parsed.selectedAddress);
        if (parsed.recurrence !== undefined) {
          setRecurrenceOpen(Boolean(parsed.recurrence.recurrenceOpen));
          if (parsed.recurrence.recurrencePattern) setRecurrencePattern(parsed.recurrence.recurrencePattern);
          if (parsed.recurrence.recurrenceWeekdays) setRecurrenceWeekdays(parsed.recurrence.recurrenceWeekdays);
          if (parsed.recurrence.recurrenceMonthday !== undefined) setRecurrenceMonthday(parsed.recurrence.recurrenceMonthday);
          if (parsed.recurrence.recurrenceWeekNumber !== undefined) setRecurrenceWeekNumber(parsed.recurrence.recurrenceWeekNumber);
          if (parsed.recurrence.recurrenceWeekday !== undefined) setRecurrenceWeekday(parsed.recurrence.recurrenceWeekday);
          if (parsed.recurrence.seriesCountLimit !== undefined) setSeriesCountLimit(parsed.recurrence.seriesCountLimit);
          if (parsed.recurrence.seriesEndDate !== undefined) setSeriesEndDate(parsed.recurrence.seriesEndDate);
        }
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      } else {
        // No saved draft, set default values
        setDefaultEventValues();
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      // Fallback to default values
      setDefaultEventValues();
    }
  }, [isCreateModalOpen]);

  // Save draft whenever fields change while open
  useEffect(() => {
    if (!isCreateModalOpen) return;
    const payload = {
      newEvent,
      selectedAddress,
      recurrence: {
        recurrenceOpen,
        recurrencePattern,
        recurrenceWeekdays,
        recurrenceMonthday,
        recurrenceWeekNumber,
        recurrenceWeekday,
        seriesCountLimit,
        seriesEndDate,
      },
      currentStep,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {}
  }, [isCreateModalOpen, newEvent, selectedAddress, recurrenceOpen, recurrencePattern, recurrenceWeekdays, recurrenceMonthday, recurrenceWeekNumber, recurrenceWeekday, seriesCountLimit, seriesEndDate, currentStep]);

  // Keyboard navigation (Enter to advance, Escape to go back)
  useEffect(() => {
    if (!isCreateModalOpen || !isMobile) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextarea = target && target.tagName === 'TEXTAREA';
      if (e.key === 'Enter' && !isTextarea) {
        e.preventDefault();
        if (currentStep < totalSteps) {
          // validate current step
          if ((currentStep === 1 && !step1Valid) || (currentStep === 2 && !step2Valid) || (currentStep === 3 && !step3Valid)) {
            setHasAttemptedSubmit(true);
            return;
          }
          setCurrentStep(currentStep + 1);
        } else {
          handleCreateEvent();
        }
      }
      if (e.key === 'Escape') {
        if (currentStep > 1) {
          setCurrentStep(currentStep - 1);
        } else {
          setIsCreateModalOpen(false);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isCreateModalOpen, isMobile, currentStep, totalSteps, step1Valid, step2Valid, step3Valid]);

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
      console.log('Organization data:', orgData);

      // Get organization's events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      } else {
        // For organization dashboard, show all events (not filtered by 12-hour rule)
        // Only filter out expired events
        console.log('Raw events data:', eventsData);
        const filteredData = filterActiveEvents(eventsData || []);
        console.log('Filtered events data:', filteredData);
        setEvents(filteredData);
      }

      // Fetch signup counts for the events
      await fetchEventSignupCounts();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventSignupCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('event_id');

      if (error) {
        console.error('Error fetching signup counts:', error);
      } else {
        const counts = data?.reduce((acc: Record<string, number>, curr) => {
          acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
          return acc;
        }, {}) || {};
        setEventSignupCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching signup counts:', error);
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
      setIsSubmitting(true);
      // Create proper datetime strings in local timezone, then convert to ISO for storage
      const eventDateTime = new Date(`${newEvent.date}T${newEvent.arrival_time}:00`);
      const arrivalDateTime = new Date(`${newEvent.date}T${newEvent.arrival_time}:00`);
      const endDateTime = new Date(`${newEvent.date}T${newEvent.estimated_end_time}:00`);
      
      // Convert to ISO strings for database storage (this preserves the local time as UTC)
      const eventDate = eventDateTime.toISOString();
      const arrivalTime = arrivalDateTime.toISOString();
      const endTime = endDateTime.toISOString();

      let createdEventOrSeries: any = null;

      if (recurrenceOpen && recurrencePattern !== 'one_time') {
        // Use RPC to create a series and its occurrences
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'create_event_series_and_occurrences',
          {
            p_organization_id: organization.id,
            p_title: newEvent.title,
            p_description: newEvent.description,
            p_timezone: 'America/New_York',
            p_pattern: recurrencePattern,
            p_interval: recurrencePattern === 'biweekly' ? 2 : 1,
            p_weekdays: (recurrencePattern === 'weekly' || recurrencePattern === 'custom_weekdays' || recurrencePattern === 'biweekly') ? recurrenceWeekdays : null,
            p_monthday: recurrencePattern === 'monthly_date' ? (recurrenceMonthday || null) : null,
            p_weeknumber: recurrencePattern === 'monthly_weekday' ? (recurrenceWeekNumber || null) : null,
            p_weekday: recurrencePattern === 'monthly_weekday' ? (recurrenceWeekday || null) : null,
            p_start_date: newEvent.date,
            p_end_by_date: seriesEndDate || null,
            p_count_limit: seriesCountLimit || null,
            p_start_time: newEvent.arrival_time,
            p_end_time: newEvent.estimated_end_time,
            p_location: selectedAddress?.formatted || newEvent.location || null,
            p_max_participants: parseInt(newEvent.max_participants) || null,
            p_rrule: null,
            p_rdates: null,
            p_exdates: null,
          }
        );
        if (rpcError) {
          console.error('RPC create series error:', rpcError);
          throw rpcError;
        }
        createdEventOrSeries = rpcData;
      } else {
        // Single event
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
            meeting_point: newEvent.meeting_point || null,
            contact_person: newEvent.contact_person || null,
            contact_person_phone: newEvent.contact_person_phone || null,
            special_instructions: newEvent.special_instructions || null,
            organization_id: organization.id
          }])
          .select()
          .single();
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        createdEventOrSeries = data;
      }

      // Refresh list from server to include occurrences
      await fetchOrganizationData();
      setIsCreateModalOpen(false);
      setSafetyGuidelinesModalOpen(false);
      setNewEvent({ title: '', description: '', date: '', arrival_time: '', estimated_end_time: '', location: '', max_participants: '6' });
      setSelectedAddress(null); // Clear selected address after creation
      setHasAttemptedSubmit(false);
      setCurrentStep(1);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      
      toast({
        title: "Success!",
        description: "Event created successfully.",
      });
      setCreateSuccessVisible(true);
      setTimeout(() => setCreateSuccessVisible(false), 2200);
      
      // Trigger refresh in other components
      refreshEvents();
      // Refresh signup counts
      fetchEventSignupCounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;

    try {
      // Create proper datetime objects in local timezone
      const baseDate = new Date(`${newEvent.date}T00:00:00`);
      const arrivalDateTime = newEvent.arrival_time ? 
        new Date(`${newEvent.date}T${newEvent.arrival_time}:00`) : null;
      const endDateTime = newEvent.estimated_end_time ? 
        new Date(`${newEvent.date}T${newEvent.estimated_end_time}:00`) : null;

      const { data, error } = await supabase
        .from('events')
        .update({
          title: newEvent.title,
          description: newEvent.description,
          date: baseDate.toISOString(),
          arrival_time: arrivalDateTime?.toISOString() || null,
          estimated_end_time: endDateTime?.toISOString() || null,
          location: selectedAddress?.formatted || newEvent.location || null,
          max_participants: parseInt(newEvent.max_participants) || null,
          meeting_point: newEvent.meeting_point || null,
          contact_person: newEvent.contact_person || null,
          contact_person_phone: newEvent.contact_person_phone || null,
          special_instructions: newEvent.special_instructions || null,
        })
        .eq('id', editingEvent.id)
        .select()
        .single();

      if (error) throw error;

      setEvents(events.map(event => event.id === editingEvent.id ? data : event));
      setIsEditModalOpen(false);
      setEditingEvent(null);
              setNewEvent({ title: '', description: '', date: '', arrival_time: '', estimated_end_time: '', location: '', max_participants: '', meeting_point: '', contact_person: '', contact_person_phone: '', special_instructions: '' });
      setSelectedAddress(null); // Clear selected address after update
      
      toast({
        title: "Success!",
        description: "Event updated successfully.",
      });
      
      // Trigger refresh in other components
      refreshEvents();
      // Refresh signup counts
      fetchEventSignupCounts();
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
      // Refresh signup counts
      fetchEventSignupCounts();
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
    
    // Convert stored UTC timestamps back to local time for form inputs
    const eventDate = new Date(event.date);
    const arrivalTime = event.arrival_time ? new Date(event.arrival_time) : null;
    const endTime = event.estimated_end_time ? new Date(event.estimated_end_time) : null;
    
    setNewEvent({
      title: event.title,
      description: event.description || '',
      date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD format for date input
      arrival_time: arrivalTime ? 
        `${arrivalTime.getHours().toString().padStart(2, '0')}:${arrivalTime.getMinutes().toString().padStart(2, '0')}` : '', // HH:MM format in local time
      estimated_end_time: endTime ? 
        `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}` : '', // HH:MM format in local time
      location: event.location || '',
      max_participants: event.max_participants?.toString() || '',
      meeting_point: event.meeting_point || '',
      contact_person: event.contact_person || '',
      contact_person_phone: event.contact_person_phone || '',
      special_instructions: event.special_instructions || ''
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Organization Information</CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm text-muted-foreground">{organization.description || 'No description provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Website</Label>
                <p className="text-sm text-muted-foreground">{organization.website || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Phone</Label>
                <p className="text-sm text-muted-foreground">{organization.phone || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Contact Email</Label>
                <p className="text-sm text-muted-foreground">{organization.contact_email}</p>
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
                setCurrentStep(1);
                setNewEvent({ title: '', description: '', date: '', arrival_time: '', estimated_end_time: '', location: '', max_participants: '6', meeting_point: '', contact_person: '', contact_person_phone: '', special_instructions: '' });
                setSelectedAddress(null);
                setRecurrenceOpen(false);
                setRecurrencePattern('one_time');
                setRecurrenceWeekdays([]);
                setRecurrenceMonthday('');
                setRecurrenceWeekNumber('');
                setRecurrenceWeekday('');
                setSeriesCountLimit('');
                setSeriesEndDate('');
                try { localStorage.removeItem(DRAFT_KEY); } catch {}
              }
            }}>
              <DialogTrigger asChild>
                <PrimaryButton>
                  <Plus className="w-4 h-4" />
                  Add New Opportunity
                </PrimaryButton>
              </DialogTrigger>
              <DialogContent className={`w-full mobile-modal ${isMobile ? 'max-w-sm max-h-[90vh]' : 'max-w-md'}`}>
                <DialogHeader>
                  <DialogTitle>Create New Opportunity</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new volunteer opportunity.
                  </DialogDescription>
                </DialogHeader>
                <div
                  className="space-y-4 pb-24 overflow-y-auto max-h-[calc(90vh-120px)] mobile-form"
                  onTouchStart={(e) => {
                    if (!isMobile) return;
                    touchStartXRef.current = e.changedTouches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    if (!isMobile) return;
                    touchEndXRef.current = e.changedTouches[0].clientX;
                    const start = touchStartXRef.current;
                    const end = touchEndXRef.current;
                    if (start == null || end == null) return;
                    const delta = end - start;
                    const threshold = 50; // px
                    if (delta < -threshold && currentStep < totalSteps) {
                      // swipe left -> next
                      if ((currentStep === 1 && !step1Valid) || (currentStep === 2 && !step2Valid) || (currentStep === 3 && !step3Valid)) {
                        setHasAttemptedSubmit(true);
                      } else {
                        setCurrentStep(currentStep + 1);
                      }
                    }
                    if (delta > threshold && currentStep > 1) {
                      // swipe right -> back
                      setCurrentStep(currentStep - 1);
                    }
                    touchStartXRef.current = null;
                    touchEndXRef.current = null;
                  }}
                >
                  {/* Stepper (mobile-first) */}
                  {isMobile && (
                    <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                      <span>Step {currentStep} of {totalSteps}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                          <span key={i} className={`h-1.5 w-6 rounded ${i + 1 <= currentStep ? 'bg-[#00AFCE]' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                  {isMobile && (
                    <div className="flex items-center gap-2 font-semibold text-base">
                      {currentStep === 1 && <><FileText className="w-4 h-4" /> Basic Information</>}
                      {currentStep === 2 && <><MapPin className="w-4 h-4" /> Location & Volunteers</>}
                      {currentStep === 3 && <><Repeat className="w-4 h-4" /> Recurrence Options</>}
                      {currentStep === 4 && <><Shield className="w-4 h-4" /> Review & Create</>}
                    </div>
                  )}
                  {(!isMobile || currentStep === 1) && (
                  <div>
                    <Label htmlFor="title" className={`${hasAttemptedSubmit && !newEvent.title ? 'text-red-600' : 'text-foreground'}`}>Title*</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      onTouchStart={handleMobileInputTouch}
                      placeholder="Opportunity Title"
                      className={`${hasAttemptedSubmit && !newEvent.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} h-11`}
                    />
                    {hasAttemptedSubmit && !newEvent.title && <p className="text-xs text-red-600 mt-1">Title is required</p>}
                  </div>
                  )}
                  {(!isMobile || currentStep === 1) && (
                  <div>
                    <Label htmlFor="description" className={`${hasAttemptedSubmit && !newEvent.description ? 'text-red-600' : 'text-foreground'}`}>Description*</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      onTouchStart={handleMobileInputTouch}
                      placeholder="Describe the opportunity"
                      rows={4}
                      className={`${hasAttemptedSubmit && !newEvent.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {hasAttemptedSubmit && !newEvent.description && <p className="text-xs text-red-600 mt-1">Description is required</p>}
                  </div>
                  )}
                  {(!isMobile || currentStep === 1) && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date" className={`${hasAttemptedSubmit && !newEvent.date ? 'text-red-600' : 'text-foreground'}`}>Date*</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newEvent.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                          onTouchStart={handleMobileInputTouch}
                          className={`${hasAttemptedSubmit && !newEvent.date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} h-11`}
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
                          onTouchStart={handleMobileInputTouch}
                          className={`${hasAttemptedSubmit && !newEvent.arrival_time ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} h-11`}
                        />
                        {hasAttemptedSubmit && !newEvent.arrival_time && <p className="text-xs text-red-600 mt-1">Arrival time is required</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="estimated_end_time" className={`${hasAttemptedSubmit && (!newEvent.estimated_end_time || (newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time)) ? 'text-red-600' : 'text-foreground'}`}>End Time*</Label>
                        <Input
                          id="estimated_end_time"
                          type="time"
                          value={newEvent.estimated_end_time}
                          min={newEvent.arrival_time || (isToday(newEvent.date) ? getCurrentTime() : undefined)}
                          onChange={(e) => setNewEvent({...newEvent, estimated_end_time: e.target.value})}
                          onTouchStart={handleMobileInputTouch}
                          className={`${hasAttemptedSubmit && (!newEvent.estimated_end_time || (newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time)) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} h-11`}
                        />
                        {hasAttemptedSubmit && !newEvent.estimated_end_time && <p className="text-xs text-red-600 mt-1">End time is required</p>}
                        {hasAttemptedSubmit && newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time && <p className="text-xs text-red-600 mt-1">End time must be after arrival time</p>}
                      </div>
                    </div>
                  )}
                  {(!isMobile || currentStep === 2) && (
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
                  )}
                  {(!isMobile || currentStep === 2) && (
                  <div>
                    <Label htmlFor="max_participants" className={`${hasAttemptedSubmit && parseInt(newEvent.max_participants) < 6 ? 'text-red-600' : 'text-foreground'}`}>Max Volunteers*</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      min="6"
                      value={newEvent.max_participants}
                      onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                      onTouchStart={handleMobileInputTouch}
                      placeholder="Minimum 6 volunteers"
                      className={`${hasAttemptedSubmit && parseInt(newEvent.max_participants) < 6 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} h-11`}
                    />
                    {hasAttemptedSubmit && parseInt(newEvent.max_participants) < 6 && <p className="text-xs text-red-600 mt-1">Minimum 6 volunteers required</p>}
                  </div>
                  )}
                  
                  {/* Optional Event Fields */}
                  {(!isMobile || currentStep === 2) && (
                  <div className="space-y-4 border border-border-color rounded-lg p-4">
                    <h3 className="font-semibold text-sm text-foreground">Optional Details</h3>
                    
                    {/* Meeting Point */}
                    <div>
                      <Label htmlFor="meeting_point">Meeting Point</Label>
                      <Input
                        id="meeting_point"
                        type="text"
                        value={newEvent.meeting_point}
                        onChange={(e) => setNewEvent({ ...newEvent, meeting_point: e.target.value })}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="e.g., Door 6, Main Entrance"
                        className="h-11"
                      />
                    </div>

                    {/* Contact Person */}
                    <div>
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        type="text"
                        value={newEvent.contact_person}
                        onChange={(e) => setNewEvent({ ...newEvent, contact_person: e.target.value })}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="e.g., John Smith"
                        className="h-11"
                      />
                    </div>

                    {/* Contact Person Phone */}
                    <div>
                      <Label htmlFor="contact_person_phone">Contact Person Phone</Label>
                      <Input
                        id="contact_person_phone"
                        type="tel"
                        value={newEvent.contact_person_phone}
                        onChange={(e) => setNewEvent({ ...newEvent, contact_person_phone: e.target.value })}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="e.g., (555) 123-4567"
                        className="h-11"
                      />
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <Label htmlFor="special_instructions">Special Instructions</Label>
                      <Textarea
                        id="special_instructions"
                        value={newEvent.special_instructions}
                        onChange={(e) => setNewEvent({ ...newEvent, special_instructions: e.target.value })}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="e.g., Bring water bottle, wear comfortable shoes"
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  )}
                  
                  {/* Recurrence Section (Step 3 on mobile; optional) */}
                  <div className={`border border-border-color rounded-lg ${isMobile && currentStep !== 3 ? 'hidden' : ''}`}>
                    <button type="button" className="w-full text-left px-4 py-3 flex items-center justify-between" onClick={() => setRecurrenceOpen(!recurrenceOpen)}>
                      <span className="font-semibold">Recurrence (optional)</span>
                      <span className="text-sm text-muted-foreground">{recurrenceOpen ? 'Hide' : 'Show'}</span>
                    </button>
                    {recurrenceOpen && (
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <Label className="text-sm">Pattern</Label>
                          <Select value={recurrencePattern} onValueChange={(v) => setRecurrencePattern(v as any)}>
                            <SelectTrigger className="w-full mt-1">
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="one_time">One-time</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Biweekly</SelectItem>
                              <SelectItem value="monthly_date">Monthly (by date)</SelectItem>
                              <SelectItem value="monthly_weekday">Monthly (by weekday)</SelectItem>
                              <SelectItem value="custom_weekdays">Custom weekdays</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {(recurrencePattern === 'custom_weekdays' || recurrencePattern === 'weekly') && (
                          <div>
                            <Label className="text-sm">Weekdays</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {[0,1,2,3,4,5,6].map((d) => (
                                <label key={d} className="flex items-center gap-2 text-sm">
                                  <Checkbox checked={recurrenceWeekdays.includes(d)} onCheckedChange={(c) => {
                                    setRecurrenceWeekdays((prev) => c ? Array.from(new Set([...prev, d])) : prev.filter(x => x !== d));
                                  }} />
                                  <span>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {recurrencePattern === 'monthly_date' && (
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-sm">Day of month</Label>
                              <Input type="number" min={1} max={31} value={recurrenceMonthday as any} onChange={(e) => setRecurrenceMonthday(Number(e.target.value) || '')} />
                            </div>
                          </div>
                        )}
                        {recurrencePattern === 'monthly_weekday' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Which</Label>
                              <Select value={String(recurrenceWeekNumber)} onValueChange={(v) => setRecurrenceWeekNumber(Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1st</SelectItem>
                                  <SelectItem value="2">2nd</SelectItem>
                                  <SelectItem value="3">3rd</SelectItem>
                                  <SelectItem value="4">4th</SelectItem>
                                  <SelectItem value="-1">Last</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Weekday</Label>
                              <Select value={String(recurrenceWeekday)} onValueChange={(v) => setRecurrenceWeekday(Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Weekday" /></SelectTrigger>
                                <SelectContent>
                                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((n, i) => (
                                    <SelectItem key={i} value={String(i)}>{n}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">End by date</Label>
                            <Input type="date" value={seriesEndDate} min={newEvent.date || undefined} onChange={(e) => setSeriesEndDate(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-sm">Or number of occurrences (max 52)</Label>
                            <Input type="number" min={1} max={52} value={seriesCountLimit as any} onChange={(e) => setSeriesCountLimit(Number(e.target.value) || '')} />
                          </div>
                        </div>
                        {isMobile && (
                          <div className="pt-2">
                            <SecondaryButton
                              onClick={() => {
                                setRecurrencePattern('one_time');
                                setRecurrenceOpen(false);
                                setCurrentStep(4);
                              }}
                              className="w-full"
                            >
                              Skip Recurrence
                            </SecondaryButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Review & Create (Step 4 on mobile) */}
                  {isMobile && currentStep === 4 && (
                    <div className="space-y-3">
                      <div className="border rounded-md p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-primary font-semibold"><FileText className="w-4 h-4" /> Summary</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2"><FileText className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">Title</div><div className="text-muted-foreground">{newEvent.title || '-'}
                          </div></div></div>
                          <div className="flex items-start gap-2"><FileText className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">Description</div><div className="text-muted-foreground whitespace-pre-wrap">{newEvent.description || '-'}</div></div></div>
                          <div className="flex items-start gap-2"><Calendar className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">Date</div><div className="text-muted-foreground">{newEvent.date || '-'}</div></div></div>
                          <div className="flex items-start gap-2"><Clock className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">Time</div><div className="text-muted-foreground">{newEvent.arrival_time && newEvent.estimated_end_time ? `${newEvent.arrival_time} - ${newEvent.estimated_end_time}` : '-'}</div></div></div>
                          <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">Location</div><div className="text-muted-foreground">{selectedAddress?.formatted || '-'}</div></div></div>
                          <div className="flex items-start gap-2"><Users className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">Max Volunteers</div><div className="text-muted-foreground">{newEvent.max_participants || '-'}</div></div></div>
                          <div className="flex items-start gap-2"><Repeat className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">Recurrence</div><div className="text-muted-foreground capitalize">{recurrencePattern.replace('_', ' ')}</div></div></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`flex gap-2 pt-4 ${isMobile ? 'sticky bottom-0 left-0 right-0 px-4 py-3 bg-white border-t z-10' : 'md:static md:px-0 md:bg-transparent'}`}>
                    {isMobile && (
                      <SecondaryButton
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                        className="flex-1 min-h-[44px] mobile-button-fix mobile-touch-fix"
                      >
                        Back
                      </SecondaryButton>
                    )}
                    <PrimaryButton 
                      onClick={() => {
                        if (isMobile && currentStep < totalSteps) {
                          // Guard rails: Only advance if step is valid
                          if ((currentStep === 1 && !step1Valid) || (currentStep === 2 && !step2Valid) || (currentStep === 3 && !step3Valid)) {
                            setHasAttemptedSubmit(true);
                            return;
                          }
                          setCurrentStep(currentStep + 1);
                          return;
                        }
                        handleCreateEvent();
                      }}
                      disabled={
                        (!isMobile && (
                          !newEvent.title ||
                          !newEvent.description ||
                          !newEvent.date ||
                          !newEvent.arrival_time ||
                          !newEvent.estimated_end_time ||
                          !selectedAddress ||
                          parseInt(newEvent.max_participants) < 6 ||
                          newEvent.arrival_time >= newEvent.estimated_end_time
                        )) || isSubmitting
                      }
                      className="flex-1 min-h-[44px] active:scale-[0.98] mobile-button-fix mobile-touch-fix"
                    >
                      {isSubmitting ? 'Creating...' : (isMobile && currentStep < totalSteps ? 'Next' : 'Create Opportunity')}
                    </PrimaryButton>
                    <SecondaryButton onClick={() => {
                      setIsCreateModalOpen(false);
                      setHasAttemptedSubmit(false);
                      setCurrentStep(1);
                    }} className="mobile-button-fix mobile-touch-fix">
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
                          {eventSignupCounts[event.id] || 0} / {event.max_participants} volunteers
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

          {/* Notification Settings Section */}
          <div className="mt-12">
            <OrganizationNotificationPreferences />
          </div>

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-md max-h-[90vh] mobile-modal">
              <DialogHeader>
                <DialogTitle>Edit Opportunity</DialogTitle>
                <DialogDescription>
                  Update the details for this opportunity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pb-24 overflow-y-auto max-h-[calc(90vh-120px)] mobile-form">
                {/* Current values are prefilled directly in the form */}
                
                <div>
                  <Label className="text-sm font-medium">Basic Information</Label>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="edit-title">Title*</Label>
                      <Input
                        id="edit-title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="Opportunity Title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description*</Label>
                      <Textarea
                        id="edit-description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="Describe the opportunity"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="edit-date">Date*</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                        onTouchStart={handleMobileInputTouch}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground mt-1">The date when this opportunity takes place</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time Details</Label>
                  <div className="bg-light-gray border border-border-color rounded-lg p-3 mb-3">
                    <p className="text-xs text-muted-foreground">
                      📋 Both arrival time and end time must be set together, or leave both empty.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="edit-arrival_time" className="text-xs">Arrival Time</Label>
                      <Input
                        id="edit-arrival_time"
                        type="time"
                        value={newEvent.arrival_time}
                        onChange={(e) => setNewEvent({...newEvent, arrival_time: e.target.value})}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="09:00"
                        min={newEvent.date === new Date().toISOString().split('T')[0] ? getCurrentTime() : undefined}
                      />
                      <p className="text-xs text-muted-foreground mt-1">When volunteers should arrive</p>
                    </div>
                    <div>
                      <Label htmlFor="edit-estimated_end_time" className="text-xs">End Time</Label>
                      <Input
                        id="edit-estimated_end_time"
                        type="time"
                        value={newEvent.estimated_end_time}
                        onChange={(e) => setNewEvent({...newEvent, estimated_end_time: e.target.value})}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="17:00"
                        min={newEvent.arrival_time || undefined}
                      />
                      <p className="text-xs text-muted-foreground mt-1">When the opportunity ends</p>
                      {newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time && (
                        <p className="text-xs text-red-600 mt-1">⚠️ End time must be after arrival time</p>
                      )}
                      {((newEvent.arrival_time && !newEvent.estimated_end_time) || (!newEvent.arrival_time && newEvent.estimated_end_time)) && (
                        <p className="text-xs text-red-600 mt-1">⚠️ Both arrival time and end time must be set together</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location & Capacity</Label>
                  <div className="space-y-4 mt-2">
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
                      <p className="text-xs text-muted-foreground mt-1">Search and select a location from the dropdown</p>
                    </div>
                    <div>
                      <Label htmlFor="edit-max_participants">Max Volunteers</Label>
                      <Input
                        id="edit-max_participants"
                        type="number"
                        value={newEvent.max_participants}
                        onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                        onTouchStart={handleMobileInputTouch}
                        placeholder="Maximum number of volunteers"
                        min="6"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Minimum 6 volunteers required</p>
                    </div>
                  </div>
                </div>
                
                {/* Optional Event Fields for Edit Modal */}
                <div className="space-y-4 border border-border-color rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-foreground">Optional Details</h3>
                  
                  {/* Meeting Point */}
                  <div>
                    <Label htmlFor="edit-meeting_point">Meeting Point</Label>
                    <Input
                      id="edit-meeting_point"
                      type="text"
                      value={newEvent.meeting_point}
                      onChange={(e) => setNewEvent({ ...newEvent, meeting_point: e.target.value })}
                      onTouchStart={handleMobileInputTouch}
                      placeholder="e.g., Door 6, Main Entrance"
                    />
                  </div>

                  {/* Contact Person */}
                  <div>
                    <Label htmlFor="edit-contact_person">Contact Person</Label>
                    <Input
                      id="edit-contact_person"
                      type="text"
                      value={newEvent.contact_person}
                      onChange={(e) => setNewEvent({ ...newEvent, contact_person: e.target.value })}
                      onTouchStart={handleMobileInputTouch}
                      placeholder="e.g., John Smith"
                    />
                  </div>

                  {/* Contact Person Phone */}
                  <div>
                    <Label htmlFor="edit-contact_person_phone">Contact Person Phone</Label>
                    <Input
                      id="edit-contact_person_phone"
                      type="tel"
                      value={newEvent.contact_person_phone}
                      onChange={(e) => setNewEvent({ ...newEvent, contact_person_phone: e.target.value })}
                      onTouchStart={handleMobileInputTouch}
                      placeholder="e.g., (555) 123-4567"
                    />
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <Label htmlFor="edit-special_instructions">Special Instructions</Label>
                    <Textarea
                      id="edit-special_instructions"
                      value={newEvent.special_instructions}
                      onChange={(e) => setNewEvent({ ...newEvent, special_instructions: e.target.value })}
                      onTouchStart={handleMobileInputTouch}
                      placeholder="e.g., Bring water bottle, wear comfortable shoes"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <PrimaryButton 
                    onClick={handleEditEvent}
                    disabled={
                      !newEvent.title || 
                      !newEvent.description || 
                      !newEvent.date || 
                      !selectedAddress ||
                      (newEvent.arrival_time && newEvent.estimated_end_time && newEvent.arrival_time >= newEvent.estimated_end_time) ||
                      (newEvent.arrival_time && !newEvent.estimated_end_time) ||
                      (!newEvent.arrival_time && newEvent.estimated_end_time)
                    }
                    className="flex-1 mobile-button-fix mobile-touch-fix"
                  >
                    Update Opportunity
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setIsEditModalOpen(false)} className="mobile-button-fix mobile-touch-fix">
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

      {/* Organization Profile Edit Modal */}
      <OrganizationProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        organization={organization}
        onUpdate={(updatedOrg) => {
          setOrganization(updatedOrg);
        }}
      />
      <SignupSuccess 
        visible={createSuccessVisible}
        title="Opportunity Created"
        description="Your opportunity is now visible to volunteers."
      />
      
      <Footer />
    </div>
  );
};

export default OrganizationDashboard;