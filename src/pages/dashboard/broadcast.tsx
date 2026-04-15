import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { broadcastService } from "@/services/broadcastService";
import { channelService } from "@/services/channelService";
import type { Tables } from "@/integrations/supabase/types";
import { Send, Plus, Trash2, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function BroadcastPage() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Tables<"broadcasts">[]>([]);
  const [channels, setChannels] = useState<Tables<"channels">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Tables<"broadcasts"> | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_type: "selected_channels",
  });

  useEffect(() => {
    loadBroadcasts();
    loadChannels();
  }, []);

  const loadBroadcasts = async () => {
    const { data, error } = await broadcastService.getBroadcasts();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      setBroadcasts(data);
    }
  };

  const loadChannels = async () => {
    const { data, error } = await channelService.getChannels();
    if (error) {
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || "Failed to load channels",
        variant: "destructive",
      });
    } else if (data) {
      setChannels(data.filter((ch) => ch.is_active));
    }
  };

  const openCreateDialog = () => {
    setFormData({
      title: "",
      message: "",
      target_type: "selected_channels",
    });
    setSelectedChannels([]);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (broadcast: Tables<"broadcasts">) => {
    setSelectedBroadcast(broadcast);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedChannels.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one channel",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { data, error } = await broadcastService.createBroadcast({
      ...formData,
      target_ids: selectedChannels,
    });

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      toast({
        title: "Success",
        description: "Broadcast created successfully",
      });
      setIsDialogOpen(false);
      loadBroadcasts();
    }
    setIsLoading(false);
  };

  const handleSendBroadcast = async (broadcastId: string) => {
    setIsLoading(true);
    const { success, error } = await broadcastService.sendBroadcast(broadcastId);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (success) {
      toast({
        title: "Success",
        description: "Broadcast sent successfully",
      });
      loadBroadcasts();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedBroadcast) return;

    setIsLoading(true);
    const { error } = await broadcastService.deleteBroadcast(selectedBroadcast.id);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Broadcast deleted successfully",
      });
      setDeleteDialogOpen(false);
      loadBroadcasts();
    }
    setIsLoading(false);
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "secondary" as const, icon: Clock, label: "Draft" },
      sending: { variant: "default" as const, icon: Send, label: "Sending" },
      sent: { variant: "default" as const, icon: CheckCircle2, label: "Sent" },
      failed: { variant: "destructive" as const, icon: XCircle, label: "Failed" },
    };

    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: broadcasts.length,
    sent: broadcasts.filter((b) => b.status === "sent").length,
    draft: broadcasts.filter((b) => b.status === "draft").length,
  };

  return (
    <ProtectedRoute>
      <SEO title="Broadcast Messages - Telegram Bot Dashboard" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Broadcast Messages</h1>
              <p className="mt-1 text-muted-foreground">
                Send messages to multiple channels and groups
              </p>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              New Broadcast
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Broadcasts</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold">{stats.total}</h3>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <Send className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-success">
                    {stats.sent}
                  </h3>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Draft</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-warning">
                    {stats.draft}
                  </h3>
                </div>
                <div className="rounded-lg bg-warning/10 p-3">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h2 className="font-heading text-xl font-semibold">Broadcast History</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                View and manage all your broadcast messages
              </p>
            </div>

            {broadcasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Send className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="font-heading text-lg font-semibold">No broadcasts yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first broadcast to send messages to your channels
                </p>
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Broadcast
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Sent / Failed</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{broadcast.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {broadcast.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                        <TableCell>{broadcast.total_recipients || 0}</TableCell>
                        <TableCell>
                          <span className="text-success">{broadcast.sent_count || 0}</span> /{" "}
                          <span className="text-destructive">{broadcast.failed_count || 0}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(broadcast.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {broadcast.status === "draft" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSendBroadcast(broadcast.id)}
                                disabled={isLoading}
                                className="gap-1"
                              >
                                <Send className="h-3 w-3" />
                                Send
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(broadcast)}
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Broadcast</DialogTitle>
              <DialogDescription>
                Compose a message to send to selected channels
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Broadcast Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weekly Newsletter"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Select Channels *</Label>
                <div className="rounded-lg border p-4 space-y-2 max-h-48 overflow-y-auto">
                  {channels.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active channels found. Add channels first.
                    </p>
                  ) : (
                    channels.map((channel) => (
                      <div key={channel.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={channel.id}
                          checked={selectedChannels.includes(channel.channel_id)}
                          onCheckedChange={() => toggleChannelSelection(channel.channel_id)}
                        />
                        <Label
                          htmlFor={channel.id}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          <div className="flex items-center justify-between">
                            <span>{channel.channel_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {channel.channel_username}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedChannels.length} channel(s) selected
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create & Save as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Broadcast</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{selectedBroadcast?.title}&quot;? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}