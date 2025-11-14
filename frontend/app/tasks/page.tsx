'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import TaskBoard from "@/components/kanban/task-board";
import { Column } from "@/components/kanban/task-column";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { TaskDetailModal } from "@/components/task-detail-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  RefreshCw,
  Plus,
  Filter
} from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

interface BackendTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BackendTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<BackendTask[]>([]);
  const [filters, setFilters] = useState({
    priority: { low: true, medium: true, high: true },
    category: { all: true }
  });
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'pending',
      title: 'To Do',
      color: 'muted',
      tasks: []
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: 'blue',
      tasks: []
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'accent',
      tasks: []
    }
  ]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      const tasks: BackendTask[] = data.data || [];
      setAllTasks(tasks); // Store all tasks for modal access
      
      // Convert backend tasks to kanban format and apply filters
      const kanbanTasks = tasks
        .filter(task => {
          // Apply priority filter
          const priorityKey = task.priority as 'low' | 'medium' | 'high';
          return filters.priority[priorityKey] !== false;
        })
        .map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || 'No description provided',
          tag: {
            color: task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'blue',
            label: task.category || 'General'
          },
          dueDate: formatDueDate(task.dueDate),
          assignees: 1,
          progress: {
            completed: task.status === 'completed' ? 1 : 0,
            total: 1
          }
        }));

      // Distribute tasks to columns based on status
      const newColumns = columns.map(column => ({
        ...column,
        tasks: kanbanTasks.filter(task => {
          const backendTask = tasks.find(t => t.id === task.id);
          if (backendTask?.status === 'pending' && column.id === 'pending') return true;
          if (backendTask?.status === 'in_progress' && column.id === 'in_progress') return true;
          if (backendTask?.status === 'completed' && column.id === 'completed') return true;
          return false;
        })
      }));

      setColumns(newColumns);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]); // Re-fetch when filters change

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const handleTaskMove = async (taskId: string, fromColumn: string, toColumn: string) => {
    console.log(`Task ${taskId} moved from ${fromColumn} to ${toColumn}`);
    
    try {
      // Update task status on the backend
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toColumn })
      });

      const data = await response.json();
      
      if (!data.success && !response.ok) {
        throw new Error(data.error || 'Failed to update task status');
      }

      console.log('✅ Task status updated successfully on backend');
      
      // Optionally refresh tasks to ensure sync
      // fetchTasks();
    } catch (error) {
      console.error('❌ Failed to update task status:', error);
      // Optionally show an error toast
      // You might want to revert the UI change here
      fetchTasks(); // Refresh to revert to actual state
    }
  };

  return (
    <AppLayout
      title="Tasks"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTasks}
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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <h1 className="text-3xl font-bold text-foreground">Task Board</h1>
            </div>
            <p className="text-muted-foreground">
              Drag and drop tasks to update their status
            </p>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-muted/50 backdrop-blur-sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filters.priority.low}
                  onCheckedChange={(checked) => 
                    setFilters({...filters, priority: {...filters.priority, low: checked}})
                  }
                >
                  Low Priority
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.priority.medium}
                  onCheckedChange={(checked) => 
                    setFilters({...filters, priority: {...filters.priority, medium: checked}})
                  }
                >
                  Medium Priority
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.priority.high}
                  onCheckedChange={(checked) => 
                    setFilters({...filters, priority: {...filters.priority, high: checked}})
                  }
                >
                  High Priority
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              className="bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setIsNewTaskOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border backdrop-blur-sm bg-card/30 p-6">
                <TaskBoard
                  initialColumns={columns}
                  onTaskMove={handleTaskMove}
                  onTaskClick={(taskId) => {
                    const task = allTasks.find(t => t.id === taskId);
                    if (task) {
                      setSelectedTask(task);
                      setIsTaskDetailOpen(true);
                    }
                  }}
                />
          </div>
        )}

          {/* New Task Dialog */}
          <NewTaskDialog
            open={isNewTaskOpen}
            onOpenChange={setIsNewTaskOpen}
            onTaskCreated={fetchTasks}
          />

          {/* Task Detail Modal */}
          <TaskDetailModal
            task={selectedTask as any}
            open={isTaskDetailOpen}
            onClose={() => {
              setIsTaskDetailOpen(false);
              setSelectedTask(null);
            }}
            onStatusChange={async (taskId, newStatus) => {
              try {
                await fetch(`${API_BASE}/tasks/${taskId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus })
                });
                fetchTasks();
                setIsTaskDetailOpen(false);
              } catch (error) {
                console.error("Failed to update task:", error);
              }
            }}
          />
        </div>
      </AppLayout>
    );
  }

