export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  // Use abbreviated month and numeric day (e.g., Feb 15)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString);

  // Convert to 12-hour format and omit minutes if they are zero (e.g., 9 AM or 9:30 AM)
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight

  if (minutes === 0) {
    return `${hours} ${period}`;
  }

  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatParticipants = (current: number, max: number): string => {
  return `${current} of ${max}`;
};