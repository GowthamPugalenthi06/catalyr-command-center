import { Task } from "@/types/catalyr";
import { format, isSameDay, parseISO } from "date-fns";
import { CheckCircle2, Circle, Clock, MoreVertical, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DailyAgendaProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export function DailyAgenda({ tasks, onTaskClick }: DailyAgendaProps) {
    const today = new Date();

    // Filter tasks for today and sort by start time
    const todayTasks = tasks
        .filter(t => {
            const date = t.startTime ? new Date(t.startTime) : (t.deadline ? new Date(t.deadline) : null);
            return date && isSameDay(date, today);
        })
        .sort((a, b) => {
            const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
            const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
            return timeA - timeB;
        });

    if (todayTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed rounded-xl bg-muted/5">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>No tasks scheduled for today.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative ml-4">
            {/* Timeline Line */}
            <div className="absolute left-3.5 top-2 bottom-4 w-[2px] bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" />

            {todayTasks.map((task, index) => {
                const startTime = task.startTime ? new Date(task.startTime) : new Date();
                const isDone = task.status === 'DONE' || task.status === 'COMPLETED';
                const isPending = task.status === 'PENDING' || task.status === 'IN_PROGRESS';

                return (
                    <div
                        key={task.id}
                        className={cn(
                            "relative pl-10 group animate-in fade-in slide-in-from-left-2",
                            // Stagger animation
                            `duration-[${300 + (index * 50)}ms]`
                        )}
                        onClick={() => onTaskClick(task)}
                    >
                        {/* Time Bubble */}
                        <div className={cn(
                            "absolute left-0 top-3 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background z-10 transition-colors shadow-sm",
                            isDone ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground"
                        )}>
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </div>

                        {/* Card */}
                        <Card className={cn(
                            "cursor-pointer transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.99] border-l-4",
                            isDone ? "border-l-primary bg-primary/5" : "border-l-indigo-500 bg-card",
                            // Different border colors based on dept could be cool too
                        )}>
                            <div className="p-4 flex items-start gap-4">
                                {/* Time & Status */}
                                <div className="flex flex-col items-center min-w-[70px] pt-1">
                                    <span className="text-lg font-bold font-mono tracking-tight">
                                        {format(startTime, 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-muted-foreground text-center mt-1 uppercase tracking-wider font-semibold">
                                        {format(startTime, 'a')}
                                    </span>
                                </div>

                                {/* Divider */}
                                <div className="w-[1px] bg-border self-stretch" />

                                {/* Content */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between">
                                        <h3 className={cn(
                                            "font-semibold text-base leading-none",
                                            isDone && "text-muted-foreground line-through decoration-primary/30"
                                        )}>
                                            {task.title}
                                        </h3>
                                        <Badge variant={isDone ? "secondary" : "default"} className={cn(
                                            "ml-2 text-[10px] uppercase",
                                            task.department === 'Marketing' && "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20",
                                            task.department === 'Sales' && "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
                                            task.department === 'Technology' && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
                                            task.department === 'Operations' && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
                                        )}>
                                            {task.department}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {task.description?.replace(/--- AGENT OUTPUT ---[\s\S]*/, '') || "No details."}
                                    </p>

                                    {/* Agent / Metadata */}
                                    <div className="flex items-center gap-3 pt-2 mt-1">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80 bg-accent/50 px-2 py-0.5 rounded-full">
                                            <User className="w-3 h-3" />
                                            {/* We might need to fetch Agent details or assume populated. For now: */}
                                            <span>Agent</span>
                                        </div>
                                        {task.status !== 'DONE' && (
                                            <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}
