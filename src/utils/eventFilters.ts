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
  // Recurrence linkage
  series_id?: string | null;
  occurrence_index?: number | null;
  // New properties for availability
  currentParticipants?: number;
  availableSpots?: number;
  isFull?: boolean;
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
 * Check if an event is full (reached maximum participants)
 */
export const isEventFull = (event: Event): boolean => {
  const currentParticipants = event.currentParticipants || 0;
  const maxParticipants = event.max_participants || 0;
  return maxParticipants > 0 && currentParticipants >= maxParticipants;
};

/**
 * Calculate event availability information
 */
export const calculateEventAvailability = (event: Event): { currentParticipants: number; availableSpots: number; isFull: boolean } => {
  const currentParticipants = event.currentParticipants || 0;
  const maxParticipants = event.max_participants || 0;
  const availableSpots = Math.max(0, maxParticipants - currentParticipants);
  const isFull = maxParticipants > 0 && currentParticipants >= maxParticipants;
  
  return { currentParticipants, availableSpots, isFull };
};

/**
 * Filter events by availability (hide full events by default)
 */
export const filterEventsByAvailability = (events: Event[], showFullEvents: boolean = false): Event[] => {
  if (showFullEvents) {
    return events;
  }
  return events.filter(event => !isEventFull(event));
};

/**
 * Reduce recurring series to only the next upcoming occurrence per series.
 * - When enabled is false, returns input unchanged.
 * - One-time events (no series_id) are preserved as-is.
 */
export const filterNextOccurrencePerSeries = (events: Event[], enabled: boolean = true): Event[] => {
  if (!enabled) return events;

  const now = new Date();
  const bySeries = new Map<string, Event>();
  const result: Event[] = [];

  for (const ev of events) {
    if (!ev.series_id) {
      // One-time event: keep
      result.push(ev);
      continue;
    }
    const key = ev.series_id;
    const current = bySeries.get(key);
    const evDate = new Date(ev.date);
    if (!current) {
      bySeries.set(key, ev);
    } else {
      const currDate = new Date(current.date);
      if (evDate < currDate) {
        bySeries.set(key, ev);
      }
    }
  }

  // Append the chosen next occurrences for each series
  for (const [, ev] of bySeries) {
    result.push(ev);
  }

  // Sort by date ascending for stable display
  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Get events that are ready for cleanup (expired and no chat messages)
 * This is used by the cleanup endpoint
 */
export const getEventsForCleanup = (events: Event[]): Event[] => {
  return events.filter(event => isEventExpired(event));
}; 