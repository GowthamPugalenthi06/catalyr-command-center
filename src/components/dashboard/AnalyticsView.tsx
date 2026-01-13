import { GrowthChart } from './GrowthChart';
import { MetricCard } from './MetricCard';
import { metrics } from '@/data/mockData';
import { Target, CheckCircle2, DollarSign, Zap, Mail, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const agentPerformance = [
  { name: 'Orion', tasks: 284, efficiency: 98 },
  { name: 'Aurora', tasks: 184, efficiency: 94 },
  { name: 'Nova', tasks: 165, efficiency: 97 },
  { name: 'Titan', tasks: 92, efficiency: 91 },
  { name: 'Scout', tasks: 215, efficiency: 92 },
];

const leadSources = [
  { name: 'LinkedIn', value: 45, color: 'hsl(174, 72%, 56%)' },
  { name: 'Website', value: 25, color: 'hsl(263, 70%, 58%)' },
  { name: 'Referral', value: 18, color: 'hsl(38, 92%, 50%)' },
  { name: 'Conference', value: 12, color: 'hsl(142, 76%, 46%)' },
];

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Analytics & Insights</h2>
        <p className="text-sm text-muted-foreground">Track your company's growth and AI performance</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Leads"
          value={metrics.leads.value}
          change={metrics.leads.change}
          trend={metrics.leads.trend}
          icon={Target}
        />
        <MetricCard
          label="Tasks Completed"
          value={metrics.tasksCompleted.value}
          change={metrics.tasksCompleted.change}
          trend={metrics.tasksCompleted.trend}
          icon={CheckCircle2}
        />
        <MetricCard
          label="Revenue"
          value={metrics.revenue.value}
          change={metrics.revenue.change}
          trend={metrics.revenue.trend}
          icon={DollarSign}
        />
        <MetricCard
          label="Conversion Rate"
          value={metrics.conversionRate.value}
          change={metrics.conversionRate.change}
          trend={metrics.conversionRate.trend}
          icon={TrendingUp}
        />
      </div>

      <GrowthChart />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Agent Performance</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentPerformance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 8%)',
                    border: '1px solid hsl(217, 33%, 17%)',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                />
                <Bar dataKey="tasks" fill="hsl(174, 72%, 56%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">Lead Sources</h3>
          </div>
          <div className="h-[280px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 8%)',
                    border: '1px solid hsl(217, 33%, 17%)',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="space-y-3 ml-4">
              {leadSources.map((source) => (
                <div key={source.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-sm text-muted-foreground">{source.name}</span>
                  <span className="text-sm font-medium text-foreground ml-auto">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
