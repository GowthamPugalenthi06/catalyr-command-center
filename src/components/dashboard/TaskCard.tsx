import { cn } from '@/lib/utils';
import { Task } from '@/types/catalyr';
import { Clock, AlertCircle, CheckCircle2, Loader2, Eye, Bot, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

const priorityStyles = {
  critical: 'border-l-destructive bg-destructive/5',
  high: 'border-l-warning bg-warning/5',
  medium: 'border-l-primary bg-primary/5',
  low: 'border-l-muted-foreground bg-muted/30',
};

const priorityBadges = {
  critical: 'bg-destructive/20 text-destructive',
  high: 'bg-warning/20 text-warning',
  medium: 'bg-primary/20 text-primary',
  low: 'bg-muted text-muted-foreground',
};

const statusIcons = {
  pending: Clock,
  in_progress: Loader2,
  review: Eye,
  completed: CheckCircle2,
  stuck: AlertCircle,
  declined: XCircle,
};

const statusStyles = {
  pending: 'text-muted-foreground',
  in_progress: 'text-primary animate-spin',
  review: 'text-warning',
  completed: 'text-success',
  stuck: 'text-destructive',
  declined: 'text-destructive',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const StatusIcon = statusIcons[task.status];
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        "glass-card-hover p-4 rounded-xl border-l-4 transition-all cursor-pointer hover:scale-[1.01]",
        priorityStyles[task.priority]
      )}>
      <div className="flex items-start gap-3">
        <StatusIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", statusStyles[task.status])} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-foreground">{task.title}</h3>
            <span className={cn("text-xs font-semibold px-2 py-1 rounded-md uppercase", priorityBadges[task.priority])}>
              {task.priority}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {task.tags && task.tags.length > 0 && task.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                {(task.assignee.avatar === '🤖' || task.assignee.avatar === 'SYSTEM' || task.assignee.avatar === 'Bot') ? (
                  <Bot className="w-4 h-4 text-primary" />
                ) : (
                  task.assignee.avatar
                )}
              </span>
              <span className="text-sm text-muted-foreground">{task.assignee.name}</span>
            </div>

            <div className={cn(
              "flex items-center gap-1.5 text-xs",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
            </div>
          </div>

          {task.progress > 0 && task.status !== 'completed' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">{task.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
