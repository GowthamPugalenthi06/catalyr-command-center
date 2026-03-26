import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/context/OnboardingContext';
import { PDFUpload } from '@/components/dashboard/PDFUpload';
import { AgentSelector } from '@/components/dashboard/AgentSelector';
import { Rocket, FileText, Users, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
    { key: 'welcome', label: 'Welcome', icon: Rocket },
    { key: 'upload', label: 'Company Doc', icon: FileText },
    { key: 'agents', label: 'Select Agents', icon: Users },
    { key: 'done', label: 'Complete', icon: CheckCircle2 },
];

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [uploadData, setUploadData] = useState<any>(null);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const { refresh } = useOnboarding();
    const navigate = useNavigate();

    const handleUploadComplete = (data: any) => {
        setUploadData(data);
        setStep(2); // Auto-advance to agent selection
    };

    const handleAgentSelection = (agents: string[]) => {
        setSelectedAgents(agents);
        setStep(3); // Auto-advance to done
    };

    const handleLaunch = async () => {
        await refresh();
        localStorage.setItem('catalyr_onboarding', JSON.stringify({ isComplete: true }));
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] opacity-30" />
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 w-full px-6 pt-6">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const isActive = i === step;
                            const isCompleted = i < step;
                            return (
                                <div key={s.key} className="flex items-center gap-2">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300
                                        ${isActive ? 'bg-primary text-primary-foreground scale-110' : isCompleted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                                    >
                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {s.label}
                                    </span>
                                    {i < STEPS.length - 1 && (
                                        <div className={`w-8 sm:w-16 h-0.5 mx-1 rounded transition-all ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-2xl">
                    <div className="glass-card rounded-2xl border border-border p-8 animate-fade-in">

                        {/* ── Step 0: Welcome ── */}
                        {step === 0 && (
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-2">
                                    <Rocket className="w-10 h-10 text-primary" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Welcome to <span className="text-primary">Catalyr</span> Command Center
                                </h1>
                                <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                                    Let's set up your AI workforce. Upload your company document and choose which agents to activate.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4">
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <FileText className="w-5 h-5 text-primary mb-2" />
                                        <h3 className="text-sm font-semibold">Upload PDF</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Train agents with your company knowledge</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <Users className="w-5 h-5 text-primary mb-2" />
                                        <h3 className="text-sm font-semibold">Pick Agents</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Choose from 15 specialized AI agents</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <Shield className="w-5 h-5 text-primary mb-2" />
                                        <h3 className="text-sm font-semibold">Isolated Brains</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Each agent runs independently with its own context</p>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep(1)}
                                    className="mt-6 py-6 px-8 text-lg font-medium shadow-lg shadow-primary/25 rounded-xl"
                                >
                                    Get Started <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        )}

                        {/* ── Step 1: PDF Upload ── */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                                        <FileText className="w-7 h-7 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Upload Company Document</h2>
                                    <p className="text-muted-foreground">
                                        Upload a PDF with your company info. Our RAG system will extract and use it to train your agents.
                                    </p>
                                </div>

                                <PDFUpload onUploadComplete={handleUploadComplete} />

                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(0)}
                                    className="w-full"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                            </div>
                        )}

                        {/* ── Step 2: Agent Selection ── */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                                        <Users className="w-7 h-7 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Select Your AI Team</h2>
                                    <p className="text-muted-foreground">
                                        Choose which agents to activate. Each runs on an isolated brain — they can't access each other's data.
                                    </p>
                                </div>

                                {uploadData && (
                                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                        <div>
                                            <span className="font-semibold text-green-400">{uploadData.companyName}</span>
                                            <span className="text-muted-foreground"> — {uploadData.chunksCreated} knowledge chunks extracted from {uploadData.pages} pages</span>
                                        </div>
                                    </div>
                                )}

                                <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
                                    <AgentSelector onComplete={handleAgentSelection} />
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="w-full"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Upload
                                </Button>
                            </div>
                        )}

                        {/* ── Step 3: Complete ── */}
                        {step === 3 && (
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-green-500/10 mb-2">
                                    <Sparkles className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-3xl font-bold">You're All Set! 🎉</h2>
                                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                                    Your AI workforce of <span className="text-primary font-semibold">{selectedAgents.length} agents</span> is trained and ready.
                                    Each agent has its own isolated context from your company document.
                                </p>

                                <div className="flex flex-wrap justify-center gap-2 py-4">
                                    {selectedAgents.map(agent => (
                                        <span key={agent} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20">
                                            {agent}
                                        </span>
                                    ))}
                                </div>

                                <Button
                                    onClick={handleLaunch}
                                    className="py-6 px-10 text-lg font-medium shadow-lg shadow-primary/25 rounded-xl"
                                >
                                    <Rocket className="w-5 h-5 mr-2" />
                                    Launch Command Center
                                </Button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
