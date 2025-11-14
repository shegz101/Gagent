import { prisma, DEFAULT_USER_ID } from '../db/client.js';
import { getUnreadEmailsTool } from '../tools/email.tool.js';
import { EmailPriorityService } from './email-priority.service.js';

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHED_EMAILS = 500;

export class EmailService {
  /**
   * Get emails with filtering options
   */
  static async getEmails(options: {
    unreadOnly?: boolean;
    priority?: string;
    forceRefresh?: boolean;
    userId?: string;
  } = {}) {
    const { unreadOnly = false, priority, forceRefresh = false, userId = DEFAULT_USER_ID } = options;

    try {
      // Check and refresh cache if needed
      const shouldRefresh = await this.shouldRefreshCache(userId, forceRefresh);
      if (shouldRefresh) {
        console.log('🔄 Refreshing email cache from Gmail API...');
        await this.refreshCache(userId);
      }

      // Build filter conditions
      const where: any = { userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      // Get emails from cache
      console.log('✅ Serving emails from cache');
      let emails = await prisma.email.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: 100,
      });

      // Apply AI priority filtering if requested
      if (priority && priority !== 'all') {
        console.log(`🤖 Filtering emails by priority: ${priority}`);
        emails = emails.filter((email: any) => {
          const analyzedPriority = EmailPriorityService.analyzePriority({
            id: email.gmailMessageId,
            subject: email.subject,
            sender: email.sender,
            senderName: email.senderName || '',
            snippet: email.snippet || '',
            bodyText: email.bodyText || '',
          });
          return analyzedPriority === priority;
        });
      }

      // Add priority analysis to all emails
      const emailsWithPriority = emails.map((email: any) => {
        const analyzedPriority = EmailPriorityService.analyzePriority({
          id: email.gmailMessageId,
          subject: email.subject,
          sender: email.sender,
          senderName: email.senderName || '',
          snippet: email.snippet || '',
          bodyText: email.bodyText || '',
        });

        // Better fallback for sender name: use email address without domain if no sender name
        let displaySenderName = email.senderName;
        if (!displaySenderName || displaySenderName === 'Unknown') {
          // Extract name from email like "noreply@apple.com" -> "noreply"
          displaySenderName = email.sender?.split('@')[0] || 'Unknown';
        }

        return {
          id: email.gmailMessageId,
          subject: email.subject,
          sender: email.sender,
          senderName: displaySenderName,
          snippet: email.snippet || '',
          bodyText: email.bodyText || '',
          receivedAt: email.receivedAt.toISOString(),
          priority: analyzedPriority,
          isRead: email.isRead,
          labels: email.labels,
        };
      });

      return emailsWithPriority;
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      throw error;
    }
  }

  /**
   * Get a single email by ID with full details
   */
  static async getEmailById(emailId: string, userId: string = DEFAULT_USER_ID) {
    try {
      const email = await prisma.email.findFirst({
        where: {
          gmailMessageId: emailId,
          userId,
        },
      });

      if (!email) {
        throw new Error('Email not found');
      }

      // Analyze priority
      const analyzedPriority = EmailPriorityService.analyzePriority({
        id: email.gmailMessageId,
        subject: email.subject || '',
        sender: email.sender || '',
        senderName: email.senderName || '',
        snippet: email.snippet || '',
        bodyText: email.bodyText || '',
      });

      return {
        id: email.gmailMessageId,
        subject: email.subject || '',
        sender: email.sender || '',
        senderName: email.senderName || email.sender || '',
        snippet: email.snippet || '',
        bodyText: email.bodyText || '',
        receivedAt: email.receivedAt ? email.receivedAt.toISOString() : new Date().toISOString(),
        priority: analyzedPriority,
        isRead: email.isRead,
        labels: email.labels,
        threadId: email.threadId,
      };
    } catch (error: any) {
      console.error('❌ Error fetching email:', error);
      throw error;
    }
  }

  /**
   * Check if cache should be refreshed
   */
  private static async shouldRefreshCache(userId: string, forceRefresh: boolean): Promise<boolean> {
    if (forceRefresh) return true;

    const syncMeta = await prisma.syncMetadata.findUnique({
      where: {
        userId_syncType: {
          userId,
          syncType: 'email',
        },
      },
    });

    return !syncMeta ||
      !syncMeta.lastSyncAt ||
      (Date.now() - syncMeta.lastSyncAt.getTime() > CACHE_DURATION_MS);
  }

  /**
   * Get cached emails or fetch from Gmail if stale
   */
  static async getUnreadEmails(userId: string = DEFAULT_USER_ID, forceRefresh: boolean = false) {
    try {
      // Check sync metadata to see if cache is fresh
      const syncMeta = await prisma.syncMetadata.findUnique({
        where: {
          userId_syncType: {
            userId,
            syncType: 'email',
          },
        },
      });

      const isCacheStale = !syncMeta ||
        !syncMeta.lastSyncAt ||
        (Date.now() - syncMeta.lastSyncAt.getTime() > CACHE_DURATION_MS);

      // Force refresh or cache is stale
      if (forceRefresh || isCacheStale) {
        console.log('🔄 Refreshing email cache from Gmail API...');
        return await this.refreshCache(userId);
      }

      // Return cached emails
      console.log('✅ Serving emails from cache');
      const emails = await prisma.email.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { receivedAt: 'desc' },
        take: 100,
      });

      return emails;
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      throw error;
    }
  }

  /**
   * Refresh email cache from Gmail API
   */
  static async refreshCache(userId: string = DEFAULT_USER_ID) {
    try {
      // Fetch from Gmail API
      const result = await getUnreadEmailsTool.execute({ context: {} });

      if (!result || !Array.isArray(result)) {
        throw new Error('Invalid response from Gmail API');
      }

      // Delete old emails to maintain cache size
      const oldEmailsCount = await prisma.email.count({ where: { userId } });
      if (oldEmailsCount > MAX_CACHED_EMAILS) {
        const emailsToDelete = await prisma.email.findMany({
          where: { userId },
          orderBy: { receivedAt: 'asc' },
          take: oldEmailsCount - MAX_CACHED_EMAILS,
          select: { id: true },
        });

        await prisma.email.deleteMany({
          where: {
            id: { in: emailsToDelete.map(e => e.id) },
          },
        });
      }

      // Upsert emails (update if exists, create if not)
      const emails = await Promise.all(
        result.map((email: any) => {
          // Parse and validate date
          let receivedAt: Date | null = null;
          if (email.receivedAt) {
            const parsedDate = new Date(email.receivedAt);
            if (!isNaN(parsedDate.getTime())) {
              receivedAt = parsedDate;
            }
          }

          return prisma.email.upsert({
            where: { gmailMessageId: email.id },
            create: {
              userId,
              gmailMessageId: email.id,
              threadId: email.threadId || null,
              subject: email.subject || 'No Subject',
              sender: email.sender || 'Unknown',
              senderName: email.senderName || null,
              snippet: email.snippet || null,
              bodyText: email.body || null,
              receivedAt: receivedAt || new Date(), // Fallback to current date
              isRead: email.read || false,
              priority: email.priority || 'normal',
              labels: JSON.stringify(email.labels || []),
              lastSyncedAt: new Date(),
            },
            update: {
              isRead: email.read || false,
              senderName: email.senderName || null,
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
            syncType: 'email',
          },
        },
        create: {
          userId,
          syncType: 'email',
          lastSyncAt: new Date(),
          syncStatus: 'success',
        },
        update: {
          lastSyncAt: new Date(),
          syncStatus: 'success',
          errorMessage: null,
        },
      });

      console.log(`✅ Cached ${emails.length} emails`);
      return emails;
    } catch (error: any) {
      // Update sync metadata with error
      await prisma.syncMetadata.upsert({
        where: {
          userId_syncType: {
            userId,
            syncType: 'email',
          },
        },
        create: {
          userId,
          syncType: 'email',
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
   * Mark an email as read in cache and Gmail
   */
  static async markAsRead(emailId: string, userId: string = DEFAULT_USER_ID) {
    try {
      const email = await prisma.email.findFirst({
        where: { gmailMessageId: emailId, userId },
      });

      if (!email) {
        throw new Error('Email not found in cache');
      }

      // Mark in Gmail API
      const { markAsReadTool } = await import('../tools/email.tool.js');
      await markAsReadTool.execute({ context: { emailId } });

      // Update cache
      await prisma.email.update({
        where: { id: email.id },
        data: { isRead: true },
      });

      console.log(`✅ Marked email as read: ${emailId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error marking email as read:', error);
      throw error;
    }
  }

  /**
   * Search emails in cache (full-text search)
   */
  static async searchEmails(query: string, userId: string = DEFAULT_USER_ID) {
    // Ensure cache is fresh
    await this.getUnreadEmails(userId);

    return await prisma.email.findMany({
      where: {
        userId,
        OR: [
          { subject: { contains: query } },
          { sender: { contains: query } },
          { bodyText: { contains: query } },
        ],
      },
      orderBy: { receivedAt: 'desc' },
      take: 50,
    });
  }
}

