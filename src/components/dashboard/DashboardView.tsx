import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import { AgentCard } from './AgentCard';
import { agents, tasks, metrics, schedule } from '@/data/mockData';
import { 
  Target, CheckCircle2, DollarSign, Zap, Mail, TrendingUp, 
  Clock, Users, Activity, ArrowUpRight, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export function DashboardView() {
  const activeAgents = agents.filter(a => a.status === 'active').slice(0, 4);
  const priorityTasks = tasks.filter(t => t.status !== 'completed').slice(0, 2);
  const upcomingBlocks = schedule.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card rounded-2xl p-6 border-gradient relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back to your <span className="text-gradient-primary">AI Command Center</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Your autonomous enterprise is running smoothly. {activeAgents.length} agents active, 
            processing {tasks.filter(t => t.status === 'in_progress').length} tasks.
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
          { label: 'Total Leads', value: metrics.leads.value, change: metrics.leads.change, icon: Target, color: 'primary' },
          { label: 'Tasks Done', value: metrics.tasksCompleted.value, change: metrics.tasksCompleted.change, icon: CheckCircle2, color: 'success' },
          { label: 'Revenue', value: metrics.revenue.value, change: metrics.revenue.change, icon: DollarSign, color: 'warning' },
          { label: 'Efficiency', value: metrics.agentEfficiency.value, change: metrics.agentEfficiency.change, icon: Zap, color: 'secondary' },
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
            {activeAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} compact />
            ))}
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
            {priorityTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
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
            {upcomingBlocks.map((block) => (
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
            ))}
          </div>

          {/* System Health */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">System Health</h4>
            <div className="space-y-3">
              {[
                { label: 'API Response', value: '45ms', status: 'good' },
                { label: 'Queue Size', value: '12 jobs', status: 'good' },
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
