import { Router } from 'express';
import {
  listEventsTool,
  updateEventTool,
  findFreeSlotsTool,
  createEventTool,
  getUnreadEmailsTool,
  draftReplyTool,
  summarizeEmailsTool,
  markAsReadTool,
} from '../tools/index.js';
import { workspaceAgent } from '../agents/workspace.agent.js';
import { getAuthUrl, getTokensFromCode, isAuthenticated } from '../auth/google-auth.js';
import { TaskService } from '../services/task.service.js';
import { CalendarService } from '../services/calendar.service.js';
import { EmailService } from '../services/email.service.js';
import { ChatService } from '../services/chat.service.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI Workspace Backend',
    googleAuth: isAuthenticated() ? 'authenticated' : 'not authenticated',
  });
});

// ============ GOOGLE OAUTH ENDPOINTS ============

// Initiate OAuth flow
router.get('/auth/google', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    // Redirect directly to Google OAuth page
    res.redirect(authUrl);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!code || typeof code !== 'string') {
      return res.redirect(`${frontendUrl}/auth/callback?error=no_code`);
    }

    const tokens = await getTokensFromCode(code);

    console.log('✅ Google OAuth successful!');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('\nℹ️  Add this to your .env file:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    // Redirect to frontend dashboard
    res.redirect(`${frontendUrl}/dashboard?auth=success`);
  } catch (error: any) {
    console.error('❌ Google OAuth error:', error.message);
    res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
  }
});

// Check auth status
router.get('/auth/status', (req, res) => {
  res.json({
    authenticated: isAuthenticated(),
    message: isAuthenticated() 
      ? '✅ Google API is authenticated and ready'
      : '❌ Not authenticated. Visit /api/auth/google to authenticate',
  });
});

// ============ CALENDAR ENDPOINTS (Cached) ============

