'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Mail, 
  CheckSquare, 
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
}

interface Email {
  id: string;
  subject: string;
  sender: string;
  senderName: string;
  snippet: string;
  receivedAt: string;
  priority: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  description: string;
  category: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, emailsRes, tasksRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/calendar/events`),
        fetch(`${API_BASE}/emails/unread?limit=10`),
        fetch(`${API_BASE}/tasks?status=pending`),
        fetch(`${API_BASE}/agent/daily-summary`, { method: 'POST' }),
      ]);

      const eventsData = await eventsRes.json();
      const emailsData = await emailsRes.json();
      const tasksData = await tasksRes.json();
      const summaryData = await summaryRes.json();

      setEvents(eventsData.data || []);
      setEmails(emailsData.data || []);
      setTasks(tasksData.data || []);
      setAiSummary(summaryData.data?.text || 'AI summary not available');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your workspace...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Dashboard"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchData}
          className="bg-muted/50 backdrop-blur-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        {/* AI Summary Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            <h3 className="font-medium text-foreground">AI Daily Summary</h3>
          </div>
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6 shadow-sm">
            <ScrollArea className="h-[120px] w-full">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {aiSummary}
              </p>
            </ScrollArea>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{events.length}</p>
                <p className="text-xs text-muted-foreground">Calendar Events</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{emails.length}</p>
                <p className="text-xs text-muted-foreground">Unread Emails</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
                <p className="text-xs text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="emails" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-4">
            <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 overflow-hidden">
              <div className="p-4 border-b border-border">
                <h4 className="font-medium text-foreground">Your Schedule</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {events.length === 0 ? 'No events today' : `${events.length} events scheduled`}
                </p>
              </div>
              <ScrollArea className="h-[400px] w-full p-4">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No calendar events for today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                        <h5 className="font-medium text-foreground mb-1">{event.title}</h5>
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.start)} - {formatTime(event.end)}
                          </span>
                          {event.location && <span>📍 {event.location}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Emails Tab */}
          <TabsContent value="emails" className="mt-4">
            <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 overflow-hidden">
              <div className="p-4 border-b border-border">
                <h4 className="font-medium text-foreground">Unread Messages</h4>
                <p className="text-sm text-muted-foreground mt-1">{emails.length} messages need your attention</p>
              </div>
              <ScrollArea className="h-[400px] w-full p-4">
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div key={email.id} className="p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h5 className="font-medium text-foreground flex-1 line-clamp-1">{email.subject}</h5>
                        {email.priority === 'high' && (
                          <Badge variant="destructive" className="shrink-0 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            High
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">From: {email.senderName}</p>
                      <p className="text-sm text-foreground/80 line-clamp-2 mb-2">{email.snippet}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(email.receivedAt)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 overflow-hidden">
              <div className="p-4 border-b border-border">
                <h4 className="font-medium text-foreground">Active Tasks</h4>
                <p className="text-sm text-muted-foreground mt-1">{tasks.length} tasks pending</p>
              </div>
              <ScrollArea className="h-[400px] w-full p-4">
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-foreground flex-1">{task.title}</h5>
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>📁 {task.category}</span>
                        <span>📅 {formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
