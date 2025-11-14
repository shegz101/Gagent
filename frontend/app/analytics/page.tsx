'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw,
  TrendingUp,
  Calendar,
  Mail,
  CheckSquare,
  Bot,
  Clock,
  AlertCircle
} from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

export default function AnalyticsPage() {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [stats, setStats] = useState({
    events: 0,
    emails: 0,
    tasks: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
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

      setStats({
        events: eventsData.data?.length || 0,
        emails: emailsData.data?.length || 0,
        tasks: tasksData.data?.length || 0
      });

      setAiSummary(summaryData.data?.text || 'AI summary not available');
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <AppLayout
      title="Analytics"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAnalytics}
          disabled={loading}
          className="bg-muted/50 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered insights about your productivity
          </p>
        </div>

        {/* AI Summary Card */}
        <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">AI Daily Summary</h2>
            <Badge variant="secondary" className="ml-auto">
              <Clock className="w-3 h-3 mr-1" />
              Updated now
            </Badge>
          </div>
          <ScrollArea className="h-[200px] w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {aiSummary}
              </p>
            )}
          </ScrollArea>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.events}</p>
                <p className="text-sm text-muted-foreground">Calendar Events</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>5% from last week</span>
            </div>
          </div>

          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.emails}</p>
                <p className="text-sm text-muted-foreground">Unread Emails</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>Needs attention</span>
            </div>
          </div>

          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.tasks}</p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>On track</span>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Productivity Insights</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">Peak productivity hours</p>
                  <p className="text-xs text-muted-foreground">You're most productive between 9 AM - 12 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">Meeting optimization</p>
                  <p className="text-xs text-muted-foreground">Consider batching meetings on Tuesdays & Thursdays</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email response time</p>
                  <p className="text-xs text-muted-foreground">Average response time: 2.5 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-primary/10 border border-primary/20">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Urgent</p>
                  <p className="text-xs text-muted-foreground">3 high-priority emails need immediate attention</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                <Bot className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Schedule optimization</p>
                  <p className="text-xs text-muted-foreground">Free up 2 hours by rescheduling non-critical meetings</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                <CheckSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Task prioritization</p>
                  <p className="text-xs text-muted-foreground">Focus on 5 high-impact tasks today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

