import { Task } from '@/types/catalyr';
import { X, Calendar, Clock, Tag, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onStatusChange?: (id: string, newStatus: string) => void;
    onDelete?: (id: string) => void;
}

export function TaskDetailModal({ task, onClose, onStatusChange, onDelete }: TaskDetailModalProps) {
    const handleStatusUpdate = (status: string) => {
        if (onStatusChange && task.id) {
            onStatusChange(task.id, status);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ marginTop: '0px' }}>
            <div className="bg-card w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-5 border-b border-border flex items-start justify-between bg-muted/30">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                                task.priority === 'critical' ? "bg-red-500/20 text-red-500" :
                                    task.priority === 'high' ? "bg-orange-500/20 text-orange-500" :
                                        task.priority === 'medium' ? "bg-blue-500/20 text-blue-500" :
                                            "bg-muted text-muted-foreground"
                            )}>
                                {task.priority}
                            </span>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                                task.status === 'completed' ? "bg-success/20 text-success" :
                                    task.status === 'in_progress' ? "bg-blue-500/20 text-blue-500" :
                                        task.status === 'review' ? "bg-orange-500/20 text-orange-500" :
                                            "bg-muted text-muted-foreground"
                            )}>
                                {task.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* Agent info */}
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-background border text-xl">
                            {(task.assignee?.avatar === 'SYSTEM' || task.assignee?.avatar === 'Bot' || task.assignee?.avatar === '🤖') ? (
                                <Bot className="w-6 h-6 text-primary" />
                            ) : (
                                task.assignee?.avatar || '🤖'
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-medium">Assigned to {task.assignee?.name || 'System'}</div>
                            <div className="text-xs text-muted-foreground">{task.assignee?.role || 'Coordinator'}</div>
                        </div>
                    </div>

                    {/* Description / Output */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Output / Details</h3>
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                                {task.description}
                            </pre>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due {task.deadline?.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Created {task.createdAt?.toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30 flex justify-between gap-3">
                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this task/event from the system.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                        if (onDelete && task.id) {
                                            onDelete(task.id);
                                            onClose();
                                        }
                                    }} className="bg-red-500 hover:bg-red-600">
                                        Delete Forever
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Close</Button>

                        {task.status === 'review' && (
                            <>
                                <Button variant="destructive" onClick={() => handleStatusUpdate('pending')}>Reject / Redo</Button>
                                <Button className="bg-success hover:bg-success/90 text-white" onClick={() => handleStatusUpdate('completed')}>Approve & Complete</Button>
                            </>
                        )}

                        {task.status === 'pending' && (
                            <Button onClick={() => handleStatusUpdate('in_progress')}>Start Task</Button>
                        )}

                        {task.status === 'in_progress' && (
                            <Button onClick={() => handleStatusUpdate('review')}>Submit for Review</Button>
                        )}

                        {task.status === 'completed' && (
                            <Button variant="secondary" disabled>Task Completed</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
