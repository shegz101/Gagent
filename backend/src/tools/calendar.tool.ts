import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { google, getAuthClient, handleApiError, isAuthenticated } from '../auth/google-auth.js';
import { CalendarService } from '../services/calendar.service.js';

/**
 * Tool to list calendar events from CACHE (fast, recommended for general queries)
 * This queries the database cache which contains a 30-day window of events
 */
export const getCalendarEventsCachedTool = createTool({
  id: 'calendar-list-events-cached',
  description: 'List calendar events from cache (fast, includes all events in 30-day window). Use this for general queries about calendar events.',
  inputSchema: z.object({
    startDate: z.string().optional().describe('Filter events after this date (ISO format). If not provided, shows all cached events.'),
    endDate: z.string().optional().describe('Filter events before this date (ISO format). If not provided, shows all cached events.'),
    forceRefresh: z.boolean().optional().default(false).describe('Set to true to refresh cache from Google Calendar before returning results'),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
      location: z.string(),
      description: z.string(),
    })
  ),
  execute: async ({ context }) => {
    try {
      console.log('📅 Fetching calendar events from cache', context.forceRefresh ? '(refreshing)' : '(cached)');
      
      // Get events from cache (or refresh if requested)
      const events = await CalendarService.getEvents(undefined, context.forceRefresh || false);
      
      // Filter by date range if provided
      let filteredEvents = events;
      
      if (context.startDate || context.endDate) {
        const startFilter = context.startDate ? new Date(context.startDate) : new Date(0); // Beginning of time
        const endFilter = context.endDate ? new Date(context.endDate) : new Date('2100-01-01'); // Far future
        
        filteredEvents = events.filter((event: any) => {
          const eventStart = new Date(event.startTime);
          return eventStart >= startFilter && eventStart <= endFilter;
        });
        
        console.log(`📅 Filtered to ${filteredEvents.length} events between ${context.startDate || 'start'} and ${context.endDate || 'end'}`);
      }
      
      console.log(`✅ Returning ${filteredEvents.length} cached calendar events`);
      
      // Format for output
      return filteredEvents.map((event: any) => ({
        id: event.googleEventId || event.id || '',
        title: event.title || 'No Title',
        start: event.startTime ? new Date(event.startTime).toISOString() : '',
        end: event.endTime ? new Date(event.endTime).toISOString() : '',
        location: event.location || '',
        description: event.description || '',
      }));
    } catch (error: any) {
      console.error('❌ Error fetching cached calendar events:', error.message);
      throw error;
    }
  },
});

/**
 * Tool to list calendar events from GOOGLE API directly (slower, for specific date queries)
 * Use this only when you need real-time data for a specific date
 */
export const listEventsTool = createTool({
  id: 'calendar-list-events',
  description: 'List calendar events for a SPECIFIC DATE from Google Calendar API (slower). Only use this when you need real-time data for a particular date. For general queries, use getCalendarEventsCachedTool instead.',
  inputSchema: z.object({
    date: z.string().optional().describe('Date to fetch events for (ISO format)'),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
      location: z.string(),
      description: z.string(),
    })
  ),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const calendar = google.calendar({ version: 'v3', auth });

      // Parse date or use today
      const targetDate = context.date ? new Date(context.date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('📅 Fetching calendar events from Google Calendar API for:', targetDate.toISOString().split('T')[0]);

      // Fetch events from Google Calendar
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      console.log(`✅ Found ${events.length} events from Google Calendar`);

      return events.map(event => ({
        id: event.id || '',
        title: event.summary || 'No Title',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        location: event.location || '',
        description: event.description || '',
      }));
    } catch (error: any) {
      console.error('❌ Error fetching calendar events:', error.message);
      await handleApiError(error);
      throw error;
    }
  },
});

/**
 * Tool to update a calendar event
 */
