import { useState } from 'react';
import { cn } from '@/lib/utils';
import { agents, leads, metrics } from '@/data/mockData';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Target, 
  DollarSign, Activity, ArrowUpRight, Calendar, Clock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 12500, leads: 45, tasks: 120 },
  { month: 'Feb', revenue: 18200, leads: 62, tasks: 145 },
  { month: 'Mar', revenue: 15800, leads: 58, tasks: 132 },
  { month: 'Apr', revenue: 22400, leads: 78, tasks: 167 },
  { month: 'May', revenue: 28100, leads: 92, tasks: 189 },
  { month: 'Jun', revenue: 24500, leads: 85, tasks: 178 },
];

const agentMetrics = [
  { subject: 'Speed', A: 92, fullMark: 100 },
  { subject: 'Accuracy', A: 88, fullMark: 100 },
  { subject: 'Efficiency', A: 95, fullMark: 100 },
  { subject: 'Output', A: 78, fullMark: 100 },
  { subject: 'Quality', A: 91, fullMark: 100 },
];

const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  tasks: Math.floor(Math.random() * 20) + 5,
  emails: Math.floor(Math.random() * 15) + 2,
}));

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const topAgents = [...agents].sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 5);
  const hotLeads = leads.filter(l => l.status === 'hot').length;
  const warmLeads = leads.filter(l => l.status === 'warm').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground">Deep insights into your autonomous enterprise</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                timeRange === range 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '$108.5K', change: 23.5, icon: DollarSign, trend: 'up' },
          { label: 'Lead Conversion', value: '12.4%', change: 2.1, icon: Target, trend: 'up' },
          { label: 'Avg Response Time', value: '1.2s', change: -15, icon: Clock, trend: 'up' },
          { label: 'Agent Utilization', value: '87%', change: 5.3, icon: Activity, trend: 'up' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                kpi.trend === 'up' ? "bg-success/10" : "bg-destructive/10"
              )}>
                <kpi.icon className={cn(
                  "w-5 h-5",
                  kpi.trend === 'up' ? "text-success" : "text-destructive"
                )} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                kpi.change > 0 ? "text-success" : "text-destructive"
              )}>
                {kpi.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(kpi.change)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Revenue & Growth</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-muted-foreground">Leads</span>
              </div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Radar */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-6">Agent Capabilities</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={agentMetrics}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Radar name="Performance" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-6">24-Hour Activity</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Top Performers</h3>
            <span className="text-xs text-muted-foreground">By tasks completed</span>
          </div>
          <div className="space-y-4">
            {topAgents.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-3">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  i === 0 && "bg-warning/20 text-warning",
                  i === 1 && "bg-muted text-muted-foreground",
                  i === 2 && "bg-warning/10 text-warning/70",
                  i > 2 && "bg-muted/50 text-muted-foreground"
                )}>
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  {agent.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{agent.tasksCompleted.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">tasks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
