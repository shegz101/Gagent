import { prisma, DEFAULT_USER_ID } from '../db/client.js';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export class TaskService {
  /**
   * Get all tasks with optional filters
   */
  static async getTasks(userId: string = DEFAULT_USER_ID, filters?: {
    status?: string;
    priority?: string;
  }) {
    const where: any = { userId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.priority) {
      where.priority = filters.priority;
    }

    return await prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' }, // high first
        { dueDate: 'asc' },   // earliest first
        { createdAt: 'desc' }, // newest first
      ],
    });
  }

  /**
   * Get a single task by ID
   */
  static async getTaskById(taskId: string, userId: string = DEFAULT_USER_ID) {
    return await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
  }

  /**
   * Create a new task
   */
  static async createTask(data: CreateTaskInput, userId: string = DEFAULT_USER_ID) {
    return await prisma.task.create({
      data: {
        ...data,
        userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  /**
   * Update a task
   */
  static async updateTask(taskId: string, data: UpdateTaskInput, userId: string = DEFAULT_USER_ID) {
    // Set completedAt when marking as completed
    const updateData: any = { ...data };
    if (data.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string, userId: string = DEFAULT_USER_ID) {
    return await prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Get tasks prioritized by AI logic
   */
  static async getPrioritizedTasks(userId: string = DEFAULT_USER_ID, considerCalendar: boolean = false) {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: { not: 'completed' },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    // Calculate a score for each task based on priority and due date
    return tasks.map(task => {
      let score = 0;
      
      // Priority scoring
      if (task.priority === 'high') score += 10;
      else if (task.priority === 'medium') score += 5;
      else score += 2;
      
      // Due date scoring
      if (task.dueDate) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 1) score += 8;
        else if (daysUntilDue <= 3) score += 5;
        else if (daysUntilDue <= 7) score += 2;
      }
      
      return { ...task, priorityScore: score };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }
}

