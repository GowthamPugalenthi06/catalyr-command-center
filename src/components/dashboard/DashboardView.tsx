import { MetricCard } from './MetricCard';
import { TaskCard } from './TaskCard';
import { AgentCard } from './AgentCard';
import { GrowthChart } from './GrowthChart';
import { agents, tasks, metrics } from '@/data/mockData';
import { Target, CheckCircle2, DollarSign, Zap, Mail, TrendingUp } from 'lucide-react';

export function DashboardView() {
  const activeAgents = agents.filter(a => a.status === 'active').slice(0, 5);
  const priorityTasks = tasks.filter(t => t.status !== 'completed').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
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
          label="Agent Efficiency"
          value={metrics.agentEfficiency.value}
          change={metrics.agentEfficiency.change}
          trend={metrics.agentEfficiency.trend}
          icon={Zap}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <GrowthChart />

          {/* Priority Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Priority Tasks</h3>
              <span className="text-sm text-muted-foreground">{priorityTasks.length} active</span>
            </div>
            <div className="space-y-3">
              {priorityTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Agents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Active Agents</h3>
            <span className="text-sm text-muted-foreground">{activeAgents.length} online</span>
          </div>
          <div className="space-y-3">
            {activeAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} compact />
            ))}
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-2xl p-5 mt-6">
            <h4 className="font-medium text-foreground mb-4">Quick Stats</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Emails Sent</span>
                </div>
                <span className="font-semibold text-foreground">{metrics.emailsSent.value.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Conversion Rate</span>
                </div>
                <span className="font-semibold text-success">{metrics.conversionRate.value}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
