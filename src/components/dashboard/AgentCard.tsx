import { cn } from '@/lib/utils';
import { Agent } from '@/types/catalyr';

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
  onClick?: (agent: Agent) => void;
}

const rankColors = {
  L1: 'from-primary to-primary/60 border-primary/30',
  L2: 'from-secondary to-secondary/60 border-secondary/30',
  L3: 'from-warning to-warning/60 border-warning/30',
  L4: 'from-success to-success/60 border-success/30',
  L5: 'from-muted-foreground to-muted border-muted-foreground/30',
};

const statusColors = {
  active: 'bg-success',
  pending: 'bg-warning',
  idle: 'bg-muted-foreground',
  offline: 'bg-destructive',
};

export function AgentCard({ agent, compact = false, onClick }: AgentCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 glass-card-hover rounded-xl">
        <div className="relative">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br",
            rankColors[agent.rank]
          )}>
            {agent.avatar}
          </div>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
            statusColors[agent.status]
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
        </div>
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-md",
          agent.rank === 'L1' && "bg-primary/20 text-primary",
          agent.rank === 'L2' && "bg-secondary/20 text-secondary",
          agent.rank === 'L3' && "bg-warning/20 text-warning",
          agent.rank === 'L4' && "bg-success/20 text-success",
          agent.rank === 'L5' && "bg-muted text-muted-foreground",
        )}>
          {agent.rank}
        </span>
      </div>
    );
  }

  return (
    <div className="glass-card-hover p-5 rounded-2xl group">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br border",
            rankColors[agent.rank]
          )}>
            {agent.avatar}
          </div>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
            statusColors[agent.status]
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-md",
              agent.rank === 'L1' && "bg-primary/20 text-primary",
              agent.rank === 'L2' && "bg-secondary/20 text-secondary",
              agent.rank === 'L3' && "bg-warning/20 text-warning",
              agent.rank === 'L4' && "bg-success/20 text-success",
              agent.rank === 'L5' && "bg-muted text-muted-foreground",
            )}>
              {agent.rank}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{agent.role}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded-md">{agent.department}</span>
            {agent.model && (
              <span className="px-2 py-1 bg-muted rounded-md font-mono">{agent.model}</span>
            )}
          </div>
        </div>
      </div>

      {agent.currentTask && (
        <div className="mt-4 p-3 bg-muted/50 rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Current Task</p>
          <p className="text-sm text-foreground truncate">{agent.currentTask}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Tasks: </span>
          <span className="font-semibold text-foreground">{agent.tasksCompleted.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${agent.performance}%` }}
            />
          </div>
          <span className="text-foreground font-medium">{agent.performance}%</span>
        </div>
      </div>

      {/* Click to view details overlay */}
      <button
        onClick={() => onClick && onClick(agent)}
        className="absolute inset-0 w-full h-full opacity-0 hover:bg-transparent cursor-pointer"
        aria-label={`View details for ${agent.name}`}
      />
    </div>
  );
}
