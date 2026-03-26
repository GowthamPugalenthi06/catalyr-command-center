import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Video, UserX, CheckCircle2, Clock } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task } from '@/types/catalyr';
import { TaskDetailModal } from './TaskDetailModal';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyAgenda } from './DailyAgenda';

const getEventColor = (type: string, status: string) => {
  if (type === 'meeting') return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
  if (type === 'leave') return 'bg-rose-500/15 text-rose-700 border-rose-500/30';
  if (status === 'completed') return 'bg-slate-100 text-slate-500 border-slate-200';
  return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
};

export function ScheduleView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const { toast } = useToast();

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    type: 'meeting',
    startTime: ''
  });

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.map((t: any) => ({
        ...t,
        id: t._id,
        startDate: new Date(t.startTime || t.deadline),
        deadline: new Date(t.deadline),
        createdAt: new Date(t.createdAt),
        type: t.type || 'task'
      })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast({ title: "Error", description: "Title and Date are required", variant: "destructive" });
      return;
    }

    const dateObj = new Date(newEvent.date);
    if (newEvent.startTime) {
      const [hours, minutes] = newEvent.startTime.split(':');
      dateObj.setHours(parseInt(hours), parseInt(minutes));
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          deadline: dateObj,
          startTime: dateObj,
          status: 'PENDING',
          priority: 2,
          type: newEvent.type
        })
      });

      if (res.ok) {
        toast({ title: "Success", description: "Event created successfully." });
        setIsNewEventOpen(false);
        setNewEvent({ title: '', description: '', date: '', type: 'meeting', startTime: '' });
        fetchTasks();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      let backendStatus = newStatus.toUpperCase();
      if (newStatus === 'review') backendStatus = 'WAITING_APPROVAL';
      if (newStatus === 'completed') backendStatus = 'DONE';

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatus })
      });

      if (res.ok) {
        toast({ title: "Updated", description: `Updated status to ${newStatus}` });
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: "Deleted", description: "Event removed permanently" });
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    }
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="p-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 rounded-md border p-1 bg-card">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="font-semibold w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
          </div>
        </div>

        <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to Schedule</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Event Type</Label>
                <Select value={newEvent.type} onValueChange={(val) => setNewEvent({ ...newEvent, type: val })}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task / Deadline</SelectItem>
                    <SelectItem value="leave">Leave / OOO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g. Client Call" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Details..." />
              </div>
            </div>
            <DialogFooter><Button onClick={handleCreateEvent}>Create Event</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Tabs */}
      <Tabs defaultValue="agenda" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="agenda" className="px-6">Today's Agenda</TabsTrigger>
            <TabsTrigger value="calendar" className="px-6">Full Calendar</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda">
          <DailyAgenda tasks={tasks} onTaskClick={setSelectedTask} />
        </TabsContent>

        <TabsContent value="calendar">
          {/* Calendar Grid */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="grid grid-cols-7 border-b bg-muted/40">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[140px] divide-x divide-y">
              {days.map((day) => {
                const dayTasks = tasks.filter(t => t.startDate && isSameDay(new Date(t.startDate), day));
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "p-2 relative hover:bg-muted/5 transition-colors group",
                      !isCurrentMonth && "bg-muted/10 text-muted-foreground"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                      isSameDay(day, new Date()) ? "bg-primary text-white" : "text-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>

                    <div className="space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                      {dayTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                          className={cn(
                            "text-[10px] px-2 py-1 rounded border truncate cursor-pointer font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity",
                            getEventColor(task.type || 'task', task.status)
                          )}
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full",
                            task.type === 'meeting' ? "bg-emerald-500" :
                              task.type === 'leave' ? "bg-rose-500" : "bg-blue-500"
                          )} />
                          {task.startDate && format(new Date(task.startDate), 'HH:mm')} {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
