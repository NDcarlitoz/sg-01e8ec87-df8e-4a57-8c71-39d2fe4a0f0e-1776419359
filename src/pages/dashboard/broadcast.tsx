import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { broadcastService } from "@/services/broadcastService";
import { channelService } from "@/services/channelService";
import type { Tables } from "@/integrations/supabase/types";
import {
  Send,
  Plus,
  Trash2,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

export default function BroadcastPage() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Tables<"broadcasts">[]>([]);
  const [channels, setChannels] = useState<Tables<"channels">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Tables<"broadcasts"> | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<"text" | "photo" | "document">("text");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    caption: "",
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
        description: typeof error === "string" ? error : error.message || "Failed to load channels",
        variant: "destructive",
      });
    } else if (data) {
      setChannels(data.filter((ch) => ch.is_active));
    }
  };

  const openCreateDialog = () => {
    setFormData({ title: "", message: "", caption: "" });
    setSelectedChannels([]);
    setMediaType("text");
    setUploadedFile(null);
    setMediaPreview(null);
    setIsCreateDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (mediaType === "photo") {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
    }

    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setMediaPreview(null);
  };

  const handleCreateBroadcast = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a broadcast title",
        variant: "destructive",
      });
      return;
    }

    if (mediaType === "text" && !formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if ((mediaType === "photo" || mediaType === "document") && !uploadedFile) {
      toast({
        title: "Error",
        description: `Please upload ${mediaType === "photo" ? "an image" : "a file"}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedChannels.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one channel",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let mediaUrl = null;
      let mediaFilename = null;

      // Upload media if present
      if (uploadedFile && (mediaType === "photo" || mediaType === "document")) {
        const { url, error: uploadError } = await broadcastService.uploadMedia(uploadedFile);
        if (uploadError) {
          toast({
            title: "Error",
            description: uploadError,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        mediaUrl = url;
        mediaFilename = uploadedFile.name;
      }

      const { error } = await broadcastService.createBroadcast({
        title: formData.title,
        message: formData.message,
        target_type: "channels",
        target_ids: selectedChannels,
        media_type: mediaType,
        media_url: mediaUrl || undefined,
        media_filename: mediaFilename || undefined,
        caption: formData.caption || undefined,
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
          description: "Broadcast created successfully as draft",
        });
        setIsCreateDialogOpen(false);
        loadBroadcasts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create broadcast",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleSendBroadcast = async (broadcast: Tables<"broadcasts">) => {
    setIsLoading(true);

    const { success, error } = await broadcastService.sendBroadcast(broadcast.id);

    if (error || !success) {
      toast({
        title: "Error",
        description: error || "Failed to send broadcast",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Broadcast sent successfully",
      });
      loadBroadcasts();
    }

    setIsLoading(false);
  };

  const openDeleteDialog = (broadcast: Tables<"broadcasts">) => {
    setSelectedBroadcast(broadcast);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBroadcast = async () => {
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
      setIsDeleteDialogOpen(false);
      loadBroadcasts();
    }

    setIsLoading(false);
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      draft: { variant: "secondary", icon: Clock },
      sending: { variant: "default", icon: Radio },
      sent: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalBroadcasts = broadcasts.length;
  const sentBroadcasts = broadcasts.filter((b) => b.status === "sent").length;
  const draftBroadcasts = broadcasts.filter((b) => b.status === "draft").length;

  return (
    <ProtectedRoute>
      <SEO
        title="Broadcast Messages - Dashboard"
        description="Send broadcast messages to multiple Telegram channels and groups"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Broadcast Messages
              </h1>
              <p className="mt-2 text-muted-foreground">
                Send messages to multiple channels and groups at once
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Broadcast
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Broadcasts</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {totalBroadcasts}
                  </h3>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <Send className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successfully Sent</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {sentBroadcasts}
                  </h3>
                  <Badge variant="default" className="mt-2 bg-success">
                    Delivered
                  </Badge>
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
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {draftBroadcasts}
                  </h3>
                  <Badge variant="secondary" className="mt-2">
                    Pending
                  </Badge>
                </div>
                <div className="rounded-lg bg-warning/10 p-3">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Broadcast History
              </h2>
            </div>

            {broadcasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-6">
                  <Send className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  No broadcasts yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first broadcast to start sending messages
                </p>
                <Button onClick={openCreateDialog} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Broadcast
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Sent/Failed</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{broadcast.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {broadcast.media_type === "photo" && "📷 "}
                              {broadcast.media_type === "document" && "📄 "}
                              {broadcast.caption || broadcast.message}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {broadcast.media_type || "text"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                        <TableCell>{broadcast.target_ids.length}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <span className="text-success">{broadcast.sent_count || 0}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-destructive">{broadcast.failed_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(broadcast.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {broadcast.status === "draft" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSendBroadcast(broadcast)}
                                disabled={isLoading}
                                className="gap-1"
                              >
                                <Send className="h-4 w-4" />
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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Broadcast</DialogTitle>
              <DialogDescription>
                Create a broadcast message to send to multiple channels
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Broadcast Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weekly Newsletter"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <Label>Media Type *</Label>
                <RadioGroup value={mediaType} onValueChange={(value: any) => setMediaType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Text Only
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="photo" id="photo" />
                    <Label htmlFor="photo" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Photo with Caption
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="document" id="document" />
                    <Label htmlFor="document" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Document/File with Caption
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {mediaType === "text" ? (
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formData.message.length} characters
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="file">
                      {mediaType === "photo" ? "Upload Image *" : "Upload File *"}
                    </Label>
                    <div className="mt-2">
                      {!uploadedFile ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                          <input
                            type="file"
                            id="file"
                            className="hidden"
                            accept={mediaType === "photo" ? "image/*" : "*"}
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="file" className="cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Click to upload {mediaType === "photo" ? "image" : "file"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">Max size: 10MB</p>
                          </label>
                        </div>
                      ) : (
                        <div className="border border-border rounded-lg p-4">
                          {mediaPreview && (
                            <div className="mb-4">
                              <img
                                src={mediaPreview}
                                alt="Preview"
                                className="max-h-48 rounded-lg mx-auto"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {mediaType === "photo" ? (
                                <ImageIcon className="h-5 w-5 text-primary" />
                              ) : (
                                <FileText className="h-5 w-5 text-primary" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{uploadedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(uploadedFile.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="caption">Caption</Label>
                    <Textarea
                      id="caption"
                      placeholder="Add a caption for your media..."
                      rows={4}
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Select Channels * ({selectedChannels.length} selected)</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                  {channels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active channels available</p>
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
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {channel.channel_name}
                          {channel.channel_username && (
                            <span className="ml-2 text-muted-foreground">
                              @{channel.channel_username}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateBroadcast} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create & Save as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Broadcast</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this broadcast? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBroadcast}
                disabled={isLoading}
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