import { cn } from '@/lib/utils';
import { schedule } from '@/data/mockData';
import { format } from 'date-fns';
import { Clock, Briefcase, Coffee, Users } from 'lucide-react';

const blockStyles = {
  deep_work: {
    bg: 'bg-primary/10 border-primary/30',
    icon: Briefcase,
    label: 'Deep Work',
    iconColor: 'text-primary',
  },
  meeting: {
    bg: 'bg-secondary/10 border-secondary/30',
    icon: Users,
    label: 'Meeting',
    iconColor: 'text-secondary',
  },
  admin: {
    bg: 'bg-warning/10 border-warning/30',
    icon: Clock,
    label: 'Admin',
    iconColor: 'text-warning',
  },
  break: {
    bg: 'bg-success/10 border-success/30',
    icon: Coffee,
    label: 'Break',
    iconColor: 'text-success',
  },
};

export function ScheduleView() {
  const now = new Date();
  const currentHour = now.getHours();

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Today's Schedule</h2>
        <div className="flex items-center gap-4">
          {Object.entries(blockStyles).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={cn("w-3 h-3 rounded", style.bg, "border")} />
              <span>{style.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="relative">
          {/* Time grid */}
          <div className="space-y-0">
            {hours.map((hour) => {
              const isCurrentHour = hour === currentHour;
              const blocksAtHour = schedule.filter((block) => {
                const blockHour = new Date(block.startTime).getHours();
                return blockHour === hour;
              });

              return (
                <div key={hour} className="flex gap-4 min-h-[60px]">
                  {/* Time label */}
                  <div className={cn(
                    "w-16 text-sm font-medium pt-2 flex-shrink-0",
                    isCurrentHour ? "text-primary" : "text-muted-foreground"
                  )}>
                    {format(new Date().setHours(hour, 0), 'h a')}
                  </div>

                  {/* Content area */}
                  <div className="flex-1 border-t border-border/50 relative">
                    {isCurrentHour && (
                      <div className="absolute left-0 right-0 top-0 h-px bg-primary z-10">
                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-primary rounded-full animate-pulse" />
                      </div>
                    )}

                    {blocksAtHour.map((block) => {
                      const style = blockStyles[block.type];
                      const Icon = style.icon;
                      const startHour = new Date(block.startTime).getHours();
                      const endHour = new Date(block.endTime).getHours();
                      const duration = endHour - startHour;

                      return (
                        <div
                          key={block.id}
                          className={cn(
                            "absolute left-0 right-0 rounded-xl border p-3 transition-all hover:scale-[1.02] cursor-pointer",
                            style.bg
                          )}
                          style={{
                            height: `${duration * 60 - 8}px`,
                            top: '4px',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={cn("w-4 h-4 mt-0.5", style.iconColor)} />
                            <div>
                              <p className="font-medium text-foreground text-sm">{block.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(block.startTime), 'h:mm a')} - {format(new Date(block.endTime), 'h:mm a')}
                              </p>
                              {block.agent && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span>{block.agent.avatar}</span>
                                  <span className="text-xs text-muted-foreground">{block.agent.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
