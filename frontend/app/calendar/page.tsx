'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw,
  Clock,
  MapPin,
  Plus,
  Calendar as CalendarIcon
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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    location: '',
    description: '',
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/calendar/events?forceRefresh=true`);
      const data = await res.json();

      const normalized: CalendarEvent[] = (data.data || []).map((e: any) => {
        const startIso = e.start || e.startTime;
        const endIso = e.end || e.endTime;
        const start = new Date(startIso);
        const end = new Date(endIso);

        return {
          id: e.id || e.googleEventId || e._id || Math.random().toString(36).slice(2),
          title: e.title || 'Untitled Event',
          description: e.description || '',
          location: e.location || '',
          start: isNaN(start.getTime()) ? '' : start.toISOString(),
          end: isNaN(end.getTime()) ? '' : end.toISOString(),
        };
      });

      setEvents(normalized);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, start time, and end time",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Event created successfully",
        });
        
        // Reset form and close dialog
        setNewEvent({
          title: '',
          start: '',
          end: '',
          location: '',
          description: '',
        });
        setIsCreateDialogOpen(false);
        
        // Refresh events
        fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const groupEventsByDate = () => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    events.forEach((event) => {
      const date = event.start ? new Date(event.start).toDateString() : 'Invalid Date';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate();

  return (
    <AppLayout
      title="Calendar"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchEvents}
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
            <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          </div>
          <p className="text-muted-foreground">
            {events.length === 0 ? 'No events scheduled' : `${events.length} events scheduled`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
          <Button variant="outline" className="bg-muted/50 backdrop-blur-sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            View Month
          </Button>
        </div>

        {/* Create Event Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new event to your Google Calendar
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Start Time *</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">End Time *</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Event location (optional)"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Event description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={creating}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-12 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No events scheduled</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first event</p>
            <Button 
              className="bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <div key={date} className="space-y-4">
                <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">{formatDate(dayEvents[0].start)}</h2>
                </div>
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6 hover:bg-card/70 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(event.start)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(event.start)} - {formatTime(event.end)}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

