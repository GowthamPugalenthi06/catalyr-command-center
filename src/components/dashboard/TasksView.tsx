import { useState } from 'react';
import { cn } from '@/lib/utils';
import { tasks } from '@/data/mockData';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';

type FilterType = 'all' | 'pending' | 'in_progress' | 'review' | 'completed';

export function TasksView() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filter);

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { id: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { id: 'review', label: 'Review', count: tasks.filter(t => t.status === 'review').length },
    { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Task Queue</h2>
          <p className="text-sm text-muted-foreground">Manage and prioritize your AI team's work</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              filter === f.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-md text-xs",
              filter === f.id ? "bg-primary/20" : "bg-muted"
            )}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks found for this filter.</p>
        </div>
      )}
    </div>
  );
}
