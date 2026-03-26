import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Mail, Building2, MoreHorizontal, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

interface Lead {
  _id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  status: string;
  warmthScore: number;
}

const statusStyles: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  CONTACTED: 'bg-warning/10 text-warning border-warning/30',
  QUALIFIED: 'bg-primary/10 text-primary border-primary/30',
  CLOSED: 'bg-success/10 text-success border-success/30',
};

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Manual Entry State
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    company: '',
    source: 'Manual Entry'
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.email) {
      toast({ title: "Validation Error", description: "Name and Email are required.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLead,
          warmthScore: 50, // Default for manual
          status: 'NEW'
        })
      });

      if (res.ok) {
        toast({ title: "Success", description: "Lead added manually." });
        setOpen(false);
        setNewLead({ name: '', email: '', company: '', source: 'Manual Entry' });
        fetchLeads();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add lead.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Lead Pipeline</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateLead} type="submit">Save lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {lead.name ? lead.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-foreground">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {lead.company || '-'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-muted-foreground">{lead.source}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            lead.warmthScore >= 80 ? "bg-success" : lead.warmthScore >= 60 ? "bg-warning" : "bg-muted-foreground"
                          )}
                          style={{ width: `${lead.warmthScore || 0}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        lead.warmthScore >= 80 ? "text-success" : lead.warmthScore >= 60 ? "text-warning" : "text-muted-foreground"
                      )}>
                        {lead.warmthScore || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border capitalize",
                      statusStyles[lead.status] || statusStyles.NEW
                    )}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && leads.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No leads found. Add one manually or wait for the agents.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
