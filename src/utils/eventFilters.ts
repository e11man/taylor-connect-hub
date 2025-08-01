/**
 * Event filtering utilities
 */

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  arrival_time: string | null;
  estimated_end_time: string | null;
  location: string | null;
  max_participants: number | null;
  organization_id: string | null;
  image_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if an event should be shown in feeds
 * Events are hidden 12 hours before they start
 */
export const shouldShowEvent = (event: Event): boolean => {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Calculate 12 hours before event
  const twelveHoursBefore = new Date(eventDate.getTime() - 12 * 60 * 60 * 1000);
  
  // Show event if it's less than 12 hours before start time
  return now < twelveHoursBefore;
};

/**
 * Filter events to only show those within 12 hours of starting
 */
export const filterUpcomingEvents = (events: Event[]): Event[] => {
  return events.filter(event => shouldShowEvent(event));
};

/**
 * Check if an event has ended (more than 1 hour after estimated end time)
 */
export const isEventExpired = (event: Event): boolean => {
  if (!event.estimated_end_time) {
    // If no end time, use the event date + 2 hours as fallback
    const eventDate = new Date(event.date);
    const fallbackEndTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
    const oneHourAfter = new Date(fallbackEndTime.getTime() + 60 * 60 * 1000);
    return new Date() > oneHourAfter;
  }
  
  const now = new Date();
  const endTime = new Date(event.estimated_end_time);
  const oneHourAfter = new Date(endTime.getTime() + 60 * 60 * 1000);
  
  return now > oneHourAfter;
};

/**
 * Filter out expired events
 */
export const filterActiveEvents = (events: Event[]): Event[] => {
  return events.filter(event => !isEventExpired(event));
};

/**
 * Get events that are ready for cleanup (expired and no chat messages)
 * This is used by the cleanup endpoint
 */
export const getEventsForCleanup = (events: Event[]): Event[] => {
  return events.filter(event => isEventExpired(event));
}; 