export const updateEventTool = createTool({
  id: 'calendar-update-event',
  description: 'Update an existing calendar event',
  inputSchema: z.object({
    eventId: z.string().describe('The ID of the event to update'),
    newStart: z.string().optional().describe('New start time (ISO format)'),
    newEnd: z.string().optional().describe('New end time (ISO format)'),
    title: z.string().optional().describe('New title for the event'),
    message: z.string().optional().describe('Message to include with the update'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    event: z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const calendar = google.calendar({ version: 'v3', auth });

      console.log('📝 Updating calendar event:', context.eventId);

      // First, fetch the existing event
      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: context.eventId,
      });

      if (!existingEvent.data) {
        return {
          success: false,
          message: `Event with ID ${context.eventId} not found`,
        };
      }

      // Prepare update data
      const updateData: any = {
        ...existingEvent.data,
      };

      if (context.title) {
        updateData.summary = context.title;
      }

      if (context.newStart) {
        updateData.start = {
          dateTime: new Date(context.newStart).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }

      if (context.newEnd) {
        updateData.end = {
          dateTime: new Date(context.newEnd).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }

      // Update the event
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: context.eventId,
        requestBody: updateData,
      });

      console.log('✅ Event updated successfully');

      // Refresh the calendar cache so the updated event shows up immediately
      try {
        console.log('🔄 Refreshing calendar cache after event update...');
        await CalendarService.refreshCache();
        console.log('✅ Calendar cache refreshed');
      } catch (cacheError) {
        console.error('⚠️ Failed to refresh cache, but event was updated:', cacheError);
      }

      return {
        success: true,
        message: `Event updated successfully${context.message ? ': ' + context.message : ''}`,
        event: {
          id: response.data.id || '',
          title: response.data.summary || '',
          start: response.data.start?.dateTime || response.data.start?.date || '',
          end: response.data.end?.dateTime || response.data.end?.date || '',
        },
      };
    } catch (error: any) {
      console.error('❌ Error updating calendar event:', error.message);
      await handleApiError(error);
      return {
        success: false,
        message: `Failed to update event: ${error.message}`,
      };
    }
  },
});

/**
 * Tool to create a new calendar event
 */
export const createEventTool = createTool({
  id: 'calendar-create-event',
  description: 'Create a new calendar event',
  inputSchema: z.object({
    title: z.string().describe('Event title'),
    start: z.string().describe('Start date and time (ISO format)'),
    end: z.string().describe('End date and time (ISO format)'),
    description: z.string().optional().describe('Event description'),
    location: z.string().optional().describe('Event location'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    event: z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const calendar = google.calendar({ version: 'v3', auth });

      console.log('✨ Creating calendar event:', context.title);

      // Create the event
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: context.title,
          description: context.description,
          location: context.location,
          start: {
            dateTime: new Date(context.start).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: new Date(context.end).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      });

      console.log('✅ Event created successfully:', response.data.id);

      // Refresh the calendar cache so the new event shows up immediately
      try {
        console.log('🔄 Refreshing calendar cache after event creation...');
        await CalendarService.refreshCache();
        console.log('✅ Calendar cache refreshed');
      } catch (cacheError) {
        console.error('⚠️ Failed to refresh cache, but event was created:', cacheError);
      }

      return {
        success: true,
        message: 'Event created successfully',
        event: {
          id: response.data.id || '',
          title: response.data.summary || '',
          start: response.data.start?.dateTime || response.data.start?.date || '',
          end: response.data.end?.dateTime || response.data.end?.date || '',
        },
      };
    } catch (error: any) {
      console.error('❌ Error creating calendar event:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to create event',
      };
    }
  },
});

/**
 * Tool to find free time slots
 */
export const findFreeSlotsTool = createTool({
  id: 'calendar-find-free-slots',
  description: 'Find free time slots in the calendar',
  inputSchema: z.object({
    date: z.string().optional().describe('Date to check (ISO format)'),
    duration: z.number().optional().describe('Required duration in minutes').default(30),
  }),
  outputSchema: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      duration: z.number(),
    })
  ),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const calendar = google.calendar({ version: 'v3', auth });

      // Parse date or use today
      const targetDate = context.date ? new Date(context.date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(8, 0, 0, 0); // Work day starts at 8 AM
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(18, 0, 0, 0); // Work day ends at 6 PM

      console.log('🔍 Finding free slots for:', targetDate.toISOString().split('T')[0], 'duration:', context.duration, 'mins');

      // Fetch events
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      const freeSlots = [];
      const requiredDuration = (context.duration || 30) * 60 * 1000; // Convert to ms

      let currentTime = startOfDay.getTime();

      for (const event of events) {
        const eventStart = new Date(event.start?.dateTime || event.start?.date || '').getTime();
        const eventEnd = new Date(event.end?.dateTime || event.end?.date || '').getTime();

        // Check for gap before this event
        if (eventStart - currentTime >= requiredDuration) {
          freeSlots.push({
            start: new Date(currentTime).toISOString(),
            end: new Date(eventStart).toISOString(),
            duration: Math.floor((eventStart - currentTime) / 60000),
          });
        }

        currentTime = Math.max(currentTime, eventEnd);
      }

      // Check for gap after last event
      if (endOfDay.getTime() - currentTime >= requiredDuration) {
        freeSlots.push({
          start: new Date(currentTime).toISOString(),
          end: endOfDay.toISOString(),
          duration: Math.floor((endOfDay.getTime() - currentTime) / 60000),
        });
      }

      console.log(`✅ Found ${freeSlots.length} free slots`);

      return freeSlots;
    } catch (error: any) {
      console.error('❌ Error finding free slots:', error.message);
      await handleApiError(error);
      throw error;
    }
  },
});
