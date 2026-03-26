import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Edit, Trash2, Reply, Send, RefreshCw, X, FileText, Users, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Template = { id: string; name: string; subject: string; body: string };

export function EmailView() {
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Tabs: 'inbox', 'templates', 'bulk'
  const [currentTab, setCurrentTab] = useState('inbox');

  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });

  // Templates State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

  // Bulk Mail State
  const [bulkRecipients, setBulkRecipients] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('');
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0, sending: false });
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);

  useEffect(() => {
    // 1. Try to load from cache first
    const cached = localStorage.getItem('cached_emails');
    const lastSync = localStorage.getItem('last_email_sync');

    if (cached) {
      setEmails(JSON.parse(cached));
    }

    // 2. Load templates
    const savedTemplates = localStorage.getItem('email_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates([
        { id: '1', name: 'Welcome Email', subject: 'Welcome to Catalyr', body: 'Hi there,\n\nWelcome to the future of enterprise.\n\nBest,\nTeam Catalyr' },
        { id: '2', name: 'Follow Up', subject: 'Following up on our conversation', body: 'Hi,\n\nJust wanted to circle back on this.\n\nThanks.' }
      ]);
    }

    // 3. Check if auto-sync is needed (9 AM or 9 PM)
    const shouldSync = () => {
      if (!lastSync) return true; // No sync ever

      const now = new Date();
      const last = new Date(lastSync);
      const today9am = new Date(); today9am.setHours(9, 0, 0, 0);
      const today9pm = new Date(); today9pm.setHours(21, 0, 0, 0);

      // If text sync was before today 9am, and now is after 9am -> Sync
      if (now >= today9am && last < today9am) return true;

      // If last sync was before today 9pm, and now is after 9pm -> Sync
      if (now >= today9pm && last < today9pm) return true;

      return false;
    };

    if (shouldSync()) {
      fetchEmails();
    }
  }, []);

  const saveTemplates = (newTemplates: Template[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('email_templates', JSON.stringify(newTemplates));
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email/inbox');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      if (Array.isArray(data)) {
        setEmails(data);
        // Update Cache
        localStorage.setItem('cached_emails', JSON.stringify(data));
        localStorage.setItem('last_email_sync', new Date().toISOString());

        if (data.length > 0 && !selectedEmail) {
          setSelectedEmail(data[0]);
        }
      } else {
        console.error("API returned non-array:", data);
        // Fallback to empty array or keep existing if relevant, but don't set object
      }
    } catch (e) {
      toast({ title: "Connection Error", description: "Using offline mode / cached data.", variant: "default" });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeData)
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Sent", description: "Email sent successfully" });
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '' });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name) return;
    const newKp: Template = { ...newTemplate, id: Date.now().toString() };
    saveTemplates([...templates, newKp]);
    setNewTemplate({ name: '', subject: '', body: '' });
    toast({ title: "Template Created", description: "New email template saved." });
  };

  const handleDeleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  };

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) {
      setComposeData(prev => ({ ...prev, subject: tmpl.subject, body: tmpl.body }));
    }
  };

  const handleBulkSend = async () => {
    const recipients = bulkRecipients.split(',').map(e => e.trim()).filter(e => e);
    if (recipients.length === 0) return;

    setBulkProgress({ sent: 0, total: recipients.length, sending: true });

    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i];
      try {
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email, subject: bulkSubject, body: bulkBody })
        });
        setBulkProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
      } catch (e) {
        console.error(`Failed to send to ${email}`);
      }
      // Small delay to prevent rate limit
      await new Promise(r => setTimeout(r, 500));
    }

    setBulkProgress(prev => ({ ...prev, sending: false }));
    toast({ title: "Bulk Send Complete", description: `Processed ${recipients.length} emails.` });
    setBulkRecipients('');
    setBulkSubject('');
    setBulkBody('');
  };

  // Triggered by the UI button
  const promptDelete = (id: string) => {
    setEmailToDelete(id);
  };

  // Executed by the Alert Dialog
  const executeDelete = async () => {
    if (!emailToDelete) return;
    const id = emailToDelete;
    setEmailToDelete(null); // Close dialog

    // Optimistic UI update
    const previousEmails = [...emails];
    setEmails(emails.filter(e => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);

    try {
      const res = await fetch(`/api/email/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: "Deleted", description: "Email moved to Trash." });
        // Update cache
        const updatedEmails = emails.filter(e => e.id !== id);
        localStorage.setItem('cached_emails', JSON.stringify(updatedEmails));
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete email", variant: "destructive" });
      setEmails(previousEmails); // Revert
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 animate-in fade-in">
      {/* 1. Navigation Sidenav */}
      <div className="w-48 flex flex-col gap-2 bg-card/50 rounded-xl p-2 border border-border h-full">
        <Button
          variant={currentTab === 'inbox' ? 'secondary' : 'ghost'}
          className="justify-start"
          onClick={() => setCurrentTab('inbox')}
        >
          <Mail className="w-4 h-4 mr-2" /> Inbox
        </Button>
        <Button
          variant={currentTab === 'templates' ? 'secondary' : 'ghost'}
          className="justify-start"
          onClick={() => setCurrentTab('templates')}
        >
          <FileText className="w-4 h-4 mr-2" /> Templates
        </Button>
        <Button
          variant={currentTab === 'bulk' ? 'secondary' : 'ghost'}
          className="justify-start"
          onClick={() => setCurrentTab('bulk')}
        >
          <Users className="w-4 h-4 mr-2" /> Bulk Mail
        </Button>

        <div className="mt-auto">
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> Compose</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-2">
                  <Label className="w-16">Template</Label>
                  <Select onValueChange={handleApplyTemplate}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-16">To</Label>
                  <Input value={composeData.to} onChange={e => setComposeData({ ...composeData, to: e.target.value })} className="flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-16">Subject</Label>
                  <Input value={composeData.subject} onChange={e => setComposeData({ ...composeData, subject: e.target.value })} className="flex-1" />
                </div>
                <Textarea className="h-[300px]" value={composeData.body} onChange={e => setComposeData({ ...composeData, body: e.target.value })} />
              </div>
              <DialogFooter>
                <Button onClick={handleSend}>Send Message <Send className="w-4 h-4 ml-2" /></Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col">

        {/* VIEW: INBOX */}
        {currentTab === 'inbox' && (
          <div className="flex h-full">
            {/* Inbox List */}
            <div className="w-1/3 border-r border-border flex flex-col">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                <h3 className="font-semibold">Messages</h3>
                <Button variant="ghost" size="icon" onClick={fetchEmails} disabled={loading}>
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {emails.length === 0 && !loading && (
                  <div className="text-center text-muted-foreground p-8 text-sm">Inbox Empty</div>
                )}
                {emails.map(email => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors border text-sm",
                      selectedEmail?.id === email.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn("font-medium truncate", selectedEmail?.id === email.id ? "text-primary" : "text-foreground")}>
                        {email.from}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(email.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate text-xs">{email.subject}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading Pane */}
            <div className="flex-1 flex flex-col bg-background/50">
              {selectedEmail ? (
                <>
                  <div className="p-6 border-b border-border bg-card/30">
                    <h2 className="text-xl font-bold mb-2">{selectedEmail.subject}</h2>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{selectedEmail.from}</span>
                        <span className="text-xs text-muted-foreground">{new Date(selectedEmail.date).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"><Reply className="w-4 h-4 mr-2" /> Reply</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => promptDelete(selectedEmail.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto font-sans text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedEmail.body}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Mail className="w-12 h-12 mb-4 opacity-10" />
                  <p>Select an email to read</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: TEMPLATES */}
        {currentTab === 'templates' && (
          <div className="flex flex-col h-full bg-background/30">
            <div className="p-6 border-b border-border bg-card/50">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" /> Email Templates
              </h2>
              <p className="text-muted-foreground text-sm">Create and manage your reusable email content.</p>
            </div>
            <div className="flex-1 p-6 flex gap-6 overflow-hidden">
              {/* Template List */}
              <div className="w-1/3 flex flex-col gap-3 overflow-y-auto pr-2">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary transition-colors group relative">
                    <h4 className="font-semibold mb-1">{tmpl.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{tmpl.subject}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {/* Create New Card */}
                <div className="p-4 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground bg-muted/20">
                  <span className="text-xs">Create new using the form →</span>
                </div>
              </div>

              {/* Create Form */}
              <div className="flex-1 bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
                <h3 className="font-semibold border-b border-border pb-2">New Template</h3>
                <div className="grid gap-2">
                  <Label>Template Name</Label>
                  <Input placeholder="e.g. Sales Intro" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Subject Line</Label>
                  <Input placeholder="Subject..." value={newTemplate.subject} onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })} />
                </div>
                <div className="flex-1 grid gap-2">
                  <Label>Body Content</Label>
                  <Textarea className="h-full resize-none" placeholder="Email body..." value={newTemplate.body} onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCreateTemplate} disabled={!newTemplate.name}>
                    <Plus className="w-4 h-4 mr-2" /> Save Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: BULK MAIL */}
        {currentTab === 'bulk' && (
          <div className="flex flex-col h-full bg-background/30">
            <div className="p-6 border-b border-border bg-card/50">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" /> Bulk Campaign
              </h2>
              <p className="text-muted-foreground text-sm">Send emails to multiple recipients. (Rate limits may apply)</p>
            </div>
            <div className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col gap-6 overflow-y-auto">
              <div className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                <div className="grid gap-2">
                  <Label>Recipients (Comma separated)</Label>
                  <Textarea
                    placeholder="ceo@company.com, leads@client.com, ..."
                    className="h-24"
                    value={bulkRecipients}
                    onChange={e => setBulkRecipients(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground text-right">{bulkRecipients ? bulkRecipients.split(',').length : 0} recipients</p>
                </div>
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Input placeholder="Campaign subject..." value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Message Body</Label>
                  <Textarea className="h-48" placeholder="Your message here..." value={bulkBody} onChange={e => setBulkBody(e.target.value)} />
                </div>

                {bulkProgress.sending ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sending...</span>
                      <span>{bulkProgress.sent} / {bulkProgress.total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(bulkProgress.sent / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" size="lg" onClick={handleBulkSend} disabled={!bulkRecipients || !bulkSubject || !bulkBody}>
                    <Send className="w-4 h-4 mr-2" /> Launch Campaign
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently move the email to the Trash folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
