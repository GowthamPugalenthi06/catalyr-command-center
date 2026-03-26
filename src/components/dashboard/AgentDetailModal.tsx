import { useState, useEffect } from 'react';
import { Agent, Task } from '@/types/catalyr';
import { X, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AgentDetailModalProps {
    agent: Agent;
    onClose: () => void;
}

export function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // In a real app, we'd fetch tasks assigned to this agent
                // For now, let's fetch all and filter client-side or use a mock endpoint
                // Ideally: GET /api/tasks?agentId=${agent.id}
                const res = await fetch('/api/tasks');
                const data = await res.json();

                // Filter for this agent (assuming assignedAgent field matches)
                // Since we are mocking connection, we might need to match by ID strictly
                // For visual demo, let's show all "Marketing" tasks if agent is Marketing, etc.
                const relevantTasks = data.filter((t: any) =>
                    t.assignedAgent === agent.id || t.department === agent.department
                );

                // Map to frontend type
                const mapped = relevantTasks.map((t: any) => ({
                    id: t._id,
                    title: t.title,
                    description: t.description,
                    status: t.status === 'DONE' ? 'completed' : t.status === 'IN_PROGRESS' ? 'in_progress' : 'pending',
                    priority: 'medium', // Default
                    createdAt: new Date(t.createdAt),
                }));

                setTasks(mapped.reverse().slice(0, 5)); // Show last 5
            } catch (e) {
                console.error("Failed to fetch agent tasks", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [agent]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 border-b border-border flex items-start justify-between bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-secondary/20">
                            {agent.avatar}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{agent.name}</h2>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>{agent.role}</span>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">{agent.rank}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Stats Request */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-2xl font-bold">{agent.tasksCompleted}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Tasks Done</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-success">{agent.performance}%</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Performance</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-2xl font-bold capitalize">{agent.status}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Status</div>
                        </div>
                    </div>

                    {/* Recent Output */}
                    <div>
                        <h3 className="tex-lg font-semibold mb-3">Recent Activity & Output</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading history...</div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No recent activity found.</div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="p-4 rounded-lg border border-border bg-card/50 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium">{task.title}</h4>
                                            <span className={cn(
                                                "text-xs px-2 py-1 rounded-full",
                                                task.status === 'completed' ? "bg-success/20 text-success" :
                                                    task.status === 'in_progress' ? "bg-blue-500/20 text-blue-500" :
                                                        "bg-warning/20 text-warning"
                                            )}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                            {task.description}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {task.createdAt.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}
