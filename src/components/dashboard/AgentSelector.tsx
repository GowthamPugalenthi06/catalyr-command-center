import { useState, useEffect } from 'react';
import { Check, Users, Code, Settings, Briefcase, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentDef {
    name: string;
    role: string;
    department: string;
    rank: string;
    category: string;
    avatar: string;
    description: string;
}

interface AgentSelectorProps {
    onComplete: (selectedAgents: string[]) => void;
}

const API_URL = '/api/onboarding';

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    Technical: { label: 'Technical Employees', icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    Management: { label: 'Management Employees', icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    Support: { label: 'Support Employees', icon: HeadphonesIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const rankColors: Record<string, string> = {
    L1: 'bg-rank-l1/20 text-rank-l1 border-rank-l1/30',
    L2: 'bg-rank-l2/20 text-rank-l2 border-rank-l2/30',
    L3: 'bg-rank-l3/20 text-rank-l3 border-rank-l3/30',
    L4: 'bg-rank-l4/20 text-rank-l4 border-rank-l4/30',
    L5: 'bg-rank-l5/20 text-rank-l5 border-rank-l5/30',
};

export function AgentSelector({ onComplete }: AgentSelectorProps) {
    const [agents, setAgents] = useState<AgentDef[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/agents`)
            .then(res => res.json())
            .then(data => setAgents(data.agents || []))
            .catch(err => console.error('Failed to load agents:', err));
    }, []);

    const toggleAgent = (role: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(role)) {
                next.delete(role);
            } else {
                next.add(role);
            }
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === agents.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(agents.map(a => a.role)));
        }
    };

    const handleSubmit = async () => {
        if (selected.size === 0) {
            setError('Please select at least one agent');
            return;
        }
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/select-agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agents: Array.from(selected) }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to activate agents');
            }

            onComplete(Array.from(selected));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Group agents by category
    const grouped: Record<string, AgentDef[]> = {};
    agents.forEach(a => {
        if (!grouped[a.category]) grouped[a.category] = [];
        grouped[a.category].push(a);
    });

    return (
        <div className="space-y-6">
            {/* Header with Select All */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-semibold">{selected.size}</span> of {agents.length} agents selected
                </p>
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                    {selected.size === agents.length ? 'Deselect All' : 'Select All'}
                </Button>
            </div>

            {/* Agent Categories */}
            {['Technical', 'Management', 'Support'].map(cat => {
                const config = categoryConfig[cat];
                const catAgents = grouped[cat] || [];
                if (catAgents.length === 0) return null;

                const CatIcon = config.icon;

                return (
                    <div key={cat} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                <CatIcon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {catAgents.map(agent => {
                                const isSelected = selected.has(agent.role);
                                return (
                                    <div
                                        key={agent.role}
                                        onClick={() => toggleAgent(agent.role)}
                                        className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 
                                            ${isSelected
                                                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                                                : 'border-border hover:border-primary/30 hover:bg-primary/[0.02]'
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                                            ${isSelected
                                                ? 'bg-primary border-primary'
                                                : 'border-muted-foreground/30 group-hover:border-primary/50'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                        </div>

                                        {/* Content */}
                                        <div className="flex items-start gap-3 pr-8">
                                            <span className="text-2xl">{agent.avatar}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-foreground truncate">{agent.name}</h4>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${rankColors[agent.rank] || ''}`}>
                                                        {agent.rank}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{agent.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</p>
            )}

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={selected.size === 0 || submitting}
                className="w-full py-6 text-lg font-medium shadow-lg shadow-primary/25 rounded-xl"
            >
                <Users className="w-5 h-5 mr-2" />
                {submitting ? 'Activating Agents...' : `Activate ${selected.size} Agent${selected.size !== 1 ? 's' : ''}`}
            </Button>
        </div>
    );
}
