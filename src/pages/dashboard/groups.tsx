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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { groupService } from "@/services/groupService";
import { telegramService } from "@/services/telegramService";
import type { Tables } from "@/integrations/supabase/types";
import { Plus, Trash2, Users, RefreshCw, Link as LinkIcon } from "lucide-react";

export default function GroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Tables<"bot_groups">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Tables<"bot_groups"> | null>(null);
  const [formData, setFormData] = useState({
    chatId: "",
    title: "",
    username: "",
    description: "",
    inviteLink: "",
    type: "group" as "group" | "supergroup",
  });

  useEffect(() => {
    loadGroups();
  }, []);

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

  const openAddDialog = () => {
    setFormData({
      chatId: "",
      title: "",
      username: "",
      description: "",
      inviteLink: "",
      type: "group",
    });
    setIsAddDialogOpen(true);
  };

  const handleAddGroup = async () => {
    if (!formData.chatId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chat ID",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group title",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Verify group exists via Telegram API
    const { token } = await telegramService.getActiveBotToken();
    if (token) {
      const { data: chatInfo, error: chatError } = await telegramService.getChat(
        token,
        formData.chatId
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

      // Get member count
      const { data: memberCount } = await telegramService.getChatMembersCount(
        token,
        formData.chatId
      );

      // Create group with verified data
      const { error } = await groupService.upsertGroup({
        chat_id: Number(formData.chatId),
        title: chatInfo?.title || formData.title,
        username: chatInfo?.username || formData.username || undefined,
        type: (chatInfo?.type as "group" | "supergroup") || formData.type,
        description: formData.description || undefined,
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

    const { error } = await groupService.toggleGroupStatus(
      group.id,
      !group.is_active
    );

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

  const openDeleteDialog = (group: Tables<"bot_groups">) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Groups Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your Telegram groups and track members
              </p>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {totalGroups}
                  </h3>
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
                    Connected
                  </Badge>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <Users className="h-6 w-6 text-success" />
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

          <Card>
            <div className="p-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Connected Groups
              </h2>
            </div>

            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-6">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  No groups yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first Telegram group to start broadcasting
                </p>
                <Button onClick={openAddDialog} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
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
                    {groups.map((group) => (
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
                          <Badge variant={group.is_active ? "default" : "secondary"}>
                            {group.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(group.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(group)}
                              disabled={isLoading}
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
                  value={formData.chatId}
                  onChange={(e) =>
                    setFormData({ ...formData, chatId: e.target.value })
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
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="My Community"
                />
              </div>

              <div>
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
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
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the group"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="inviteLink">Invite Link (Optional)</Label>
                <Input
                  id="inviteLink"
                  value={formData.inviteLink}
                  onChange={(e) =>
                    setFormData({ ...formData, inviteLink: e.target.value })
                  }
                  placeholder="https://t.me/joinchat/..."
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