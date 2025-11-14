'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, Mail, CalendarDays, X } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export function TaskDetailModal({ task, open, onClose, onStatusChange }: TaskDetailModalProps) {
  if (!task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                {task.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getPriorityColor(task.priority)} border`}>
                  {task.priority.toUpperCase()} Priority
                </Badge>
                <Badge className={`${getStatusColor(task.status)} border`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {task.category && (
                  <Badge variant="outline" className="bg-muted/50">
                    <Tag className="w-3 h-3 mr-1" />
                    {task.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-foreground leading-relaxed">
              {task.description || 'No description provided'}
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.dueDate && (
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Due Date</span>
                </div>
                <p className="text-foreground font-medium">{formatDate(task.dueDate)}</p>
              </div>
            )}

            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Created</span>
              </div>
              <p className="text-foreground font-medium">{formatDate(task.createdAt)}</p>
            </div>

            {task.completedAt && (
              <div className="p-4 rounded-lg border border-border bg-green-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Completed</span>
                </div>
                <p className="text-foreground font-medium">{formatDate(task.completedAt)}</p>
              </div>
            )}
          </div>

          {/* Related Items - Placeholder for future features */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Related Items
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 text-center text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mx-auto mb-1" />
                No related emails found
              </div>
              <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 text-center text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 mx-auto mb-1" />
                No related calendar events found
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                Last updated {formatDate(task.updatedAt)}
              </p>
            </div>
            
            {task.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(task.status === 'pending' ? 'in_progress' : 'completed')}
                className="bg-primary/10 text-primary hover:bg-primary/20"
              >
                Mark as {task.status === 'pending' ? 'In Progress' : 'Completed'}
              </Button>
            )}

            {task.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('pending')}
                className="bg-muted/50"
              >
                Reopen Task
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

