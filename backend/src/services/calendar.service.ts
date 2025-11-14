import { prisma, DEFAULT_USER_ID } from '../db/client.js';

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class CalendarService {
  /**
   * Get cached calendar events or fetch from Google if stale
   */
  static async getEvents(userId: string = DEFAULT_USER_ID, forceRefresh: boolean = false) {
    try {
      // Check sync metadata to see if cache is fresh
      const syncMeta = await prisma.syncMetadata.findUnique({
        where: {
          userId_syncType: {
            userId,
            syncType: 'calendar',
          },
        },
      });

      const isCacheStale = !syncMeta ||
        !syncMeta.lastSyncAt ||
        (Date.now() - syncMeta.lastSyncAt.getTime() > CACHE_DURATION_MS);

      // Force refresh or cache is stale
      if (forceRefresh || isCacheStale) {
        console.log('🔄 Refreshing calendar cache from Google API...');
        return await this.refreshCache(userId);
      }

      // Return cached events
      console.log('✅ Serving calendar events from cache');
      const events = await prisma.calendarEvent.findMany({
        where: { userId },
        orderBy: { startTime: 'asc' },
      });

      return events;
    } catch (error: any) {
      console.error('❌ Calendar service error:', error);
      throw error;
    }
  }

  /**
   * Refresh calendar cache from Google Calendar API
   */
  static async refreshCache(userId: string = DEFAULT_USER_ID) {
    try {
      // Fetch from Google Calendar API for a 30-day window centered on today
      const today = new Date();
      const startRange = new Date(today);
      startRange.setDate(startRange.getDate() - 7); // 7 days back
      startRange.setHours(0, 0, 0, 0); // Start of day
      const endRange = new Date(today);
      endRange.setDate(endRange.getDate() + 23); // 23 days ahead -> 30-day window total
      endRange.setHours(23, 59, 59, 999); // End of day

      console.log(`📅 Fetching calendar events from ${startRange.toISOString().split('T')[0]} to ${endRange.toISOString().split('T')[0]}`);

      // Make a SINGLE API call for the entire date range instead of 31 separate calls
      const { google: googleApis, getAuthClient, isAuthenticated } = await import('../auth/google-auth.js');

      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google Calendar');
      }

      const auth = getAuthClient();
      const calendar = googleApis.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startRange.toISOString(),
        timeMax: endRange.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const googleEvents = response.data.items || [];
      console.log(`✅ Fetched ${googleEvents.length} events from Google Calendar in a single request`);

      // Convert to our format
      const result = googleEvents.map(event => ({
        id: event.id || '',
        title: event.summary || 'No Title',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        location: event.location || '',
        description: event.description || '',
      }));
      
      if (!result || !Array.isArray(result)) {
        throw new Error('Invalid response from Google Calendar API');
      }

      // Clear old events
      await prisma.calendarEvent.deleteMany({
        where: { userId },
      });

      // Insert new events - deduplicate first to avoid unique constraint errors
      const uniqueEvents = new Map();
      result.forEach((event: any) => {
        if (!uniqueEvents.has(event.id)) {
          uniqueEvents.set(event.id, event);
        }
      });

      // Normalize and persist (protect against invalid dates)
      const events = await Promise.all(
        Array.from(uniqueEvents.values()).map((event: any) => {
          const startIso = event.start || event.startTime || event.startDate || '';
          const endIso = event.end || event.endTime || event.endDate || '';
          const start = new Date(startIso);
          const end = new Date(endIso);

          return prisma.calendarEvent.upsert({
            where: {
              id: `${userId}_${event.id}`,
            },
            create: {
              id: `${userId}_${event.id}`,
              userId,
              googleEventId: event.id,
              title: event.title || event.summary || 'Untitled Event',
              description: (event.description || null) as any,
              startTime: isNaN(start.getTime()) ? new Date() : start,
              endTime: isNaN(end.getTime()) ? new Date(start.getTime() + 60 * 60 * 1000) : end,
              location: (event.location || null) as any,
              lastSyncedAt: new Date(),
            },
            update: {
              title: event.title || event.summary || 'Untitled Event',
              description: (event.description || null) as any,
              startTime: isNaN(start.getTime()) ? new Date() : start,
              endTime: isNaN(end.getTime()) ? new Date(start.getTime() + 60 * 60 * 1000) : end,
              location: (event.location || null) as any,
              lastSyncedAt: new Date(),
            },
          });
        })
      );

      // Update sync metadata
      await prisma.syncMetadata.upsert({
        where: {
          userId_syncType: {
            userId,
            syncType: 'calendar',
          },
        },
        create: {
          userId,
          syncType: 'calendar',
          lastSyncAt: new Date(),
          syncStatus: 'success',
        },
        update: {
          lastSyncAt: new Date(),
          syncStatus: 'success',
          errorMessage: null,
        },
      });

      console.log(`✅ Cached ${events.length} calendar events`);
      return events;
    } catch (error: any) {
      // Update sync metadata with error
      await prisma.syncMetadata.upsert({
        where: {
          userId_syncType: {
            userId,
            syncType: 'calendar',
          },
        },
        create: {
          userId,
          syncType: 'calendar',
          lastSyncAt: new Date(),
          syncStatus: 'failed',
          errorMessage: error.message,
        },
        update: {
          lastSyncAt: new Date(),
          syncStatus: 'failed',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Get events within a date range
   */
  static async getEventsByDateRange(
    startDate: Date,
    endDate: Date,
    userId: string = DEFAULT_USER_ID
  ) {
    // Ensure cache is fresh
    await this.getEvents(userId);

    return await prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Search for free time slots (still hits Google API as this requires calculation)
   */
  static async findFreeSlots(date: string, duration: number, userId: string = DEFAULT_USER_ID) {
    // This operation still hits the Google API directly since it requires complex calculation
    // But we can optimize by checking cached events first for a quick answer
    const events = await this.getEvents(userId);
    
    // If we have cached events, we can calculate free slots from cache
    // For now, delegate to the tool
    const { findFreeSlotsTool } = await import('../tools/calendar.tool.js');
    return await findFreeSlotsTool.execute({ context: { date, duration } });
  }
}

