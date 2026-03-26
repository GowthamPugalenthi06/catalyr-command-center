import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Lock, User } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (username !== 'admin') {
            toast({
                variant: "destructive",
                title: "Invalid Username",
                description: "Please check your admin credentials.",
            });
            return;
        }

        const success = login(password);
        if (success) {
            toast({
                title: "Welcome back, Founder",
                description: "Access granted to WayFy Command Center.",
            });
            navigate('/');
        } else {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "Invalid credentials provided.",
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="w-full max-w-md space-y-8 relative z-10 glass-card p-8 rounded-2xl border border-border">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">WayFy</h1>
                    <p className="text-sm text-muted-foreground">powered by catalyr</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="username"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="pl-10 bg-background/50 border-input transition-all focus:border-primary focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 bg-background/50 border-input transition-all focus:border-primary focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-6 text-lg font-medium shadow-lg shadow-primary/25">
                        Access System
                    </Button>
                </form>
            </div>
        </div>
    );
}
