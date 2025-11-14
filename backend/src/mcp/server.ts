#!/usr/bin/env node

import { MCPServer } from '@mastra/mcp';
import {
  // Calendar tools
  listEventsTool,
  updateEventTool,
  findFreeSlotsTool,
  // Email tools
  getUnreadEmailsTool,
  draftReplyTool,
  summarizeEmailsTool,
  markAsReadTool,
  // Task tools
  getTasksTool,
  updateTaskTool,
  createTaskTool,
  prioritizeTasksTool,
} from '../tools/index.js';

/**
 * AI Workspace MCP Server
 *
 * This server exposes tools for managing:
 * - Calendar events (list, update, find free slots)
 * - Emails (get unread, draft replies, summarize)
 * - Tasks (get, update, create, prioritize)
 */
export const aiWorkspaceMcpServer = new MCPServer({
  id: 'ai-workspace-mcp-server',
  name: 'AI Workspace MCP Server',
  version: '1.0.0',
  tools: {
    // Calendar tools
    listEventsTool,
    updateEventTool,
    findFreeSlotsTool,
    // Email tools
    getUnreadEmailsTool,
    draftReplyTool,
    summarizeEmailsTool,
    markAsReadTool,
    // Task tools
    getTasksTool,
    updateTaskTool,
    createTaskTool,
    prioritizeTasksTool,
  },
});

// Start the server with stdio transport (only when run directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  aiWorkspaceMcpServer.startStdio().catch((error: Error) => {
    console.error('Error running MCP server:', error);
    process.exit(1);
  });
  console.log('AI Workspace MCP Server started successfully');
}
