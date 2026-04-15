import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leadService } from "@/services/leadService";
import { authService } from "@/services/authService";
import type { Tables } from "@/integrations/supabase/types";
import {
  MessageSquare,
  UserPlus,
  Phone,
  Mail,
  Building,
  Search,
  Briefcase,
  Users,
  DollarSign,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Tag,
  FileText,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadActivities, setLeadActivities] = useState<any[]>([]);
  const [leadNotes, setLeadNotes] = useState<any[]>([]);
  const [leadTasks, setLeadTasks] = useState<any[]>([]);

  // Forms
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    source_id: "",
    stage_id: "",
    priority: "medium",
    estimated_value: "",
    tags: [] as string[],
  });

  const [noteForm, setNoteForm] = useState({
    note_type: "note" as "note" | "call" | "email" | "meeting" | "task",
    content: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
  });

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, searchQuery, filterStatus, filterPriority, filterSource, filterStage]);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadData = async () => {
    const [leadsRes, statsRes, sourcesRes, stagesRes] = await Promise.all([
      leadService.getLeads(),
      leadService.getLeadStats(),
      leadService.getLeadSources(),
      leadService.getLeadStages(),
    ]);

    if (leadsRes.data) setLeads(leadsRes.data);
    if (statsRes.data) setStats(statsRes.data);
    if (sourcesRes.data) setSources(sourcesRes.data);
    if (stagesRes.data) setStages(stagesRes.data);
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (l) =>
          l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.phone?.includes(searchQuery) ||
          l.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.telegram_username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((l) => l.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((l) => l.priority === filterPriority);
    }

    // Source filter
    if (filterSource !== "all") {
      filtered = filtered.filter((l) => l.source_id === filterSource);
    }

    // Stage filter
    if (filterStage !== "all") {
      filtered = filtered.filter((l) => l.stage_id === filterStage);
    }

    setFilteredLeads(filtered);
  };

  const handleCreateLead = async () => {
    if (!createForm.full_name.trim() && !createForm.email.trim()) {
      toast({
        title: "Error",
        description: "Please provide at least a name or email",
        variant: "destructive",
      });
      return;
    }

    const { error } = await leadService.createLead({
      full_name: createForm.full_name || undefined,
      email: createForm.email || undefined,
      phone: createForm.phone || undefined,
      company: createForm.company || undefined,
      source_id: createForm.source_id || undefined,
      stage_id: createForm.stage_id || undefined,
      priority: createForm.priority as any,
      estimated_value: createForm.estimated_value
        ? parseFloat(createForm.estimated_value)
        : undefined,
      tags: createForm.tags.length > 0 ? createForm.tags : undefined,
    });

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Lead created successfully" });
      setIsCreateDialogOpen(false);
      resetCreateForm();
      loadData();
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      full_name: "",
      email: "",
      phone: "",
      company: "",
      source_id: "",
      stage_id: "",
      priority: "medium",
      estimated_value: "",
      tags: [],
    });
  };

  const openDetailDialog = async (lead: any) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);

    // Load lead details
    const [activitiesRes, notesRes, tasksRes] = await Promise.all([
      leadService.getLeadActivities(lead.id),
      leadService.getLeadNotes(lead.id),
      leadService.getLeadTasks(lead.id),
    ]);

    if (activitiesRes.data) setLeadActivities(activitiesRes.data);
    if (notesRes.data) setLeadNotes(notesRes.data);
    if (tasksRes.data) setLeadTasks(tasksRes.data);
  };

  const handleAddNote = async () => {
    if (!selectedLead || !noteForm.content.trim() || !currentUser) return;

    const { error } = await leadService.addLeadNote({
      lead_id: selectedLead.id,
      created_by: currentUser.id,
      note_type: noteForm.note_type,
      content: noteForm.content,
    });

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Note added" });
      setNoteForm({ note_type: "note", content: "" });
      // Reload notes
      const { data } = await leadService.getLeadNotes(selectedLead.id);
      if (data) setLeadNotes(data);
      // Reload activities
      const { data: activities } = await leadService.getLeadActivities(selectedLead.id);
      if (activities) setLeadActivities(activities);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedLead || !taskForm.title.trim() || !currentUser) return;

    const { error } = await leadService.createLeadTask({
      lead_id: selectedLead.id,
      created_by: currentUser.id,
      title: taskForm.title,
      description: taskForm.description || undefined,
      due_date: taskForm.due_date || undefined,
      priority: taskForm.priority as any,
    });

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Task created" });
      setTaskForm({ title: "", description: "", due_date: "", priority: "medium" });
      // Reload tasks
      const { data } = await leadService.getLeadTasks(selectedLead.id);
      if (data) setLeadTasks(data);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const { error } = await leadService.completeTask(taskId);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Task completed" });
      if (selectedLead) {
        const { data } = await leadService.getLeadTasks(selectedLead.id);
        if (data) setLeadTasks(data);
      }
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const { error } = await leadService.updateLeadStatus(
      leadId,
      newStatus,
      currentUser?.id
    );
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Status updated to ${newStatus}` });
      loadData();
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    const { error } = await leadService.deleteLead(leadId);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Lead deleted" });
      setIsDetailDialogOpen(false);
      loadData();
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Phone", "Company", "Source", "Status", "Priority", "Value", "Created"],
      ...filteredLeads.map((l) => [
        l.full_name || l.telegram_username || "-",
        l.email || "-",
        l.phone || "-",
        l.company || "-",
        l.source?.name || "Direct",
        l.status,
        l.priority,
        l.estimated_value || 0,
        new Date(l.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({ title: "Export Complete", description: "Leads exported to CSV" });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: "bg-blue-500",
      contacted: "bg-purple-500",
      qualified: "bg-teal-500",
      proposal: "bg-amber-500",
      negotiation: "bg-rose-500",
      won: "bg-success",
      lost: "bg-slate-500",
    };
    return colors[status] || "bg-primary";
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: "text-slate-500",
      medium: "text-blue-500",
      high: "text-amber-500",
      urgent: "text-destructive",
    };
    return colors[priority] || "text-muted-foreground";
  };

  const getPriorityIcon = (priority: string) => {
    const icons: { [key: string]: any } = {
      low: Clock,
      medium: AlertCircle,
      high: TrendingUp,
      urgent: AlertCircle,
    };
    const Icon = icons[priority] || Clock;
    return <Icon className={`h-4 w-4 ${getPriorityColor(priority)}`} />;
  };

  return (
    <ProtectedRoute>
      <SEO
        title="Leads Management - Dashboard"
        description="Track potential customers and sales pipeline"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold">Leads Management</h1>
              <p className="text-muted-foreground mt-1">
                Capture, organize, and convert potential customers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <div className="text-3xl font-bold text-blue-500">
                {stats?.new_leads || 0}
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-teal-500">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <CheckCircle className="h-4 w-4" /> Qualified
              </div>
              <div className="text-3xl font-bold text-teal-500">
                {stats?.qualified_leads || 0}
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-success">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Briefcase className="h-4 w-4" /> Converted
              </div>
              <div className="text-3xl font-bold text-success">
                {stats?.converted_leads || 0}
              </div>
            </Card>
            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-primary">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" /> Pipeline Value
              </div>
              <div className="text-3xl font-bold text-primary">
                ${stats?.total_value?.toFixed(2) || "0.00"}
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Leads Table */}
          <Card>
            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No leads found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery ||
                  filterStatus !== "all" ||
                  filterPriority !== "all" ||
                  filterSource !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first lead to get started"}
                </p>
                {!searchQuery &&
                  filterStatus === "all" &&
                  filterPriority === "all" &&
                  filterSource === "all" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Lead
                    </Button>
                  )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => openDetailDialog(lead)}>
                        <div className="font-medium text-foreground">
                          {lead.full_name || lead.telegram_username || "Unknown Contact"}
                        </div>
                        <div className="mt-1 space-y-1">
                          {lead.email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => openDetailDialog(lead)}>
                        {lead.company ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Building className="h-3.5 w-3.5 text-muted-foreground" />
                            {lead.company}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell onClick={() => openDetailDialog(lead)}>
                        <span className="text-sm">{lead.source?.name || "Direct"}</span>
                      </TableCell>
                      <TableCell onClick={() => openDetailDialog(lead)}>
                        <Badge
                          className={`${getStatusColor(lead.status)} text-white hover:${getStatusColor(lead.status)} capitalize`}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => openDetailDialog(lead)}>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(lead.priority || "medium")}
                          <span className="text-sm capitalize">{lead.priority || "medium"}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => openDetailDialog(lead)} className="font-medium">
                        {lead.estimated_value ? (
                          `$${lead.estimated_value.toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell
                        onClick={() => openDetailDialog(lead)}
                        className="text-sm text-muted-foreground"
                      >
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDetailDialog(lead)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(lead.id, "contacted")}
                            >
                              Mark as Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(lead.id, "qualified")}
                            >
                              Mark as Qualified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(lead.id, "won")}
                            >
                              Mark as Won
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Create Lead Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>Add a new lead to your pipeline</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={createForm.full_name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, full_name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={createForm.company}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, company: e.target.value })
                  }
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={createForm.source_id}
                  onValueChange={(v) => setCreateForm({ ...createForm, source_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={createForm.priority}
                  onValueChange={(v) => setCreateForm({ ...createForm, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={createForm.stage_id}
                  onValueChange={(v) => setCreateForm({ ...createForm, stage_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  step="0.01"
                  value={createForm.estimated_value}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, estimated_value: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateLead}>Create Lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedLead?.full_name ||
                  selectedLead?.telegram_username ||
                  "Lead Details"}
              </DialogTitle>
              <DialogDescription>
                Complete lead information and activity timeline
              </DialogDescription>
            </DialogHeader>

            {selectedLead && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="notes">Notes ({leadNotes.length})</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks ({leadTasks.length})</TabsTrigger>
                  <TabsTrigger value="timeline">
                    Timeline ({leadActivities.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        {selectedLead.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedLead.email}</span>
                          </div>
                        )}
                        {selectedLead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedLead.phone}</span>
                          </div>
                        )}
                        {selectedLead.company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedLead.company}</span>
                          </div>
                        )}
                        {selectedLead.telegram_username && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>@{selectedLead.telegram_username}</span>
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Lead Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={`ml-2 ${getStatusColor(selectedLead.status)}`}>
                            {selectedLead.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>
                          <span className="ml-2 capitalize">{selectedLead.priority}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Source:</span>
                          <span className="ml-2">{selectedLead.source?.name || "Direct"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <span className="ml-2 font-medium">
                            ${selectedLead.estimated_value?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-2">
                            {new Date(selectedLead.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {selectedLead.tags && selectedLead.tags.length > 0 && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline">
                            <Tag className="mr-1 h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Add Note</h3>
                    <div className="space-y-3">
                      <Select
                        value={noteForm.note_type}
                        onValueChange={(v: any) =>
                          setNoteForm({ ...noteForm, note_type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={noteForm.content}
                        onChange={(e) =>
                          setNoteForm({ ...noteForm, content: e.target.value })
                        }
                        placeholder="Enter note..."
                        rows={3}
                      />
                      <Button onClick={handleAddNote} disabled={!noteForm.content.trim()}>
                        <FileText className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {leadNotes.map((note) => (
                      <Card key={note.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {note.note_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {note.created_by_profile?.full_name || "Unknown"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Create Task</h3>
                    <div className="space-y-3">
                      <Input
                        value={taskForm.title}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, title: e.target.value })
                        }
                        placeholder="Task title..."
                      />
                      <Textarea
                        value={taskForm.description}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, description: e.target.value })
                        }
                        placeholder="Task description..."
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="datetime-local"
                          value={taskForm.due_date}
                          onChange={(e) =>
                            setTaskForm({ ...taskForm, due_date: e.target.value })
                          }
                        />
                        <Select
                          value={taskForm.priority}
                          onValueChange={(v) =>
                            setTaskForm({ ...taskForm, priority: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateTask} disabled={!taskForm.title.trim()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </Button>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {leadTasks.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge
                                variant={task.status === "completed" ? "default" : "outline"}
                                className={
                                  task.status === "completed" ? "bg-success" : ""
                                }
                              >
                                {task.status}
                              </Badge>
                              {task.priority && (
                                <div className="flex items-center gap-1">
                                  {getPriorityIcon(task.priority)}
                                  <span className="text-xs capitalize">
                                    {task.priority}
                                  </span>
                                </div>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.due_date).toLocaleString()}
                                </div>
                              )}
                              {task.assigned_to_profile && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {task.assigned_to_profile.full_name}
                                </div>
                              )}
                            </div>
                          </div>
                          {task.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteTask(task.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-3">
                  {leadActivities.map((activity) => (
                    <Card key={activity.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                          )}
                          {activity.created_by_profile && (
                            <p className="text-xs text-muted-foreground mt-1">
                              by {activity.created_by_profile.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}