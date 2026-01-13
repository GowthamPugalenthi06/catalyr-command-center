import { cn } from '@/lib/utils';
import { agents } from '@/data/mockData';
import { AgentCard } from './AgentCard';
import { ChevronDown } from 'lucide-react';

export function AgentHierarchy() {
  const l1Agents = agents.filter(a => a.rank === 'L1');
  const l2Agents = agents.filter(a => a.rank === 'L2');
  const l3Agents = agents.filter(a => a.rank === 'L3');
  const l4Agents = agents.filter(a => a.rank === 'L4');
  const l5Agents = agents.filter(a => a.rank === 'L5');

  const tiers = [
    { rank: 'L1', label: 'Executive (C-Suite)', agents: l1Agents, color: 'primary' },
    { rank: 'L2', label: 'Senior Management', agents: l2Agents, color: 'secondary' },
    { rank: 'L3', label: 'Management', agents: l3Agents, color: 'warning' },
    { rank: 'L4', label: 'Specialists', agents: l4Agents, color: 'success' },
    { rank: 'L5', label: 'Support', agents: l5Agents, color: 'muted' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Agent Hierarchy</h2>
          <p className="text-sm text-muted-foreground">Your digital workforce organized by rank</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Active Agents:</span>
          <span className="text-foreground font-semibold">{agents.filter(a => a.status === 'active').length}/{agents.length}</span>
        </div>
      </div>

      <div className="space-y-8">
        {tiers.map((tier, tierIndex) => (
          <div key={tier.rank} className="relative">
            {/* Tier header */}
            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                "px-3 py-1 rounded-lg text-sm font-bold",
                tier.color === 'primary' && "bg-primary/20 text-primary",
                tier.color === 'secondary' && "bg-secondary/20 text-secondary",
                tier.color === 'warning' && "bg-warning/20 text-warning",
                tier.color === 'success' && "bg-success/20 text-success",
                tier.color === 'muted' && "bg-muted text-muted-foreground",
              )}>
                {tier.rank}
              </span>
              <span className="text-muted-foreground">{tier.label}</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">{tier.agents.length} agents</span>
            </div>

            {/* Agent cards */}
            <div className={cn(
              "grid gap-4",
              tier.agents.length === 1 ? "grid-cols-1 max-w-md mx-auto" :
              tier.agents.length <= 2 ? "grid-cols-1 md:grid-cols-2" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {tier.agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>

            {/* Connection line */}
            {tierIndex < tiers.length - 1 && tier.agents.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-gradient-to-b from-border to-transparent" />
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
