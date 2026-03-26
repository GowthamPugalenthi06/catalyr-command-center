import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import { AgentCard } from './AgentCard';
import {
  Target, CheckCircle2, DollarSign, Zap, Mail, TrendingUp,
  Clock, Users, Activity, ArrowUpRight, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export function DashboardView() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsRes, tasksRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/tasks')
        ]);
        setAgents(await agentsRes.json());
        const rawTasks = await tasksRes.json();

        // Map backend tasks to frontend structure
        const mappedTasks = rawTasks.map((t: any) => ({
          ...t,
          id: t._id,
          status: mapStatus(t.status),
          priority: mapPriority(t.priority),
          tags: t.tags || [],
          assignee: t.assignee || {
            name: 'System',
            avatar: 'SYSTEM',
            role: 'Coordinator'
          }
        }));

        setTasks(mappedTasks);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const mapStatus = (s: string) => {
    const map: Record<string, string> = {
      'PENDING': 'pending',
      'IN_PROGRESS': 'in_progress',
      'WAITING_APPROVAL': 'review',
      'DONE': 'completed',
      'FAILED': 'stuck'
    };
    return map[s] || 'pending';
  };

  const mapPriority = (p: number | string) => {
    if (typeof p === 'string') return p.toLowerCase();
    if (p <= 1) return 'critical';
    if (p === 2) return 'high';
    if (p === 3) return 'medium';
    return 'low';
  };

  const activeAgents = agents.filter((a: any) => a.status === 'active').slice(0, 4);
  const priorityTasks = tasks.filter((t: any) => t.status !== 'completed').slice(0, 2);

  const upcomingBlocks = tasks
    .filter((t: any) => t.startTime && new Date(t.startTime) > new Date())
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3)
    .map((t: any) => ({
      id: t._id,
      title: t.title,
      type: t.type || 'deep_work',
      startTime: new Date(t.startTime),
      endTime: t.endTime ? new Date(t.endTime) : new Date(new Date(t.startTime).getTime() + 60 * 60 * 1000)
    }));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'completed' || t.status === 'DONE').length;
  const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card rounded-2xl p-6 border-gradient relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back to your <span className="text-primary">AI Command Center</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Your autonomous enterprise is running smoothly. {activeAgents.length} agents active,
            processing {tasks.filter((t: any) => t.status === 'in_progress').length} tasks.
          </p>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">98.7% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: '45', change: 12, icon: Target, color: 'primary' },
          { label: 'Tasks Done', value: completedTasks.toString(), change: 5, icon: CheckCircle2, color: 'success' },
          { label: 'Revenue', value: '$0.00', change: 0, icon: DollarSign, color: 'warning' },
          { label: 'Efficiency', value: `${efficiency}%`, change: 2.4, icon: Zap, color: 'secondary' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card-hover rounded-xl p-4 group">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={cn(
                "w-5 h-5",
                stat.color === 'primary' && "text-primary",
                stat.color === 'success' && "text-success",
                stat.color === 'warning' && "text-warning",
                stat.color === 'secondary' && "text-secondary",
              )} />
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                stat.change > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {stat.change > 0 ? '+' : ''}{stat.change}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left - Agent Status */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Active Workforce
            </h3>
            <span className="text-xs text-muted-foreground">{activeAgents.length} online</span>
          </div>
          <div className="space-y-3">
            {activeAgents.map((agent: any) => (
              <AgentCard key={agent._id} agent={{ ...agent, id: agent._id }} compact />
            ))}
            {loading && <p className="text-xs text-muted-foreground">Loading agents...</p>}
          </div>
        </div>

        {/* Center - Priority Tasks */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Priority Queue
            </h3>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {priorityTasks.map((task: any) => (
              <TaskCard key={task._id} task={{ ...task, id: task._id, assignee: { name: 'System', avatar: 'SYSTEM' } }} />
            ))}
            {loading && <p className="text-xs text-muted-foreground">Loading tasks...</p>}
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-xl p-4 mt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Task', icon: CheckCircle2 },
                { label: 'Send Email', icon: Mail },
                { label: 'Add Lead', icon: Target },
                { label: 'Schedule', icon: Calendar },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => toast({ title: action.label, description: "Action Triggered" })}
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Today's Schedule */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Today's Blocks
            </h3>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-3">
            {upcomingBlocks.length > 0 ? upcomingBlocks.map((block: any) => (
              <div
                key={block.id}
                className={cn(
                  "p-3 rounded-lg border-l-2",
                  block.type === 'deep_work' && "bg-primary/5 border-primary",
                  block.type === 'meeting' && "bg-secondary/5 border-secondary",
                  block.type === 'admin' && "bg-warning/5 border-warning",
                  block.type === 'break' && "bg-success/5 border-success",
                )}
              >
                <p className="font-medium text-sm text-foreground">{block.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(block.startTime), 'h:mm a')} - {format(new Date(block.endTime), 'h:mm a')}
                </p>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">No upcoming blocks today.</p>
            )}
          </div>

          {/* System Health */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">System Health</h4>
            <div className="space-y-3">
              {[
                { label: 'API Response', value: '45ms', status: 'good' },
                { label: 'Queue Size', value: `${tasks.length} jobs`, status: 'good' },
                { label: 'Memory', value: '67%', status: 'warning' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{item.value}</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.status === 'good' && "bg-success",
                      item.status === 'warning' && "bg-warning",
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