router.get('/calendar/events', async (req, res) => {
  try {
    const { date, forceRefresh } = req.query;
    console.log('📅 Fetching calendar events' + (forceRefresh ? ' (force refresh)' : ' (cached)'));
    
    const result = await CalendarService.getEvents(undefined, forceRefresh === 'true');
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ Calendar error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calendar/events', async (req, res) => {
  try {
    const { title, start, end, description, location } = req.body;
    console.log('✨ Creating calendar event:', title);

    if (!title || !start || !end) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, start, and end are required' 
      });
    }

    const result = await createEventTool.execute({
      context: { title, start, end, description, location },
    });

    // Invalidate cache after creating event
    await CalendarService.getEvents(undefined, true);

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calendar/events/:eventId/update', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { newStart, newEnd, title, message } = req.body;

    const result = await updateEventTool.execute({
      context: { eventId, newStart, newEnd, title, message },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/calendar/free-slots', async (req, res) => {
  try {
    const { date, duration } = req.query;
    const result = await findFreeSlotsTool.execute({
      context: {
        date: date as string,
        duration: duration ? parseInt(duration as string) : undefined,
      },
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ EMAIL ENDPOINTS (Cached) ============

// Get all emails (with optional filters)
router.get('/emails', async (req, res) => {
  try {
    const { forceRefresh, unreadOnly, priority } = req.query;
    console.log('📧 Fetching emails' + (forceRefresh ? ' (force refresh)' : ' (cached)'));
    
    const result = await EmailService.getEmails({
      unreadOnly: unreadOnly === 'true',
      priority: priority as string,
      forceRefresh: forceRefresh === 'true',
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread emails (for backward compatibility)
router.get('/emails/unread', async (req, res) => {
  try {
    const { limit, forceRefresh } = req.query;
    console.log('📧 Fetching unread emails' + (forceRefresh ? ' (force refresh)' : ' (cached)'));
    
    const result = await EmailService.getUnreadEmails(undefined, forceRefresh === 'true');
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single email by ID
router.get('/emails/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    console.log('📧 Fetching email details:', emailId);
    
    const result = await EmailService.getEmailById(emailId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/emails/:emailId/draft-reply', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { context, tone } = req.body;

    const result = await draftReplyTool.execute({
      context: { emailId, context, tone },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/emails/summarize', async (req, res) => {
  try {
    const { emailIds, includeRead } = req.query;
    const result = await summarizeEmailsTool.execute({
      context: {
        emailIds: emailIds ? (emailIds as string).split(',') : undefined,
        includeRead: includeRead === 'true',
      },
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/emails/:emailId/mark-read', async (req, res) => {
  try {
    const { emailId } = req.params;
    const result = await markAsReadTool.execute({
      context: { emailId },
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ TASK ENDPOINTS (Database) ============

router.get('/tasks', async (req, res) => {
  try {
    const { status, priority } = req.query;
    console.log('Fetching tasks from DATABASE with filters:', { status, priority });
    
    const tasks = await TaskService.getTasks(undefined, {
      status: status as string,
      priority: priority as string,
    });
    
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { title, description, priority, dueDate, category } = req.body;
    console.log('Creating task in DATABASE:', { title, priority, category });
    
    const task = await TaskService.createTask({
      title,
      description,
      priority,
      dueDate,
      category,
    });
    
    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, priority, dueDate, title, description } = req.body;
    console.log('Updating task in DATABASE:', taskId, { status, priority });

    const task = await TaskService.updateTask(taskId, {
      title,
      description,
      status,
      priority,
      dueDate,
    });

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log('Deleting task from DATABASE:', taskId);
    
    await TaskService.deleteTask(taskId);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tasks/prioritize', async (req, res) => {
  try {
    const { considerCalendar } = req.query;
    console.log('Getting prioritized tasks from DATABASE');
    
    const tasks = await TaskService.getPrioritizedTasks(undefined, considerCalendar === 'true');
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('Error prioritizing tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ AI AGENT ENDPOINTS ============

router.post('/agent/daily-summary', async (req, res) => {
  try {
    const response = await workspaceAgent.generate(
      `Please analyze my day and provide a comprehensive summary.

      Steps:
      1. Check my calendar events for today
      2. Review unread emails and identify urgent ones
      3. Get my active tasks and prioritize them
      4. Find free time slots in my calendar
      5. Provide recommendations for optimizing my day

      Format your response as a structured summary with:
      - Top 3 priority items for today
      - Urgent emails requiring response
      - Recommended task order
      - Suggested schedule adjustments
      - Available focus time blocks`
    );

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/optimize-schedule', async (req, res) => {
  try {
    const response = await workspaceAgent.generate(
      `Analyze my calendar and tasks, then suggest optimizations for better productivity.

      Consider:
      - Meeting clustering to create focus blocks
      - Buffer time between meetings
      - Alignment of tasks with available time slots
      - Energy management (complex tasks in morning, admin in afternoon)

      Provide specific, actionable recommendations.`
    );

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/urgent-items', async (req, res) => {
  try {
    const response = await workspaceAgent.generate(
      `Identify all urgent items requiring immediate attention:

      1. Meetings starting within the next 2 hours
      2. High-priority emails from today
      3. Tasks due within the next 4 hours

      For each urgent item, suggest an immediate action.`
    );

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    console.log('💬 AI Chat request:', message.substring(0, 50) + '...');

    // Get or create active conversation
    const conversation = await ChatService.getOrCreateActiveConversation();

    // Store user message
    await ChatService.addMessage(conversation.id, {
      role: 'user',
      content: message,
    });

    // Get conversation history for context (if not provided by frontend)
    let contextHistory = history || [];
    if (contextHistory.length === 0) {
      const dbHistory = await ChatService.getConversationHistory(conversation.id);
      // Convert to the format expected by the agent (take last N messages, excluding the current one)
      contextHistory = dbHistory.slice(-10); // Last 10 messages for context
    }

    // Build the full prompt with history
    let fullPrompt = message;
    if (contextHistory.length > 0) {
      const historyText = contextHistory
        .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      fullPrompt = `Previous conversation:\n${historyText}\n\nCurrent message:\n${message}`;
    }

    // Generate response from AI agent
    const response = await workspaceAgent.generate(fullPrompt);

    // Store assistant message
    await ChatService.addMessage(conversation.id, {
      role: 'assistant',
      content: response.text || 'I processed your request.',
    });

    res.json({ success: true, data: response });
  } catch (error: any) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
