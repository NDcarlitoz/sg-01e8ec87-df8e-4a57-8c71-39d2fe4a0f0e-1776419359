import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Hash, Plus, Pencil, Trash2, Users, TrendingUp, RefreshCw } from "lucide-react";
import { channelService } from "@/services/channelService";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { SEO } from "@/components/SEO";

type Channel = Tables<"channels">;

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    channel_name: "",
    channel_username: "",
    channel_id: "",
    description: "",
    subscriber_count: 0,
  });

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    const { data, error } = await channelService.getChannels();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load channels",
        variant: "destructive",
      });
    } else {
      setChannels(data || []);
    }
    setLoading(false);
  };

  const handleAddChannel = async () => {
    if (!formData.channel_name || !formData.channel_username || !formData.channel_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!channelService.validateChannelUsername(formData.channel_username)) {
      toast({
        title: "Invalid Username",
        description: "Channel username must start with @ and be 5-32 characters",
        variant: "destructive",
      });
      return;
    }

    if (!channelService.validateChannelId(formData.channel_id)) {
      toast({
        title: "Invalid Channel ID",
        description: "Channel ID must be numeric (e.g., -1001234567890)",
        variant: "destructive",
      });
      return;
    }

    const { error } = await channelService.createChannel(formData);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to add channel",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Channel added successfully",
      });
      setShowAddDialog(false);
      resetForm();
      loadChannels();
    }
  };

  const handleEditChannel = async () => {
    if (!selectedChannel) return;

    if (formData.channel_username && !channelService.validateChannelUsername(formData.channel_username)) {
      toast({
        title: "Invalid Username",
        description: "Channel username must start with @ and be 5-32 characters",
        variant: "destructive",
      });
      return;
    }

    const { error } = await channelService.updateChannel(selectedChannel.id, {
      channel_name: formData.channel_name,
      channel_username: formData.channel_username,
      description: formData.description,
      subscriber_count: formData.subscriber_count,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update channel",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Channel updated successfully",
      });
      setShowEditDialog(false);
      setSelectedChannel(null);
      resetForm();
      loadChannels();
    }
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannel) return;

    const { error } = await channelService.deleteChannel(selectedChannel.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete channel",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Channel deleted successfully",
      });
      setShowDeleteDialog(false);
      setSelectedChannel(null);
      loadChannels();
    }
  };

  const handleToggleStatus = async (channel: Channel) => {
    const { error } = await channelService.toggleChannelStatus(channel.id, !channel.is_active);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update channel status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Channel ${!channel.is_active ? "activated" : "deactivated"}`,
      });
      loadChannels();
    }
  };

  const syncChannelWithTelegram = async (channelId: string, telegramChannelId: string) => {
    try {
      const response = await fetch("/api/telegram/get-chat-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: telegramChannelId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch channel info from Telegram");
      }

      const { data } = await response.json();
      
      if (data.members_count !== null) {
        await channelService.updateChannel(channelId, {
          subscriber_count: data.members_count,
        });
        
        toast({
          title: "Success",
          description: "Channel synced with Telegram successfully",
        });
        
        loadChannels();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync with Telegram",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (channel: Channel) => {
    setSelectedChannel(channel);
    setFormData({
      channel_name: channel.channel_name,
      channel_username: channel.channel_username,
      channel_id: channel.channel_id,
      description: channel.description || "",
      subscriber_count: channel.subscriber_count || 0,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      channel_name: "",
      channel_username: "",
      channel_id: "",
      description: "",
      subscriber_count: 0,
    });
  };

  const totalSubscribers = channels.reduce((sum, ch) => sum + (ch.subscriber_count || 0), 0);
  const activeChannels = channels.filter(ch => ch.is_active).length;
  const avgSubscribers = channels.length > 0 ? Math.round(totalSubscribers / channels.length) : 0;

  return (
    <ProtectedRoute>
      <SEO title="Channels - Telegram Bot Admin" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Channels</h1>
              <p className="mt-1 text-muted-foreground">
                Manage your Telegram channels
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Channels</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{channels.length}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {activeChannels} active
                  </p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <Hash className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">
                    {totalSubscribers.toLocaleString()}
                  </h3>
                  <p className="mt-2 text-sm text-success">Across all channels</p>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <Users className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Subscribers</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">
                    {avgSubscribers.toLocaleString()}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">Per channel</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h2 className="font-heading text-xl font-bold">All Channels</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                View and manage your connected channels
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <p className="text-muted-foreground">Loading channels...</p>
              </div>
            ) : channels.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Hash className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-heading text-lg font-semibold">No channels yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by adding your first Telegram channel
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Channel
                </Button>
              </div>
            ) : (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Channel ID</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium">{channel.channel_name}</TableCell>
                        <TableCell>
                          <span className="text-accent">{channel.channel_username}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {channel.channel_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{channel.subscriber_count?.toLocaleString() || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={channel.is_active}
                              onCheckedChange={() => handleToggleStatus(channel)}
                            />
                            <Badge variant={channel.is_active ? "default" : "secondary"}>
                              {channel.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => syncChannelWithTelegram(channel.id, channel.channel_id)}
                              className="h-8 w-8 p-0"
                              title="Sync with Telegram"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={channel.is_active}
                              onCheckedChange={() => handleToggleStatus(channel)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(channel)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(channel)}
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

        {/* Add Channel Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Channel</DialogTitle>
              <DialogDescription>
                Connect a Telegram channel to your bot admin dashboard
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="channel_name">Channel Name *</Label>
                <Input
                  id="channel_name"
                  placeholder="My Channel"
                  value={formData.channel_name}
                  onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel_username">Channel Username *</Label>
                <Input
                  id="channel_username"
                  placeholder="@mychannel"
                  value={formData.channel_username}
                  onChange={(e) => setFormData({ ...formData, channel_username: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Format: @username (5-32 characters)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel_id">Channel ID *</Label>
                <Input
                  id="channel_id"
                  placeholder="-1001234567890"
                  value={formData.channel_id}
                  onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Numeric ID (get from @userinfobot)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriber_count">Subscriber Count</Label>
                <Input
                  id="subscriber_count"
                  type="number"
                  placeholder="0"
                  value={formData.subscriber_count}
                  onChange={(e) => setFormData({ ...formData, subscriber_count: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Channel description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddChannel}>Add Channel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Channel Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Channel</DialogTitle>
              <DialogDescription>
                Update channel information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_channel_name">Channel Name</Label>
                <Input
                  id="edit_channel_name"
                  value={formData.channel_name}
                  onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_channel_username">Channel Username</Label>
                <Input
                  id="edit_channel_username"
                  value={formData.channel_username}
                  onChange={(e) => setFormData({ ...formData, channel_username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_subscriber_count">Subscriber Count</Label>
                <Input
                  id="edit_subscriber_count"
                  type="number"
                  value={formData.subscriber_count}
                  onChange={(e) => setFormData({ ...formData, subscriber_count: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setSelectedChannel(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditChannel}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Channel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this channel? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false);
                setSelectedChannel(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChannel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}