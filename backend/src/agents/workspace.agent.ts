import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import * as allTools from '../tools/index.js';

/**
 * AI Workspace Agent
 *
 * This agent acts as a personal assistant that:
 * - Analyzes your calendar, emails, and tasks
 * - Provides daily summaries and recommendations
 * - Drafts email replies
 * - Suggests schedule optimizations
 * - Prioritizes tasks based on context
 */
export const workspaceAgent = new Agent({
  name: 'AI Workspace Assistant',
  description: 'Your intelligent personal assistant for managing calendar, emails, and tasks',
  instructions: `You are an AI personal assistant helping users manage their day effectively.

Your capabilities include:
1. **Calendar Management**: 
   - VIEW calendar events with getCalendarEventsCachedTool (FAST, USE THIS BY DEFAULT for listing events)
   - Get specific date events with listEventsTool (only when you need real-time data for a specific date)
   - CREATE new calendar events with createEventTool (use this when user asks to "schedule", "add", or "create" an event)
   - UPDATE existing events with updateEventTool (only use when modifying an existing event you've retrieved)
   - Find free time slots with findFreeSlotsTool
2. **Email Management**: Read unread emails, draft replies, summarize inbox
3. **Task Management**: View tasks, update status, create new tasks, prioritize work
4. **Daily Planning**: Analyze all information and provide actionable daily summaries

IMPORTANT CALENDAR RULES:
- For general queries about calendar ("what's on my calendar", "list my events", "what do I have scheduled") → ALWAYS use getCalendarEventsCachedTool (fast, comprehensive)
- For specific date queries ("what's on my calendar today", "events on Nov 20") → you can use getCalendarEventsCachedTool with date filters
- Only use listEventsTool when you need real-time Google Calendar data for a specific date
- When user wants to schedule something NEW → use createEventTool (NOT updateEventTool)
- When user wants to modify an EXISTING event → first get it with getCalendarEventsCachedTool, then use updateEventTool
- Always create calendar events directly when requested, don't create tasks as substitutes
- Event times should be in ISO format with timezone
- The cache contains a 30-day window of events (7 days back, 23 days ahead from today)

When interacting with users:
- Be proactive but not intrusive
- Provide clear, actionable recommendations
- Explain your reasoning when suggesting changes
- Consider context like meeting importance, email urgency, and task deadlines
- Optimize for productivity and work-life balance

Response Format:
- Use structured output (JSON) for data-heavy responses
- Use conversational tone for explanations
- Always summarize key action items at the end
- Flag urgent items that need immediate attention

CRITICAL DATE CALCULATION RULES:
- Today's date is: ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
- Current time: ${new Date().toISOString()}
- When calculating "next week [day]", add 7 days to the NEXT occurrence of that weekday
- When calculating "this week [day]", use the NEXT occurrence of that weekday within the current week
- ALWAYS verify your date calculations are correct before creating events
- Example: If today is Thursday Nov 14, "next week Thursday" = Thursday Nov 21 (exactly 7 days later)
- Example: If today is Thursday Nov 14, "next Thursday" = Thursday Nov 21
- Example: If today is Thursday Nov 14, "this Friday" = Friday Nov 15`,

  model: openai('gpt-4o-mini'),

  tools: {
    // Calendar tools
    ...allTools.getCalendarEventsCachedTool && { getCalendarEventsCachedTool: allTools.getCalendarEventsCachedTool },
    ...allTools.listEventsTool && { listEventsTool: allTools.listEventsTool },
    ...allTools.createEventTool && { createEventTool: allTools.createEventTool },
    ...allTools.updateEventTool && { updateEventTool: allTools.updateEventTool },
    ...allTools.findFreeSlotsTool && { findFreeSlotsTool: allTools.findFreeSlotsTool },
    // Email tools
    ...allTools.getUnreadEmailsTool && { getUnreadEmailsTool: allTools.getUnreadEmailsTool },
    ...allTools.draftReplyTool && { draftReplyTool: allTools.draftReplyTool },
    ...allTools.summarizeEmailsTool && { summarizeEmailsTool: allTools.summarizeEmailsTool },
    ...allTools.markAsReadTool && { markAsReadTool: allTools.markAsReadTool },
    // Task tools
    ...allTools.getTasksTool && { getTasksTool: allTools.getTasksTool },
    ...allTools.updateTaskTool && { updateTaskTool: allTools.updateTaskTool },
    ...allTools.createTaskTool && { createTaskTool: allTools.createTaskTool },
    ...allTools.prioritizeTasksTool && { prioritizeTasksTool: allTools.prioritizeTasksTool },
  },
});

/**
 * Generate a daily summary
 * This function orchestrates multiple tool calls to provide a comprehensive daily overview
 */
export async function generateDailySummary(): Promise<any> {
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

    return response;
  } catch (error) {
    console.error('Error generating daily summary:', error);
    throw error;
  }
}

/**
 * Get schedule optimization suggestions
 */
export async function optimizeSchedule(): Promise<any> {
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

    return response;
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    throw error;
  }
}

/**
 * Handle urgent items
 */
export async function handleUrgentItems(): Promise<any> {
  try {
    const response = await workspaceAgent.generate(
      `Identify all urgent items requiring immediate attention:

      1. Meetings starting within the next 2 hours
      2. High-priority emails from today
      3. Tasks due within the next 4 hours

      For each urgent item, suggest an immediate action.`
    );

    return response;
  } catch (error) {
    console.error('Error handling urgent items:', error);
    throw error;
  }
}
