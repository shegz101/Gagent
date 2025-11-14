/**
 * Email Priority Service
 * Uses AI and keyword analysis to determine email importance
 */

interface Email {
  id: string;
  subject: string;
  sender: string;
  senderName?: string;
  snippet: string;
  bodyText?: string;
}

// Important keywords that indicate high priority
const HIGH_PRIORITY_KEYWORDS = [
  'urgent', 'asap', 'important', 'critical', 'deadline', 'emergency',
  'action required', 'immediate', 'expires', 'due', 'overdue',
  'interview', 'meeting', 'tomorrow', 'today', 'tonight'
];

const MEDIUM_PRIORITY_KEYWORDS = [
  'reminder', 'follow up', 'feedback', 'response', 'reply',
  'update', 'status', 'review', 'check', 'confirm'
];

// VIP senders (can be configured per user)
const VIP_DOMAINS = [
  '@company.com',  // Company domain
  '@client.com',   // Client domain
  'boss@',
  'ceo@',
  'manager@'
];

export class EmailPriorityService {
  /**
   * Analyze email and assign priority level
   */
  static analyzePriority(email: Email): 'high' | 'medium' | 'low' {
    const text = `${email.subject} ${email.snippet} ${email.bodyText || ''}`.toLowerCase();
    const sender = email.sender.toLowerCase();

    // Check for VIP senders
    if (this.isVIPSender(sender)) {
      return 'high';
    }

    // Check for high priority keywords
    const hasHighPriorityKeyword = HIGH_PRIORITY_KEYWORDS.some(keyword => 
      text.includes(keyword)
    );

    if (hasHighPriorityKeyword) {
      return 'high';
    }

    // Check for medium priority keywords
    const hasMediumPriorityKeyword = MEDIUM_PRIORITY_KEYWORDS.some(keyword => 
      text.includes(keyword)
    );

    if (hasMediumPriorityKeyword) {
      return 'medium';
    }

    // Default to low priority
    return 'low';
  }

  /**
   * Check if sender is a VIP
   */
  static isVIPSender(sender: string): boolean {
    return VIP_DOMAINS.some(domain => sender.includes(domain));
  }

  /**
   * Get priority explanation
   */
  static getPriorityReason(email: Email, priority: string): string {
    if (priority === 'high') {
      if (this.isVIPSender(email.sender)) {
        return 'VIP sender';
      }
      
      const text = `${email.subject} ${email.snippet}`.toLowerCase();
      const keyword = HIGH_PRIORITY_KEYWORDS.find(k => text.includes(k));
      if (keyword) {
        return `Contains keyword: "${keyword}"`;
      }
    }

    if (priority === 'medium') {
      const text = `${email.subject} ${email.snippet}`.toLowerCase();
      const keyword = MEDIUM_PRIORITY_KEYWORDS.find(k => text.includes(k));
      if (keyword) {
        return `Contains keyword: "${keyword}"`;
      }
    }

    return 'Standard priority';
  }

  /**
   * Batch analyze multiple emails
   */
  static batchAnalyze(emails: Email[]): Map<string, { priority: string; reason: string }> {
    const results = new Map();

    for (const email of emails) {
      const priority = this.analyzePriority(email);
      const reason = this.getPriorityReason(email, priority);
      
      results.set(email.id, { priority, reason });
    }

    return results;
  }

  /**
   * Filter emails by priority
   */
  static filterByPriority(emails: Email[], priority: 'high' | 'medium' | 'low'): Email[] {
    return emails.filter(email => {
      const emailPriority = this.analyzePriority(email);
      return emailPriority === priority;
    });
  }

  /**
   * Get priority distribution
   */
  static getPriorityDistribution(emails: Email[]): {
    high: number;
    medium: number;
    low: number;
  } {
    const distribution = { high: 0, medium: 0, low: 0 };

    for (const email of emails) {
      const priority = this.analyzePriority(email);
      distribution[priority]++;
    }

    return distribution;
  }
}

