import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { TaskService } from '../services/task.service.js';

/**
 * Tool to get all tasks
 */
export const getTasksTool = createTool({
  id: 'task-get-tasks',
  description: 'Get all tasks with optional filtering',
  inputSchema: z.object({
    status: z.enum(['pending', 'in-progress', 'completed', 'all']).optional().describe('Filter by status').default('all'),
    priority: z.enum(['high', 'medium', 'low', 'all']).optional().describe('Filter by priority').default('all'),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z.string(),
      dueDate: z.string(),
      description: z.string(),
      category: z.string(),
    })
  ),
  execute: async ({ context }) => {
    console.log('Fetching tasks with filters:', context);

    const filters: any = {};
    
    if (context.status && context.status !== 'all') {
      filters.status = context.status;
    }

    if (context.priority && context.priority !== 'all') {
      filters.priority = context.priority;
    }

    const tasks = await TaskService.getTasks(undefined, filters);

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() || new Date().toISOString(),
      description: task.description || '',
      category: task.category || 'general',
    }));
  },
});

/**
 * Tool to update a task
 */
export const updateTaskTool = createTool({
  id: 'task-update',
  description: 'Update an existing task',
  inputSchema: z.object({
    taskId: z.string().describe('The ID of the task to update'),
    status: z.enum(['pending', 'in-progress', 'completed']).optional().describe('New status'),
    priority: z.enum(['high', 'medium', 'low']).optional().describe('New priority'),
    dueDate: z.string().optional().describe('New due date (ISO format)'),
    title: z.string().optional().describe('New title'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    task: z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z.string(),
      dueDate: z.string(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    console.log('Updating task:', context.taskId);

    try {
      const updateData: any = {};
      if (context.status) updateData.status = context.status;
      if (context.priority) updateData.priority = context.priority;
      if (context.dueDate) updateData.dueDate = context.dueDate;
      if (context.title) updateData.title = context.title;

      const task = await TaskService.updateTask(context.taskId, updateData);

      return {
        success: true,
        message: 'Task updated successfully',
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() || new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update task',
      };
    }
  },
});

/**
 * Tool to create a new task
 */
export const createTaskTool = createTool({
  id: 'task-create',
  description: 'Create a new task',
  inputSchema: z.object({
    title: z.string().describe('Title of the task'),
    description: z.string().optional().describe('Task description'),
    priority: z.enum(['high', 'medium', 'low']).describe('Task priority'),
    dueDate: z.string().describe('Due date (ISO format)'),
    category: z.string().optional().describe('Task category').default('general'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    task: z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z.string(),
      dueDate: z.string(),
      category: z.string(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    console.log('✨ Creating new task:', context.title);

    try {
      const task = await TaskService.createTask({
        title: context.title,
        description: context.description,
        status: 'pending',
        priority: context.priority,
        dueDate: context.dueDate,
        category: context.category || 'general',
      });

      console.log('✅ Task created successfully in database:', task.id);

      return {
        success: true,
        message: 'Task created successfully',
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() || new Date().toISOString(),
          category: task.category || 'general',
        },
      };
    } catch (error: any) {
      console.error('❌ Failed to create task:', error);
      return {
        success: false,
        message: error.message || 'Failed to create task',
      };
    }
  },
});

/**
 * Tool to prioritize tasks based on urgency and importance
 */
export const prioritizeTasksTool = createTool({
  id: 'task-prioritize',
  description: 'Analyze and prioritize tasks based on due dates and importance',
  inputSchema: z.object({
    considerCalendar: z.boolean().optional().describe('Consider calendar availability').default(true),
  }),
  outputSchema: z.object({
    prioritizedTasks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        priority: z.string(),
        dueDate: z.string(),
        urgencyScore: z.number(),
        recommendation: z.string(),
      })
    ),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    console.log('Prioritizing tasks, considerCalendar:', context.considerCalendar);

    const tasks = await TaskService.getPrioritizedTasks(undefined, context.considerCalendar);

    // Calculate urgency score (0-100)
    const now = new Date();
    const prioritizedTasks = tasks
      .map((task: any) => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        let urgencyScore = task.priorityScore || 50;

        // Adjust based on time remaining
        if (hoursUntilDue < 2) urgencyScore += 40;
        else if (hoursUntilDue < 6) urgencyScore += 30;
        else if (hoursUntilDue < 24) urgencyScore += 20;

        // Adjust based on priority
        if (task.priority === 'high') urgencyScore += 10;
        else if (task.priority === 'low') urgencyScore -= 10;

        urgencyScore = Math.min(100, Math.max(0, urgencyScore));

        const recommendation =
          urgencyScore >= 80 ? 'Do immediately' :
          urgencyScore >= 60 ? 'Schedule in next 2 hours' :
          urgencyScore >= 40 ? 'Can wait until afternoon' :
          'Low priority - schedule when available';

        return {
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: dueDate.toISOString(),
          urgencyScore,
          recommendation,
        };
      })
      .sort((a: any, b: any) => b.urgencyScore - a.urgencyScore);

    const highUrgency = prioritizedTasks.filter((t: any) => t.urgencyScore >= 70).length;
    const summary = prioritizedTasks.length > 0 
      ? `You have ${prioritizedTasks.length} active task(s). ${highUrgency} require immediate attention. ${prioritizedTasks.length > 0 ? 'Focus on: ' + prioritizedTasks.slice(0, 3).map((t: any) => t.title).join(', ') : ''}`
      : 'No active tasks found.';

    return {
      prioritizedTasks,
      summary,
    };
  },
});
