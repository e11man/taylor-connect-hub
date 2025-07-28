import { useMemo } from 'react';
import { formatEventDate, formatEventTime, formatEventTimeRange, formatParticipants } from '@/utils/formatEvent';

interface UseFormattedEventDataProps {
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  arrival_time: string | null;
  estimated_end_time: string | null;
}

export const useFormattedEventData = (
  event: UseFormattedEventDataProps,
  currentParticipants?: number
) => {
  return useMemo(() => {
    const formattedDate = formatEventDate(event.date);
    const formattedTimeRange = formatEventTimeRange(event.arrival_time, event.estimated_end_time);
    const formattedLocation = event.location ?? "";

    const formattedParticipants =
      event.max_participants !== undefined &&
      currentParticipants !== undefined
        ? formatParticipants(currentParticipants, event.max_participants)
        : undefined;

    return {
      formattedDate,
      formattedTimeRange,
      formattedLocation,
      formattedParticipants,
    };
  }, [event.date, event.arrival_time, event.estimated_end_time, event.location, event.max_participants, currentParticipants]);
};