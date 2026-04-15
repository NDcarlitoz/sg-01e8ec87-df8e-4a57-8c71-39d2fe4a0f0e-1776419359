import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { userService, type UserInput, type UserFilter } from "@/services/userService";
import type { Tables } from "@/integrations/supabase/types";
import { 
  Search, 
  UserPlus, 
  TrendingUp, 
  Users, 
  UserCheck,
  Edit,
  Trash2,
  Eye,
  Download,
  Shield,
  Crown,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Tables<"bot_users">[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Tables<"bot_users">[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
    premium: 0,
    new_today: 0,
    new_week: 0,
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Tables<"bot_users"> | null>(null);
  const [viewingUser, setViewingUser] = useState<Tables<"bot_users"> | null>(null);
  const [userInteractions, setUserInteractions] = useState<Tables<"user_interactions">[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "blocked" | "premium">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Form
  const [userForm, setUserForm] = useState<UserInput>({
    user_id: 0,
    username: "",
    first_name: "",
    last_name: "",
    full_name: "",
    phone_number: "",
    language_code: "en",
    is_active: true,
    is_blocked: false,
    is_premium: false,
    notes: "",
    tags: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, filterStatus]);

  const loadData = async () => {
    const [usersRes, statsRes] = await Promise.all([
      userService.getUsers(),
      userService.getUserStats()
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (statsRes.data) setStats(statsRes.data);
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "active") {
        filtered = filtered.filter(u => u.is_active && !u.is_blocked);
      } else if (filterStatus === "inactive") {
        filtered = filtered.filter(u => !u.is_active);
      } else if (filterStatus === "blocked") {
        filtered = filtered.filter(u => u.is_blocked);
      } else if (filterStatus === "premium") {
        filtered = filtered.filter(u => u.is_premium);
      }
    }

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.username?.toLowerCase().includes(search) ||
        u.first_name?.toLowerCase().includes(search) ||
        u.last_name?.toLowerCase().includes(search) ||
        u.full_name?.toLowerCase().includes(search) ||
        u.phone_number?.includes(search) ||
        u.user_id.toString().includes(search)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    if (!userForm.user_id || userForm.user_id === 0) {
      toast({ title: "Error", description: "User ID is required", variant: "destructive" });
      return;
    }

    const { data, error } = await userService.createUser(userForm);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User created successfully" });
      setShowCreateDialog(false);
      resetForm();
      loadData();
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const { error } = await userService.updateUser(editingUser.id, userForm);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User updated successfully" });
      setEditingUser(null);
      resetForm();
      loadData();
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const { error } = await userService.deleteUser(id);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User deleted successfully" });
      loadData();
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    const { error } = await userService.toggleUserStatus(id, isActive);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `User ${isActive ? "activated" : "deactivated"}` });
      loadData();
    }
  };

  const handleToggleBlock = async (id: string, isBlocked: boolean) => {
    const { error } = await userService.toggleBlockStatus(id, isBlocked);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `User ${isBlocked ? "blocked" : "unblocked"}` });
      loadData();
    }
  };

  const handleTogglePremium = async (id: string, isPremium: boolean) => {
    const { error } = await userService.togglePremiumStatus(id, isPremium);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Premium status ${isPremium ? "enabled" : "disabled"}` });
      loadData();
    }
  };

  const handleViewUser = async (user: Tables<"bot_users">) => {
    setViewingUser(user);
    setShowDetailDialog(true);

    // Load user interactions
    const { data } = await userService.getUserInteractions(user.id);
    if (data) setUserInteractions(data);
  };

  const handleExport = async () => {
    const filters: UserFilter = {
      status: filterStatus,
      search: searchQuery,
    };

    const { data, error } = await userService.exportUsers(filters);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }

    if (data) {
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Users exported successfully" });
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "block" | "delete") => {
    if (selectedUsers.length === 0) {
      toast({ title: "Warning", description: "No users selected", variant: "destructive" });
      return;
    }

    if (action === "delete") {
      if (!confirm(`Delete ${selectedUsers.length} user(s)?`)) return;
      const { error } = await userService.bulkDeleteUsers(selectedUsers);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Users deleted" });
        setSelectedUsers([]);
        loadData();
      }
    } else {
      const updates: Partial<UserInput> = 
        action === "activate" ? { is_active: true } :
        action === "deactivate" ? { is_active: false } :
        { is_blocked: true };

      const { error } = await userService.bulkUpdateUsers(selectedUsers, updates);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Users updated" });
        setSelectedUsers([]);
        loadData();
      }
    }
  };

  const resetForm = () => {
    setUserForm({
      user_id: 0,
      username: "",
      first_name: "",
      last_name: "",
      full_name: "",
      phone_number: "",
      language_code: "en",
      is_active: true,
      is_blocked: false,
      is_premium: false,
      notes: "",
      tags: [],
    });
  };

  const openEditUser = (user: Tables<"bot_users">) => {
    setEditingUser(user);
    setUserForm({
      user_id: user.user_id,
      username: user.username || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      full_name: user.full_name || "",
      phone_number: user.phone_number || "",
      language_code: user.language_code || "en",
      is_active: user.is_active,
      is_blocked: user.is_blocked,
      is_premium: user.is_premium,
      notes: user.notes || "",
      tags: user.tags || [],
    });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const getStatusBadge = (user: Tables<"bot_users">) => {
    if (user.is_blocked) {
      return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" /> Blocked</Badge>;
    }
    if (user.is_active) {
      return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Active</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Inactive</Badge>;
  };

  return (
    <ProtectedRoute>
      <SEO
        title="Users Management - Telegram Bot Admin"
        description="Manage your bot users"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Users Management</h1>
              <p className="mt-1 text-muted-foreground">
                Manage bot users, track activity, and control access
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showCreateDialog || !!editingUser} onOpenChange={(open) => {
                setShowCreateDialog(open);
                if (!open) {
                  setEditingUser(null);
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Update user information" : "Create a new bot user"}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Telegram User ID *</Label>
                        <Input
                          type="number"
                          placeholder="123456789"
                          value={userForm.user_id || ""}
                          onChange={(e) => setUserForm({ ...userForm, user_id: parseInt(e.target.value) || 0 })}
                          disabled={!!editingUser}
                        />
                        <p className="text-xs text-muted-foreground">
                          Unique Telegram user ID (cannot be changed)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          placeholder="@username"
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          placeholder="John"
                          value={userForm.first_name}
                          onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          placeholder="Doe"
                          value={userForm.last_name}
                          onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={userForm.full_name}
                        onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="+60123456789"
                          value={userForm.phone_number}
                          onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select
                          value={userForm.language_code}
                          onValueChange={(val) => setUserForm({ ...userForm, language_code: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ms">Malay</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                            <SelectItem value="id">Indonesian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Internal notes about this user..."
                        value={userForm.notes}
                        onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Active Status</Label>
                          <p className="text-xs text-muted-foreground">User can interact with bot</p>
                        </div>
                        <Switch
                          checked={userForm.is_active}
                          onCheckedChange={(checked) => setUserForm({ ...userForm, is_active: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Premium User</Label>
                          <p className="text-xs text-muted-foreground">Grant premium features access</p>
                        </div>
                        <Switch
                          checked={userForm.is_premium}
                          onCheckedChange={(checked) => setUserForm({ ...userForm, is_premium: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Blocked</Label>
                          <p className="text-xs text-muted-foreground">Block user from bot access</p>
                        </div>
                        <Switch
                          checked={userForm.is_blocked}
                          onCheckedChange={(checked) => setUserForm({ ...userForm, is_blocked: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setShowCreateDialog(false);
                      setEditingUser(null);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                      {editingUser ? "Update User" : "Create User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.total}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">All registered</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.active}</h3>
                  <p className="mt-2 text-sm text-success">
                    {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <UserCheck className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.inactive}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Not active</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blocked</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.blocked}</h3>
                  <p className="mt-2 text-sm text-destructive">Access denied</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3">
                  <Ban className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Premium</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.premium}</h3>
                  <p className="mt-2 text-sm text-accent">Premium users</p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <Crown className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Today</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.new_today}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Registrations</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.new_week}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Last 7 days</p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, username, phone, or user ID..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="blocked">Blocked Only</SelectItem>
                  <SelectItem value="premium">Premium Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="mb-4 flex items-center gap-3 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("block")}>
                    <Ban className="h-4 w-4 mr-1" />
                    Block
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-heading text-xl font-semibold">
                  {searchQuery || filterStatus !== "all" ? "No users found" : "No users yet"}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery || filterStatus !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Users will appear here when they interact with your bot"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown"}
                              {user.is_premium && <Crown className="h-4 w-4 text-accent" />}
                            </div>
                            {user.username && (
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.phone_number || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{user.user_id}</code>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* User Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewingUser?.full_name || `${viewingUser?.first_name || ""} ${viewingUser?.last_name || ""}`.trim() || "User Details"}
                {viewingUser?.is_premium && <Crown className="h-5 w-5 text-accent" />}
              </DialogTitle>
              <DialogDescription>
                Complete user information and activity
              </DialogDescription>
            </DialogHeader>

            {viewingUser && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity ({userInteractions.length})</TabsTrigger>
                  <TabsTrigger value="actions">Quick Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User ID:</span>
                          <code className="bg-muted px-2 py-0.5 rounded">{viewingUser.user_id}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Username:</span>
                          <span>{viewingUser.username ? `@${viewingUser.username}` : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{viewingUser.phone_number || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Language:</span>
                          <span>{viewingUser.language_code?.toUpperCase() || "-"}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Account Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          {getStatusBadge(viewingUser)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Premium:</span>
                          <Badge variant={viewingUser.is_premium ? "default" : "secondary"}>
                            {viewingUser.is_premium ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(viewingUser.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Seen:</span>
                          <span>
                            {viewingUser.last_seen 
                              ? new Date(viewingUser.last_seen).toLocaleString() 
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {viewingUser.notes && (
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {viewingUser.notes}
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-3">
                  {userInteractions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No activity recorded yet</p>
                    </div>
                  ) : (
                    userInteractions.map((interaction) => (
                      <Card key={interaction.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="capitalize">
                                {interaction.interaction_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(interaction.created_at).toLocaleString()}
                              </span>
                            </div>
                            {interaction.content && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {interaction.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        handleToggleStatus(viewingUser.id, !viewingUser.is_active);
                        setShowDetailDialog(false);
                      }}
                    >
                      {viewingUser.is_active ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      {viewingUser.is_active ? "Deactivate" : "Activate"}
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        handleToggleBlock(viewingUser.id, !viewingUser.is_blocked);
                        setShowDetailDialog(false);
                      }}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      {viewingUser.is_blocked ? "Unblock" : "Block User"}
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        handleTogglePremium(viewingUser.id, !viewingUser.is_premium);
                        setShowDetailDialog(false);
                      }}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {viewingUser.is_premium ? "Remove Premium" : "Make Premium"}
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setShowDetailDialog(false);
                        openEditUser(viewingUser);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>

                    <Button
                      variant="destructive"
                      className="justify-start col-span-2"
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleDeleteUser(viewingUser.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}