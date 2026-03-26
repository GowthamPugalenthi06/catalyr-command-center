import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Key,
  Mail,
  Shield,
  Bell,
  Database,
  Zap,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  FileSearch,
  Trash2
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: Date;
  lastUsed: Date | null;
}

function WorkspaceSettings() {
  const { status, refresh } = useOnboarding();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Are you sure? This will delete all company data, reset your AI agents, and return you to the onboarding wizard.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/onboarding/reset', {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Onboarding Reset",
          description: "All workspace data has been cleared.",
        });
        localStorage.removeItem('catalyr_auth'); // Force re-login/re-onboard cycle clean
        localStorage.removeItem('catalyr_onboarding');
        window.location.href = '/login';
      } else {
        throw new Error('Reset failed');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset onboarding.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Workspace Training</h3>
          <p className="text-sm text-muted-foreground">Manage your company knowledge base and AI training</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border border-border">
              <FileSearch className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Company PDF</p>
              <p className="text-sm text-muted-foreground">{status.pdfFilename || 'No document uploaded'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
              Training Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-xl">
            <p className="text-sm font-medium text-foreground mb-1">Company Name</p>
            <p className="text-lg font-bold text-primary">{status.companyName || 'Not Set'}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl">
            <p className="text-sm font-medium text-foreground mb-1">Active Agents</p>
            <p className="text-lg font-bold text-primary">{status.selectedAgents.length} Agents</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Factory Reset</p>
            <p className="text-xs text-muted-foreground">Clear all training data and re-run onboarding</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
            className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all"
          >
            {isResetting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Reset Workspace
          </Button>
        </div>
      </div>
    </section>
  );
}

export function SettingsView() {

  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const apiKeys: ApiKey[] = [
    { id: '1', name: 'Production Key', key: 'sk_live_abc123xyz...', created: new Date(), lastUsed: new Date() },
    { id: '2', name: 'Development Key', key: 'sk_test_def456uvw...', created: new Date(), lastUsed: null },
  ];

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your Catalyr workspace</p>
      </div>

      <WorkspaceSettings />

      {/* API Keys */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">API Keys</h3>
            <p className="text-sm text-muted-foreground">Manage your API access tokens</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-4">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-foreground">{apiKey.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm text-muted-foreground font-mono">
                    {showKey === apiKey.id ? apiKey.key : '••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {showKey === apiKey.id ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {copied === apiKey.id ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Revoke
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Generate New Key
          </Button>
        </div>
      </section>

      {/* Email Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Email Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure your outbound email settings</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">SMTP Host</label>
              <Input placeholder="smtp.example.com" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">SMTP Port</label>
              <Input placeholder="587" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Username</label>
              <Input placeholder="user@example.com" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Password</label>
              <Input type="password" placeholder="••••••••" className="bg-muted/50" />
            </div>
          </div>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            Save Configuration
          </Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">Control when you receive alerts</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          {[
            { label: 'Task completion alerts', description: 'Get notified when agents complete tasks' },
            { label: 'New lead alerts', description: 'Receive alerts for high-scoring leads' },
            { label: 'Daily briefing', description: 'Morning summary of scheduled activities' },
            { label: 'Agent errors', description: 'Critical alerts when agents encounter issues' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch />
            </div>
          ))}
        </div>
      </section>

      {/* Usage & Credits */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Usage & Credits</h3>
            <p className="text-sm text-muted-foreground">Monitor your API usage and credits</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">API Credits Used</span>
            <span className="font-semibold text-foreground">2,847 / 10,000</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              style={{ width: '28.47%' }}
            />
          </div>
          <p className="text-sm text-muted-foreground">Resets on January 1, 2026</p>
        </div>
      </section>
    </div>
  );
}
