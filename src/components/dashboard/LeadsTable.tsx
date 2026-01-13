import { cn } from '@/lib/utils';
import { leads } from '@/data/mockData';
import { Lead } from '@/types/catalyr';
import { Mail, Building2, TrendingUp, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusStyles = {
  cold: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  warm: 'bg-warning/10 text-warning border-warning/30',
  hot: 'bg-destructive/10 text-destructive border-destructive/30',
  converted: 'bg-success/10 text-success border-success/30',
};

export function LeadsTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Lead Pipeline</h2>
        <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          + Add Lead
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
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
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center font-semibold text-foreground">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
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
                      {lead.company}
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
                            lead.score >= 80 ? "bg-success" : lead.score >= 60 ? "bg-warning" : "bg-muted-foreground"
                          )}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        lead.score >= 80 ? "text-success" : lead.score >= 60 ? "text-warning" : "text-muted-foreground"
                      )}>
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border capitalize",
                      statusStyles[lead.status]
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
