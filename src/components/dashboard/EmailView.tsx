import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Inbox, 
  Send, 
  FileText, 
  RefreshCw, 
  Mail,
  Star,
  Trash2,
  Reply,
  Forward,
  MoreHorizontal,
  Plus,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';

type EmailTab = 'inbox' | 'compose' | 'bulk' | 'templates';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: Date;
  read: boolean;
  starred: boolean;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  usageCount: number;
}

export function EmailView() {
  const [activeTab, setActiveTab] = useState<EmailTab>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const emails: Email[] = [
    { id: '1', from: 'sarah@techflow.ai', subject: 'Re: Partnership Opportunity', preview: 'Hi, I wanted to follow up on our previous conversation about...', date: new Date(), read: false, starred: true },
    { id: '2', from: 'marcus@scaleup.io', subject: 'Demo Request', preview: 'We are interested in scheduling a demo for your platform...', date: new Date(Date.now() - 3600000), read: false, starred: false },
    { id: '3', from: 'newsletter@producthunt.com', subject: 'Top Products This Week', preview: 'Check out the trending products on Product Hunt...', date: new Date(Date.now() - 7200000), read: true, starred: false },
    { id: '4', from: 'david@cloudnine.io', subject: 'Pricing Question', preview: 'Can you provide more details about your enterprise pricing...', date: new Date(Date.now() - 86400000), read: true, starred: true },
  ];

  const templates: Template[] = [
    { id: '1', name: 'Initial Outreach', subject: 'Quick Question About {{company}}', body: 'Hi {{name}},\n\nI noticed that {{company}} is doing great things in...', usageCount: 234 },
    { id: '2', name: 'Follow Up', subject: 'Following up on my previous email', body: 'Hi {{name}},\n\nI wanted to follow up on my previous message...', usageCount: 156 },
    { id: '3', name: 'Meeting Request', subject: 'Would love to connect', body: 'Hi {{name}},\n\nI would love to schedule a quick call to discuss...', usageCount: 89 },
  ];

  const tabs = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(e => !e.read).length },
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'bulk', label: 'Bulk Send', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText, count: templates.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Email Center</h2>
          <p className="text-sm text-muted-foreground">Manage inbox, send emails, and templates</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Sync Gmail
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EmailTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-xs",
                  activeTab === tab.id ? "bg-primary/20" : "bg-muted"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email List */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {emails.map((email) => (
                <div 
                  key={email.id}
                  onClick={() => setSelectedEmail(email.id)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors",
                    selectedEmail === email.id ? "bg-primary/5" : "hover:bg-muted/50",
                    !email.read && "border-l-2 border-primary"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); }}>
                        <Star className={cn("w-4 h-4", email.starred ? "fill-warning text-warning" : "text-muted-foreground")} />
                      </button>
                      <span className={cn("font-medium", !email.read && "text-foreground", email.read && "text-muted-foreground")}>
                        {email.from}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {email.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={cn("text-sm mb-1", !email.read ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {email.subject}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{email.preview}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Email Preview */}
          <div className="glass-card rounded-xl p-6">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    {emails.find(e => e.id === selectedEmail)?.subject}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Reply className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon"><Forward className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center font-semibold">
                    {emails.find(e => e.id === selectedEmail)?.from.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{emails.find(e => e.id === selectedEmail)?.from}</p>
                    <p className="text-xs text-muted-foreground">to me</p>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-foreground whitespace-pre-wrap">
                    {emails.find(e => e.id === selectedEmail)?.preview}
                    {"\n\n"}This is the full email content that would be fetched from Gmail API...
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an email to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="glass-card rounded-xl p-6 max-w-3xl">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">To</label>
              <Input placeholder="recipient@example.com" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Subject</label>
              <Input placeholder="Email subject" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Message</label>
              <Textarea 
                placeholder="Write your email here..." 
                className="bg-muted/50 min-h-[300px]" 
              />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Use Template
              </Button>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Send Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Bulk Email Campaign</h3>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Recipients (CSV or paste emails)</label>
                <Textarea 
                  placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com" 
                  className="bg-muted/50 min-h-[120px] font-mono text-sm" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Subject</label>
                <Input placeholder="Use {{name}} for personalization" className="bg-muted/50" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Message</label>
                <Textarea 
                  placeholder="Hi {{name}},&#10;&#10;Write your bulk email content here..." 
                  className="bg-muted/50 min-h-[200px]" 
                />
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Users className="w-4 h-4 mr-2" />
                  Send to All (0 recipients)
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Campaign Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Delay between emails</span>
                  <span className="font-medium text-foreground">30s</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Daily send limit</span>
                  <span className="font-medium text-foreground">500</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Track opens</span>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Track clicks</span>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="glass-card-hover rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-secondary" />
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.body}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Used {template.usageCount} times</span>
                  <Button variant="outline" size="sm">Use</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
