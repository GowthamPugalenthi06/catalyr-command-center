import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Loader2, PlayCircle, CheckCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

type FilterType = 'all' | 'pending' | 'review' | 'completed' | 'declined';

export function TasksView() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();

      const mappedTasks = data.map((t: any) => ({
        id: t._id,
        title: t.title,
        description: t.description,
        assignee: t.assignee || {
          id: 'agent-1', name: 'System', role: 'Coordinator', department: 'Operations', rank: 'L1', status: 'active', avatar: 'SYSTEM', tasksCompleted: 0, performance: 100
        },
        priority: mapPriority(t.priority),
        status: mapStatus(t.status),
        deadline: new Date(t.deadline),
        createdAt: new Date(t.createdAt),
        progress: 0,
        tags: []
      }));

      setTasks(mappedTasks.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mapPriority = (p: number | string): string => {
    if (typeof p === 'string') return p.toLowerCase();
    if (p <= 1) return 'critical';
    if (p === 2) return 'high';
    if (p === 3) return 'medium';
    return 'low';
  };

  const mapStatus = (s: string): string => {
    const map: Record<string, string> = {
      'PENDING': 'pending',
      'IN_PROGRESS': 'pending', // Group in-progress under pending visually
      'REVIEW': 'review',
      'COMPLETED': 'completed',
      'DECLINED': 'declined',
      'FAILED': 'pending', // fallback logic
      // legacy mappings below just for safety
      'WAITING_APPROVAL': 'review',
      'DONE': 'completed'
    };
    return map[s] || 'pending';
  };

  const handleCreateTask = async () => {
    if (!newTask.title) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          deadline: newTask.deadline || new Date(),
          status: 'PENDING',
          priority: 3,
          type: 'task'
        })
      });

      if (res.ok) {
        toast({ title: "Success", description: "Task created successfully." });
        setOpen(false);
        setNewTask({ title: '', description: '', deadline: '' });
        fetchTasks();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      let backendStatus = newStatus.toUpperCase();
      // Enforce direct mapping overrides
      if (newStatus === 'review') backendStatus = 'REVIEW';
      if (newStatus === 'completed') backendStatus = 'COMPLETED';
      if (newStatus === 'declined') backendStatus = 'DECLINED';
      if (newStatus === 'pending') backendStatus = 'PENDING';

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatus })
      });

      if (res.ok) {
        toast({ title: "Updated", description: `Task marked as ${newStatus}` });
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: "Deleted", description: "Task removed permanently" });
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Task Command
          </h1>
          <p className="text-muted-foreground mt-1">Orchestrate your AI workforce.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Assign Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Directive</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Directive Title</Label>
                <Input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Generate Q3 Report" />
              </div>
              <div className="grid gap-2">
                <Label>Details</Label>
                <Textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Specific instructions for the agent..." />
              </div>
            </div>
            <DialogFooter><Button onClick={handleCreateTask}>Dispatch Agent</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Styled Filter Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: 'all', label: 'All Tasks', icon: PlayCircle, color: 'text-foreground' },
          { id: 'pending', label: 'Pending', icon: Clock, color: 'text-muted-foreground' },
          { id: 'review', label: 'Ready for Review', icon: Clock, color: 'text-orange-500' },
          { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-500' },
          { id: 'declined', label: 'Declined', icon: Filter, color: 'text-destructive' }
        ].map((tab: any) => {
          const count = tasks.filter(t => tab.id === 'all' ? true : t.status === tab.id).length;
          const isActive = filter === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200",
                isActive
                  ? "bg-card border-primary shadow-md ring-1 ring-primary/20"
                  : "bg-card/50 border-transparent hover:bg-card hover:border-border/50"
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <h3 className={cn("font-semibold text-sm", isActive ? "text-primary" : "text-muted-foreground")}>{tab.label}</h3>
                <tab.icon className={cn("w-4 h-4", tab.color)} />
              </div>
              <span className="text-2xl font-bold">{count}</span>
              {isActive && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-b-xl" />}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No tasks found in this category.
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={setSelectedTask}
            />
          ))
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={updateTaskStatus}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
