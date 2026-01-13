import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Mail, 
  Key,
  Users,
  Plus,
  Eye,
  EyeOff,
  Save,
  Trash2,
  UserPlus
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
}

export function AdminView() {
  const [showPassword, setShowPassword] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '587',
    email: '',
    password: '',
    appPassword: '',
  });

  const [groqApiKey, setGroqApiKey] = useState('');

  const roles: Role[] = [
    { id: '1', name: 'Admin', permissions: ['all'], userCount: 2 },
    { id: '2', name: 'Manager', permissions: ['view', 'edit', 'assign'], userCount: 5 },
    { id: '3', name: 'Agent Operator', permissions: ['view', 'run_agents'], userCount: 8 },
    { id: '4', name: 'Viewer', permissions: ['view'], userCount: 12 },
  ];

  const permissionsList = [
    'view', 'edit', 'delete', 'assign', 'run_agents', 'manage_users', 'billing', 'api_access'
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Configuration</h2>
        <p className="text-sm text-muted-foreground">System-wide settings and access control</p>
      </div>

      {/* SMTP / Email Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Email & SMTP Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure email sending and Gmail integration</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">SMTP Host</label>
              <Input 
                placeholder="smtp.gmail.com" 
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({...smtpConfig, host: e.target.value})}
                className="bg-muted/50" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">SMTP Port</label>
              <Input 
                placeholder="587" 
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({...smtpConfig, port: e.target.value})}
                className="bg-muted/50" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email Address</label>
              <Input 
                type="email"
                placeholder="your-email@gmail.com" 
                value={smtpConfig.email}
                onChange={(e) => setSmtpConfig({...smtpConfig, email: e.target.value})}
                className="bg-muted/50" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" 
                  value={smtpConfig.password}
                  onChange={(e) => setSmtpConfig({...smtpConfig, password: e.target.value})}
                  className="bg-muted/50 pr-10" 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground block mb-2">
                App Password <span className="text-muted-foreground">(for Gmail 2FA)</span>
              </label>
              <Input 
                type="password"
                placeholder="xxxx xxxx xxxx xxxx" 
                value={smtpConfig.appPassword}
                onChange={(e) => setSmtpConfig({...smtpConfig, appPassword: e.target.value})}
                className="bg-muted/50" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Generate app password at: Google Account → Security → 2-Step Verification → App passwords
              </p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save Email Configuration
          </Button>
        </div>
      </section>

      {/* Groq API Key */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Groq API Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure Groq API for AI agent operations</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Groq API Key</label>
            <div className="relative">
              <Input 
                type={showGroqKey ? "text" : "password"}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                className="bg-muted/50 pr-10 font-mono" 
              />
              <button 
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showGroqKey ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get your API key from: <span className="text-primary">console.groq.com/keys</span>
            </p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save API Key
          </Button>
        </div>
      </section>

      {/* Role Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Role Management</h3>
              <p className="text-sm text-muted-foreground">Define roles and permissions for team members</p>
            </div>
          </div>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{role.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <span 
                          key={perm} 
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            perm === 'all' 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-foreground">{role.userCount}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Permission Legend */}
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-3">Available Permissions</p>
          <div className="flex flex-wrap gap-2">
            {permissionsList.map((perm) => (
              <span key={perm} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                {perm}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
