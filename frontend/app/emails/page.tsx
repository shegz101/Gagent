'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw,
  Mail,
  AlertCircle,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward
} from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

type EmailTab = 'all' | 'unread' | 'priority';

interface Email {
  id: string;
  subject: string;
  sender: string;
  senderName: string;
  snippet: string;
  bodyText?: string;
  receivedAt: string;
  priority: string;
  isRead: boolean;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EmailTab>('all');

  const fetchEmails = async (tab: EmailTab = activeTab) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/emails?`;
      
      // Build query params based on tab
      if (tab === 'unread') {
        url += 'unreadOnly=true';
      } else if (tab === 'priority') {
        url += 'priority=high';
      }
      // 'all' tab doesn't need any filters
      
      const res = await fetch(url);
      const data = await res.json();
      setEmails(data.data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullEmailDetails = async (emailId: string) => {
    try {
      const res = await fetch(`${API_BASE}/emails/${emailId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedEmail(data.data);
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
    }
  };

  const handleEmailClick = (email: Email) => {
    // Fetch full email details including body
    fetchFullEmailDetails(email.id);
  };

  const handleTabChange = (tab: EmailTab) => {
    setActiveTab(tab);
    setSelectedEmail(null); // Clear selected email when switching tabs
    fetchEmails(tab);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout
      title="Emails"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchEmails(activeTab)}
          disabled={loading}
          className="bg-muted/50 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="flex h-full">
        {/* Email List */}
        <div className="w-96 border-r border-border bg-card/30 backdrop-blur-sm">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <h1 className="text-xl font-bold text-foreground">Inbox</h1>
              <Badge variant="secondary" className="ml-auto">{emails.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={activeTab === 'all' ? 'outline' : 'ghost'}
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => handleTabChange('all')}
              >
                All
              </Button>
              <Button 
                variant={activeTab === 'unread' ? 'outline' : 'ghost'}
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => handleTabChange('unread')}
              >
                Unread
              </Button>
              <Button 
                variant={activeTab === 'priority' ? 'outline' : 'ghost'}
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => handleTabChange('priority')}
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Priority
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No unread emails</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-muted/50 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm text-foreground truncate ${!email.isRead ? 'font-bold' : ''}`}>
                          {email.senderName}
                        </span>
                        {!email.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {email.priority === 'high' && (
                          <AlertCircle className="w-3 h-3 text-destructive" />
                        )}
                        {email.priority === 'medium' && (
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                        )}
                        <span className="text-xs text-muted-foreground">{formatDate(email.receivedAt)}</span>
                      </div>
                    </div>
                    <h4 className={`text-sm font-medium text-foreground mb-1 line-clamp-1 ${!email.isRead ? 'font-bold' : ''}`}>
                      {email.subject}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {email.snippet}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Email Content */}
        <div className="flex-1 bg-background">
          {selectedEmail ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-border bg-card/30 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{selectedEmail.senderName}</span>
                      <span>•</span>
                      <span>{selectedEmail.sender}</span>
                      <span>•</span>
                      <span>{formatDate(selectedEmail.receivedAt)}</span>
                    </div>
                  </div>
                  {selectedEmail.priority === 'high' && (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      High Priority
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm" className="ml-auto text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div 
                      className="text-foreground leading-relaxed"
                      style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                      dangerouslySetInnerHTML={{ 
                        __html: selectedEmail.bodyText || selectedEmail.snippet 
                      }} 
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-medium text-foreground mb-2">Select an email</h3>
                <p className="text-sm text-muted-foreground">Choose an email from the list to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

