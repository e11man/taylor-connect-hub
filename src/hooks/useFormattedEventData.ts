import { useMemo } from "react";
import { formatEventDate, formatEventTime, formatParticipants } from "@/utils/formatEvent";

interface UseFormattedEventDataProps {
  date: string;
  location?: string;
  max_participants?: number;
}

export const useFormattedEventData = (
  event: UseFormattedEventDataProps,
  currentParticipants?: number
) => {
  return useMemo(() => {
    const formattedDate = formatEventDate(event.date);
    const formattedTime = formatEventTime(event.date);
    const formattedLocation = event.location ?? "";

    const formattedParticipants =
      event.max_participants !== undefined &&
      currentParticipants !== undefined
        ? formatParticipants(currentParticipants, event.max_participants)
        : undefined;

    return {
      formattedDate,
      formattedTime,
      formattedLocation,
      formattedParticipants,
    };
  }, [event.date, event.location, event.max_participants, currentParticipants]);
};