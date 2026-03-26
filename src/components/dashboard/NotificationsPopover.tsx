import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from 'date-fns';

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Poll for tasks completed recently or today
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/tasks');
                const tasks = await res.json();

                // Filter: Completed Today
                const completedToday = tasks.filter((t: any) =>
                    (t.status === 'DONE' || t.status === 'completed') &&
                    new Date(t.updatedAt).getDate() === new Date().getDate()
                ).map((t: any) => ({
                    id: t._id,
                    title: `Task Completed: ${t.title}`,
                    time: new Date(t.updatedAt),
                    type: 'success',
                    icon: CheckCircle2
                }));

                // Filter: Meetings Upcoming
                const meetings = tasks.filter((t: any) =>
                    t.type === 'meeting' &&
                    new Date(t.startTime) > new Date() &&
                    new Date(t.startTime).getTime() - Date.now() < 3600000 // In next hour
                ).map((t: any) => ({
                    id: t._id,
                    title: `Upcoming Meeting: ${t.title}`,
                    time: new Date(t.startTime),
                    type: 'warning',
                    icon: Calendar
                }));

                const all = [...completedToday, ...meetings].sort((a, b) => b.time.getTime() - a.time.getTime());
                setNotifications(all);
                setCount(all.length);

            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] text-destructive-foreground rounded-full flex items-center justify-center font-bold animate-in zoom-in">
                            {count}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border bg-muted/20">
                    <h4 className="font-semibold leading-none">Notifications</h4>
                    <p className="text-xs text-muted-foreground mt-1">Updates from your workforce</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-border">
                            {notifications.map((n) => (
                                <div key={n.id} className="p-4 hover:bg-muted/50 transition-colors flex gap-3 items-start">
                                    <div className={`mt-1 p-1 rounded-full ${n.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        <n.icon className="w-3 h-3" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{n.title}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(n.time, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            No new notifications
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
