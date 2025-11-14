import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './api/routes.js';
import { initializeDefaultUser } from './db/client.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI Workspace Backend',
    version: '1.0.0',
    description: 'Backend server with MCP tools and AI agent',
    endpoints: {
      health: '/api/health',
      calendar: {
        listEvents: 'GET /api/calendar/events',
        updateEvent: 'POST /api/calendar/events/:eventId/update',
        findFreeSlots: 'GET /api/calendar/free-slots',
      },
      email: {
        getUnread: 'GET /api/emails/unread',
        draftReply: 'POST /api/emails/:emailId/draft-reply',
        summarize: 'GET /api/emails/summarize',
        markRead: 'POST /api/emails/:emailId/mark-read',
      },
      tasks: {
        list: 'GET /api/tasks',
        create: 'POST /api/tasks',
        update: 'PUT /api/tasks/:taskId',
        prioritize: 'GET /api/tasks/prioritize',
      },
      agent: {
        dailySummary: 'POST /api/agent/daily-summary',
        optimizeSchedule: 'POST /api/agent/optimize-schedule',
        urgentItems: 'POST /api/agent/urgent-items',
        chat: 'POST /api/agent/chat',
      },
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDefaultUser();
    
    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║   🚀 AI Workspace Backend Server          ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log('');
      console.log(`✨ Server running on http://localhost:${PORT}`);
      console.log(`🗄️  Database ready (SQLite)`);
      console.log(`📅 Calendar tools ready`);
      console.log(`📧 Email tools ready`);
      console.log(`✅ Task tools ready (Database-backed)`);
      console.log(`🤖 AI Agent ready`);
      console.log('');
      console.log(`📖 API Documentation: http://localhost:${PORT}`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
