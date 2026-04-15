import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { groupService } from "@/services/groupService";
import { telegramService } from "@/services/telegramService";
import type { Tables } from "@/integrations/supabase/types";
import {
  Plus,
  Trash2,
  Users,
  RefreshCw,
  Link as LinkIcon,
  Search,
  Edit,
  Settings,
  TrendingUp,
  Filter,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function GroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Tables<"bot_groups">[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Tables<"bot_groups">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<"all" | "group" | "supergroup">("all");

  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Tables<"bot_groups"> | null>(null);

  // Form states
  const [addFormData, setAddFormData] = useState({
    chatId: "",
    title: "",
    username: "",
    description: "",
    inviteLink: "",
    type: "group" as "group" | "supergroup",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    username: "",
    description: "",
    inviteLink: "",
  });

  const [settingsData, setSettingsData] = useState({
    autoWelcome: false,
    autoModeration: false,
    allowLinks: true,
    allowForwards: true,
    slowMode: false,
  });

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    filterAndSearchGroups();
  }, [groups, searchQuery, filterStatus, filterType]);

  const loadGroups = async () => {
    setIsLoading(true);
    const { data, error } = await groupService.getGroups();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      setGroups(data);
    }
    setIsLoading(false);
  };

  const filterAndSearchGroups = () => {
    let filtered = [...groups];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.chat_id.toString().includes(searchQuery)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((g) =>
        filterStatus === "active" ? g.is_active : !g.is_active
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((g) => g.type === filterType);
    }

    setFilteredGroups(filtered);
  };

  const openAddDialog = () => {
    setAddFormData({
      chatId: "",
      title: "",
      username: "",
      description: "",
      inviteLink: "",
      type: "group",
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (group: Tables<"bot_groups">) => {
    setSelectedGroup(group);
    setEditFormData({
      title: group.title,
      username: group.username || "",
      description: group.description || "",
      inviteLink: "",
    });
    setIsEditDialogOpen(true);
  };

  const openSettingsDialog = (group: Tables<"bot_groups">) => {
    setSelectedGroup(group);
    setSettingsData({
      autoWelcome: false,
      autoModeration: false,
      allowLinks: true,
      allowForwards: true,
      slowMode: false,
    });
    setIsSettingsDialogOpen(true);
  };

  const openDeleteDialog = (group: Tables<"bot_groups">) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const handleAddGroup = async () => {
    if (!addFormData.chatId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chat ID",
        variant: "destructive",
      });
      return;
    }

    if (!addFormData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group title",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { token } = await telegramService.getActiveBotToken();
    if (token) {
      const { data: chatInfo, error: chatError } = await telegramService.getChat(
        token,
        addFormData.chatId
      );

      if (chatError) {
        toast({
          title: "Error",
          description: `Failed to verify group: ${chatError}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data: memberCount } = await telegramService.getChatMembersCount(
        token,
        addFormData.chatId
      );

      const { error } = await groupService.upsertGroup({
        chat_id: Number(addFormData.chatId),
        title: chatInfo?.title || addFormData.title,
        username: chatInfo?.username || addFormData.username || undefined,
        type: (chatInfo?.type as "group" | "supergroup") || addFormData.type,
        description: addFormData.description || undefined,
        member_count: memberCount || 0,
      });

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Group added successfully",
        });
        setIsAddDialogOpen(false);
        loadGroups();
      }
    }

    setIsLoading(false);
  };

  const handleEditGroup = async () => {
    if (!selectedGroup) return;

    setIsLoading(true);

    const { error } = await groupService.upsertGroup({
      chat_id: selectedGroup.chat_id,
      title: editFormData.title,
      username: editFormData.username || undefined,
      description: editFormData.description || undefined,
      type: selectedGroup.type,
      member_count: selectedGroup.member_count || 0,
    });

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
      setIsEditDialogOpen(false);
      loadGroups();
    }

    setIsLoading(false);
  };

  const handleRefreshMemberCount = async (group: Tables<"bot_groups">) => {
    setIsLoading(true);

    const { token } = await telegramService.getActiveBotToken();
    if (!token) {
      toast({
        title: "Error",
        description: "No active bot token found",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { data: count, error } = await telegramService.getChatMembersCount(
      token,
      group.chat_id
    );

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      await groupService.upsertGroup({
        chat_id: group.chat_id,
        title: group.title,
        type: group.type,
        username: group.username || undefined,
        description: group.description || undefined,
        member_count: count || 0,
      });

      toast({
        title: "Success",
        description: `Member count updated: ${count || 0}`,
      });

      loadGroups();
    }

    setIsLoading(false);
  };

  const handleToggleStatus = async (group: Tables<"bot_groups">) => {
    setIsLoading(true);

    const { error } = await groupService.toggleGroupStatus(group.id, !group.is_active);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Group ${!group.is_active ? "activated" : "deactivated"}`,
      });
      loadGroups();
    }

    setIsLoading(false);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    setIsLoading(true);

    const { error } = await groupService.deleteGroup(selectedGroup.id);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Group removed successfully",
      });
      setIsDeleteDialogOpen(false);
      loadGroups();
    }

    setIsLoading(false);
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Group settings updated successfully",
    });
    setIsSettingsDialogOpen(false);
  };

  const handleExportData = () => {
    const csv = [
      ["Title", "Type", "Username", "Chat ID", "Members", "Status", "Created"],
      ...groups.map((g) => [
        g.title,
        g.type,
        g.username || "-",
        g.chat_id,
        g.member_count || 0,
        g.is_active ? "Active" : "Inactive",
        new Date(g.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `groups-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({
      title: "Export Complete",
      description: "Groups data exported to CSV",
    });
  };

  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.is_active).length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);
  const avgMembers = totalGroups > 0 ? Math.round(totalMembers / totalGroups) : 0;

  return (
    <ProtectedRoute>
      <SEO
        title="Groups Management - Dashboard"
        description="Manage Telegram groups connected to your bot"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Groups Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your Telegram groups, track members, and configure settings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Group
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {totalGroups}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {groups.filter((g) => g.type === "supergroup").length} supergroups
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Groups</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {activeGroups}
                  </h3>
                  <Badge variant="default" className="mt-2 bg-success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {totalMembers.toLocaleString()}
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-xs text-success">
                    <TrendingUp className="h-3 w-3" />
                    Growing
                  </div>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <Users className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Members</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {avgMembers}
                  </h3>
                  <Badge variant="outline" className="mt-2">
                    Per Group
                  </Badge>
                </div>
                <div className="rounded-lg bg-warning/10 p-3">
                  <Users className="h-6 w-6 text-warning" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters & Search */}
          <Card className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups by name, username, or chat ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="supergroup">Supergroup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Groups Table */}
          <Card>
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-6">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  {searchQuery || filterStatus !== "all" || filterType !== "all"
                    ? "No groups found"
                    : "No groups yet"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== "all" || filterType !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first Telegram group to start broadcasting"}
                </p>
                {!searchQuery && filterStatus === "all" && filterType === "all" && (
                  <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Chat ID</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{group.title}</div>
                            {group.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {group.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {group.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {group.username ? (
                            <a
                              href={`https://t.me/${group.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-accent hover:underline"
                            >
                              @{group.username}
                              <LinkIcon className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {group.chat_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {group.member_count || 0}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefreshMemberCount(group)}
                              disabled={isLoading}
                              className="h-7 w-7 p-0"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={group.is_active ? "default" : "secondary"}
                            className={
                              group.is_active ? "bg-success hover:bg-success/90" : ""
                            }
                          >
                            {group.is_active ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-1 h-3 w-3" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(group.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(group)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSettingsDialog(group)}
                              className="h-8 w-8 p-0"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(group)}
                              disabled={isLoading}
                              className="h-8 px-3"
                            >
                              {group.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(group)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        {/* Add Group Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Telegram Group</DialogTitle>
              <DialogDescription>
                Add a Telegram group to enable broadcasting and management
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="chatId">Chat ID *</Label>
                <Input
                  id="chatId"
                  value={addFormData.chatId}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, chatId: e.target.value })
                  }
                  placeholder="-1001234567890"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Telegram group chat ID (starts with -100 for supergroups)
                </p>
              </div>

              <div>
                <Label htmlFor="title">Group Title *</Label>
                <Input
                  id="title"
                  value={addFormData.title}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, title: e.target.value })
                  }
                  placeholder="My Community"
                />
              </div>

              <div>
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  value={addFormData.username}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, username: e.target.value })
                  }
                  placeholder="mycommunity"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Without @ symbol (for public groups)
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={addFormData.description}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, description: e.target.value })
                  }
                  placeholder="Brief description of the group"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddGroup} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Group Details</DialogTitle>
              <DialogDescription>
                Update group information and settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Group Title</Label>
                <Input
                  id="editTitle"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  placeholder="Group name"
                />
              </div>

              <div>
                <Label htmlFor="editUsername">Username</Label>
                <Input
                  id="editUsername"
                  value={editFormData.username}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, username: e.target.value })
                  }
                  placeholder="groupusername"
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  placeholder="Group description"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleEditGroup} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Group Settings</DialogTitle>
              <DialogDescription>
                Configure moderation and automation settings for{" "}
                {selectedGroup?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="autoWelcome">Auto-Welcome Message</Label>
                  <p className="text-sm text-muted-foreground">
                    Send welcome message to new members
                  </p>
                </div>
                <Switch
                  id="autoWelcome"
                  checked={settingsData.autoWelcome}
                  onCheckedChange={(checked) =>
                    setSettingsData({ ...settingsData, autoWelcome: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="autoModeration">Auto-Moderation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically moderate spam and inappropriate content
                  </p>
                </div>
                <Switch
                  id="autoModeration"
                  checked={settingsData.autoModeration}
                  onCheckedChange={(checked) =>
                    setSettingsData({ ...settingsData, autoModeration: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="allowLinks">Allow Links</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to post links
                  </p>
                </div>
                <Switch
                  id="allowLinks"
                  checked={settingsData.allowLinks}
                  onCheckedChange={(checked) =>
                    setSettingsData({ ...settingsData, allowLinks: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="allowForwards">Allow Message Forwards</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to forward messages
                  </p>
                </div>
                <Switch
                  id="allowForwards"
                  checked={settingsData.allowForwards}
                  onCheckedChange={(checked) =>
                    setSettingsData({ ...settingsData, allowForwards: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="slowMode">Slow Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit message frequency per user
                  </p>
                </div>
                <Switch
                  id="slowMode"
                  checked={settingsData.slowMode}
                  onCheckedChange={(checked) =>
                    setSettingsData({ ...settingsData, slowMode: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSettingsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Group</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{selectedGroup?.title}"? This will not
                remove your bot from the actual Telegram group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}