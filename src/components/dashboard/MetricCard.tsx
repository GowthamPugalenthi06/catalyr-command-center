import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({ label, value, change, trend, icon: Icon, className }: MetricCardProps) {
  return (
    <div className={cn(
      "glass-card-hover p-6 rounded-2xl group",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
          trend === 'up' && "text-success bg-success/10",
          trend === 'down' && "text-destructive bg-destructive/10",
          trend === 'neutral' && "text-muted-foreground bg-muted"
        )}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend === 'neutral' && <Minus className="w-3 h-3" />}
          <span>{change > 0 ? '+' : ''}{change}%</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
