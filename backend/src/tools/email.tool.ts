import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { google, getAuthClient, handleApiError, isAuthenticated } from '../auth/google-auth.js';

/**
 * Tool to get unread emails
 */
export const getUnreadEmailsTool = createTool({
  id: 'email-get-unread',
  description: 'Get all unread emails from the inbox',
  inputSchema: z.object({
    limit: z.number().optional().describe('Maximum number of emails to return').default(10),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      subject: z.string(),
      sender: z.string(),
      senderName: z.string(),
      snippet: z.string(),
      receivedAt: z.string(),
      priority: z.string(),
    })
  ),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const gmail = google.gmail({ version: 'v1', auth });

      console.log('📧 Fetching unread emails from Gmail API, limit:', context.limit);

      // Fetch unread messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: context.limit || 10,
      });

      const messages = response.data.messages || [];
      const emails = [];

      console.log(`Found ${messages.length} unread emails`);

      // Fetch full details for each message
      for (const message of messages) {
        try {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          });

          const headers = detail.data.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
          const date = headers.find(h => h.name === 'Date')?.value || '';

          // Extract sender name and email
          const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
          const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : from;
          const senderEmail = senderMatch ? senderMatch[2].trim() : from;

          // Determine priority (simple heuristic)
          const isUrgent = subject.toLowerCase().includes('urgent') || 
                          subject.includes('URGENT') || 
                          subject.includes('!!!');
          const priority = isUrgent ? 'high' : 'medium';

          emails.push({
            id: detail.data.id || '',
            subject,
            sender: senderEmail,
            senderName,
            snippet: detail.data.snippet || '',
            receivedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
            priority,
          });
        } catch (msgError) {
          console.error('Error fetching message details:', msgError);
          // Continue with other messages
        }
      }

      console.log(`✅ Retrieved ${emails.length} unread emails from Gmail`);

      return emails;
    } catch (error: any) {
      console.error('❌ Error fetching emails:', error.message);
      await handleApiError(error);
      throw error;
    }
  },
});

/**
 * Tool to draft an email reply
 */
export const draftReplyTool = createTool({
  id: 'email-draft-reply',
  description: 'Draft a reply to an email using AI',
  inputSchema: z.object({
    emailId: z.string().describe('The ID of the email to reply to'),
    context: z.string().optional().describe('Additional context for the reply'),
    tone: z.enum(['professional', 'friendly', 'formal']).optional().describe('Tone of the reply').default('professional'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    draftBody: z.string().optional(),
    subject: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const gmail = google.gmail({ version: 'v1', auth });

      console.log('✍️ Drafting reply for email:', context.emailId);

      // Fetch the email details
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: context.emailId,
        format: 'full',
      });

      const headers = email.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';

      // Extract sender name
      const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
      const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : from.split('@')[0];

      // Generate draft based on tone
      let greeting, closing;
      
      switch (context.tone) {
        case 'friendly':
          greeting = `Hey ${senderName},`;
          closing = 'Cheers,\nYour Name';
          break;
        case 'formal':
          greeting = `Dear ${senderName},`;
          closing = 'Sincerely,\nYour Name';
          break;
        default: // professional
          greeting = `Hi ${senderName},`;
          closing = 'Best regards,\nYour Name';
      }

      const draftBody = `${greeting}

Thank you for your email regarding "${subject}".

${context.context || 'I have reviewed your message and will get back to you with more details shortly.'}

${closing}`;

      console.log('✅ Draft reply created successfully');

      return {
        success: true,
        draftBody,
        subject: `Re: ${subject}`,
        message: 'Draft reply created successfully',
      };
    } catch (error: any) {
      console.error('❌ Error drafting reply:', error.message);
      await handleApiError(error);
      return {
        success: false,
        message: `Failed to draft reply: ${error.message}`,
      };
    }
  },
});

/**
 * Tool to summarize emails
 */
export const summarizeEmailsTool = createTool({
  id: 'email-summarize',
  description: 'Summarize multiple emails and extract action items',
  inputSchema: z.object({
    emailIds: z.array(z.string()).optional().describe('Specific email IDs to summarize'),
    includeRead: z.boolean().optional().describe('Include read emails').default(false),
  }),
  outputSchema: z.object({
    summary: z.string(),
    actionItems: z.array(
      z.object({
        emailId: z.string(),
        subject: z.string(),
        action: z.string(),
        priority: z.string(),
      })
    ),
    totalEmails: z.number(),
  }),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const gmail = google.gmail({ version: 'v1', auth });

      console.log('📊 Summarizing emails from Gmail');

      let query = context.includeRead ? 'in:inbox' : 'is:unread';
      
      // Fetch messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      });

      const messages = response.data.messages || [];
      const emailsToSummarize = [];

      // Fetch details for each message (or filter by specific IDs)
      for (const message of messages) {
        if (context.emailIds && context.emailIds.length > 0) {
          if (!context.emailIds.includes(message.id!)) continue;
        }

        try {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From'],
          });

          const headers = detail.data.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          
          const isUrgent = subject.toLowerCase().includes('urgent') || 
                          subject.toLowerCase().includes('important') ||
                          subject.includes('!!!');
          const priority = isUrgent ? 'high' : 'medium';

          emailsToSummarize.push({
            id: detail.data.id || '',
            subject,
            priority,
          });
        } catch (msgError) {
          console.error('Error fetching message:', msgError);
        }

        // Limit to prevent too many API calls
        if (emailsToSummarize.length >= 20) break;
      }

      // Extract action items
      const actionItems = emailsToSummarize
        .filter(email => email.priority === 'high' || email.priority === 'medium')
        .map(email => ({
          emailId: email.id,
          subject: email.subject,
          action: email.subject.toLowerCase().includes('review') ? 'Needs review' :
                  email.subject.toLowerCase().includes('reschedule') ? 'Respond to reschedule request' :
                  email.subject.toLowerCase().includes('urgent') ? 'Urgent response needed' :
                  'Follow up required',
          priority: email.priority,
        }));

      const summary = `You have ${emailsToSummarize.length} email(s) to review. ${actionItems.length} require immediate action.${actionItems.length > 0 ? ' Key items: ' + actionItems.slice(0, 3).map(a => a.subject).join(', ') : ''}`;

      console.log(`✅ Summarized ${emailsToSummarize.length} emails`);

      return {
        summary,
        actionItems,
        totalEmails: emailsToSummarize.length,
      };
    } catch (error: any) {
      console.error('❌ Error summarizing emails:', error.message);
      await handleApiError(error);
      throw error;
    }
  },
});

/**
 * Tool to mark email as read
 */
export const markAsReadTool = createTool({
  id: 'email-mark-read',
  description: 'Mark an email as read',
  inputSchema: z.object({
    emailId: z.string().describe('The ID of the email to mark as read'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Google. Visit http://localhost:3001/api/auth/google to authenticate.');
      }

      const auth = getAuthClient();
      const gmail = google.gmail({ version: 'v1', auth });

      console.log('✉️ Marking email as read:', context.emailId);

      // Mark the message as read by removing the UNREAD label
      await gmail.users.messages.modify({
        userId: 'me',
        id: context.emailId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });

      console.log('✅ Email marked as read successfully');

      return {
        success: true,
        message: 'Email marked as read',
      };
    } catch (error: any) {
      console.error('❌ Error marking email as read:', error.message);
      await handleApiError(error);
      return {
        success: false,
        message: `Failed to mark email as read: ${error.message}`,
      };
    }
  },
});
