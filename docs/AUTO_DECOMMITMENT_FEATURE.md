# Automatic Event Decommitment Feature

## Overview

This feature automatically removes user commitments from events that have ended more than 1 hour ago. This is crucial because users are limited to signing up for a maximum of 2 events at a time. Without automatic decommitment, users would remain "stuck" in past events and unable to sign up for new opportunities.

## Important Note About Event Dates

**CRITICAL**: When you see an event like "Test Event" with date "Aug 20", you need to check:
1. What year is it for? (The display only shows month and day)
2. Is that date in the past or future relative to today?

For example:
- If today is August 13, 2025, then "Aug 20" (August 20, 2025) is FUTURE, not past
- If today is August 25, 2025, then "Aug 20" (August 20, 2025) is PAST

The system will only clean up events that are actually in the past!

## How It Works

### Automatic Scheduled Cleanup
- **Frequency**: Runs every hour automatically
- **Startup**: Also runs 5 seconds after server start
- **Function**: `performEventCleanup()` in `server.js`

### Event Detection Logic

The system identifies expired events in two ways:

1. **Events with Specific End Times**: 
   - Events where `estimated_end_time` is set
   - Considered expired if `estimated_end_time` is more than 1 hour in the past

2. **Events with "Time TBD"**:
   - Events where `estimated_end_time` is NULL
   - Considered expired if the event `date` is more than 1 hour in the past
   - These events show "Time TBD" in the UI

### Decommitment Process

1. Identifies all expired events (both types)
2. For each expired event:
   - Checks if there are any active user signups
   - Removes all user commitments from the `user_events` table
   - Logs the action for monitoring

## API Endpoints

### 1. Check Expired Events (GET /api/check-expired-events)
Shows which events are candidates for decommitment without performing any actions.

**Response Example:**
```json
{
  "success": true,
  "currentTime": "2025-08-14T15:00:00.000Z",
  "oneHourAgo": "2025-08-14T14:00:00.000Z",
  "summary": {
    "totalExpiredEvents": 2,
    "eventsWithSpecificEndTime": 1,
    "eventsWithTimeTBD": 1,
    "eventsWithActiveSignups": 2,
    "totalUsersToBeDecommitted": 3
  },
  "eventsWithActiveSignups": [...]
}
```

### 2. Manual Cleanup Trigger (POST /api/cleanup-events)
Manually triggers the cleanup process and returns detailed results.

**Response Example:**
```json
{
  "success": true,
  "message": "User decommitment completed. Decommitted 3 users from 2 expired events.",
  "decommittedUsers": 3,
  "processedEvents": 2,
  "totalExpiredEvents": 2,
  "eventsWithEndTime": 1,
  "eventsWithoutEndTime": 1,
  "eventDetails": [...]
}
```

### 3. Test Cleanup (GET /api/test-cleanup)
Simple endpoint to trigger `performEventCleanup()` for testing purposes.

### 4. Debug Past Events (GET /api/debug-past-events)
Shows detailed information about all events, categorizing them as past/future and whether they need cleanup.

### 5. Force Cleanup (POST /api/force-cleanup) - NEW!
Immediately removes user signups from past events without waiting for the 1-hour grace period.

**Request Body:**
```json
{
  "cleanupAll": true  // Clean all past events
}
// OR
{
  "eventId": "event-uuid-here"  // Clean specific event
}
```

**Use Cases:**
- When you need to immediately free up user slots
- Testing the decommitment functionality
- Manual intervention for special cases

## Monitoring

### Console Logs
The system provides detailed console logging:
- 🔄 Starting scheduled decommitment
- 🔍 Found X expired events
- 👥 Decommitting Y users from event: [Event Name]
- ✅ Successfully decommitted users
- ❌ Error messages if any issues occur

### Log Examples:
```
🔄 Starting scheduled user decommitment from expired events...
🔍 Found 2 expired events to check for signups
   - 1 events with specific end times
   - 1 events with Time TBD
👥 Decommitting 2 users from expired event: Test Event (date: 8/20/2025 (Time TBD))
✅ Successfully decommitted 2 users from event: Test Event
🎉 User decommitment completed. Decommitted 2 users from 1 expired events.
```

## Testing

1. **Check Current Status**: 
   ```bash
   curl http://localhost:3001/api/check-expired-events
   ```

2. **Debug All Events**:
   ```bash
   curl http://localhost:3001/api/debug-past-events
   ```

3. **Trigger Manual Cleanup (with 1-hour grace period)**:
   ```bash
   curl -X POST http://localhost:3001/api/cleanup-events
   ```

4. **Force Immediate Cleanup (no waiting)**:
   ```bash
   # Clean all past events
   curl -X POST http://localhost:3001/api/force-cleanup \
     -H "Content-Type: application/json" \
     -d '{"cleanupAll": true}'
   
   # Clean specific event
   curl -X POST http://localhost:3001/api/force-cleanup \
     -H "Content-Type: application/json" \
     -d '{"eventId": "your-event-id-here"}'
   ```

5. **Test Cleanup Function**:
   ```bash
   curl http://localhost:3001/api/test-cleanup
   ```

## Important Notes

- The 1-hour grace period ensures events have truly ended before decommitting users
- Events without times (Time TBD) are assumed to end at midnight of their date
- The system respects the 2-event limit by freeing up slots for users
- All decommitments are logged for audit purposes
- The cleanup runs automatically, no manual intervention required
- Use the force cleanup endpoint when immediate decommitment is needed

## Error Handling

- Database connection errors are logged but don't crash the server
- Individual event processing errors don't stop the entire cleanup
- All errors are collected and reported in the API responses
- The scheduled job continues running even if one execution fails

## Troubleshooting

If events aren't being cleaned up:
1. Check if the event date is actually in the past (not future)
2. Use `/api/debug-past-events` to see event categorization
3. Check server logs for any error messages
4. Use force cleanup if immediate decommitment is needed