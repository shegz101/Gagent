import { prisma, DEFAULT_USER_ID } from '../db/client.js';

const MAX_CONTEXT_MESSAGES = 50; // Keep last 50 messages for context
const ARCHIVE_AFTER_DAYS = 30;

export interface ChatMessageData {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatService {
  /**
   * Get or create the active conversation for a user
   */
  static async getOrCreateActiveConversation(userId: string = DEFAULT_USER_ID) {
    // Try to get the most recent conversation
    let conversation = await prisma.chatConversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: MAX_CONTEXT_MESSAGES,
        },
      },
    });

    // If no conversation exists or the last one is old, create a new one
    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
        },
        include: {
          messages: true,
        },
      });
      console.log('✅ Created new conversation:', conversation.id);
    }

    return conversation;
  }

  /**
   * Add a message to the conversation
   */
  static async addMessage(
    conversationId: string,
    messageData: ChatMessageData,
    userId: string = DEFAULT_USER_ID
  ) {
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: messageData.role,
        content: messageData.content,
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    console.log(`✅ Added ${messageData.role} message to conversation ${conversationId}`);
    return message;
  }

  /**
   * Get conversation history for context
   */
  static async getConversationHistory(
    conversationId: string,
    limit: number = MAX_CONTEXT_MESSAGES
  ) {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Get recent conversations for a user
   */
  static async getUserConversations(userId: string = DEFAULT_USER_ID, limit: number = 10) {
    return await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get last message for preview
        },
      },
    });
  }

  /**
   * Archive old conversations
   */
  static async archiveOldConversations(userId: string = DEFAULT_USER_ID) {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - ARCHIVE_AFTER_DAYS);

    // For now, we'll just delete old messages to keep DB size manageable
    // In production, you might want to move them to cold storage
    const result = await prisma.chatMessage.deleteMany({
      where: {
        conversation: {
          userId,
          updatedAt: {
            lt: archiveDate,
          },
        },
      },
    });

    console.log(`🗄️  Archived ${result.count} old messages`);
    return result;
  }

  /**
   * Clear conversation history
   */
  static async clearConversation(conversationId: string) {
    await prisma.chatMessage.deleteMany({
      where: { conversationId },
    });

    await prisma.chatConversation.delete({
      where: { id: conversationId },
    });

    console.log(`🗑️  Cleared conversation ${conversationId}`);
    return { success: true };
  }

  /**
   * Start a new conversation thread
   */
  static async startNewConversation(userId: string = DEFAULT_USER_ID) {
    const conversation = await prisma.chatConversation.create({
      data: { userId },
      include: { messages: true },
    });

    console.log('✅ Started new conversation:', conversation.id);
    return conversation;
  }

  /**
   * Get conversation statistics
   */
  static async getConversationStats(userId: string = DEFAULT_USER_ID) {
    const totalConversations = await prisma.chatConversation.count({
      where: { userId },
    });

    const totalMessages = await prisma.chatMessage.count({
      where: { conversation: { userId } },
    });

    const userMessages = await prisma.chatMessage.count({
      where: {
        conversation: { userId },
        role: 'user',
      },
    });

    const assistantMessages = await prisma.chatMessage.count({
      where: {
        conversation: { userId },
        role: 'assistant',
      },
    });

    return {
      totalConversations,
      totalMessages,
      userMessages,
      assistantMessages,
    };
  }
}

