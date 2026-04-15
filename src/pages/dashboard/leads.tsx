import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leadService } from "@/services/leadService";
import type { Tables } from "@/integrations/supabase/types";
import { MessageSquare, UserPlus, Phone, Mail, Building, Search, Briefcase } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [leadsRes, statsRes] = await Promise.all([
      leadService.getLeads(),
      leadService.getLeadStats()
    ]);
    if (leadsRes.data) setLeads(leadsRes.data);
    if (statsRes.data) setStats(statsRes.data);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    const { data } = await leadService.searchLeads(searchQuery);
    if (data) setLeads(data);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-purple-500';
      case 'qualified': return 'bg-teal-500';
      case 'proposal': return 'bg-amber-500';
      case 'negotiation': return 'bg-rose-500';
      case 'won': return 'bg-success';
      case 'lost': return 'bg-slate-500';
      default: return 'bg-primary';
    }
  };

  return (
    <ProtectedRoute>
      <SEO title="Leads Management - Dashboard" description="Track potential customers and sales pipeline" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold">Leads Management</h1>
              <p className="text-muted-foreground mt-1">Capture, organize, and convert potential customers</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search leads..." 
                  className="pl-9 w-[250px]" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="p-5 flex flex-col justify-center border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Users className="h-4 w-4" /> Total Leads
              </div>
              <div className="text-3xl font-bold">{stats?.total_leads || 0}</div>
             </Card>
             <Card className="p-5 flex flex-col justify-center border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <UserPlus className="h-4 w-4" /> New Leads
              </div>
              <div className="text-3xl font-bold text-blue-500">{stats?.new_leads || 0}</div>
             </Card>
             <Card className="p-5 flex flex-col justify-center border-l-4 border-l-success">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Briefcase className="h-4 w-4" /> Converted (Won)
              </div>
              <div className="text-3xl font-bold text-success">{stats?.converted_leads || 0}</div>
             </Card>
             <Card className="p-5 flex flex-col justify-center border-l-4 border-l-primary">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" /> Pipeline Value
              </div>
              <div className="text-3xl font-bold text-primary">${stats?.total_value?.toFixed(2) || '0.00'}</div>
             </Card>
          </div>

          <Card>
            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No leads found</h3>
                <p className="text-muted-foreground text-sm">Leads from Telegram interactions or forms will appear here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status / Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{lead.full_name || lead.telegram_username || 'Unknown Contact'}</div>
                        <div className="mt-1 space-y-1">
                          {lead.email && <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3"/>{lead.email}</div>}
                          {lead.phone && <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3"/>{lead.phone}</div>}
                          {lead.telegram_username && !lead.full_name && <div className="text-xs text-accent flex items-center gap-1.5"><MessageSquare className="h-3 w-3"/>@{lead.telegram_username}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.company ? (
                          <div className="flex items-center gap-1.5 text-sm"><Building className="h-3.5 w-3.5 text-muted-foreground"/> {lead.company}</div>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{lead.source?.name || 'Direct'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className={`${getStatusColor(lead.status)} text-white hover:${getStatusColor(lead.status)} capitalize`}>
                            {lead.status}
                          </Badge>
                          {lead.stage && (
                            <span className="text-xs text-muted-foreground">{lead.stage.name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {lead.estimated_value ? `$${lead.estimated_value.toFixed(2)}` : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Needed imports workaround for Users missing from previous lucide import
import { Users } from "lucide-react";