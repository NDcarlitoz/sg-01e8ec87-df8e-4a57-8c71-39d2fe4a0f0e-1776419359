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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { broadcastService } from "@/services/broadcastService";
import { channelService } from "@/services/channelService";
import { templateService } from "@/services/templateService";
import { userService } from "@/services/userService";
import { groupService } from "@/services/groupService";
import type { Tables } from "@/integrations/supabase/types";
import type { TelegramButton } from "@/services/telegramService";
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
  Calendar,
  BookOpen,
  Edit,
  Link as LinkIcon,
  Users,
  MessageSquare,
  Tv,
} from "lucide-react";

interface ButtonRow {
  id: string;
  buttons: TelegramButton[];
}

export default function BroadcastPage() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Tables<"broadcasts">[]>([]);
  const [channels, setChannels] = useState<Tables<"channels">[]>([]);
  const [users, setUsers] = useState<Tables<"bot_users">[]>([]);
  const [groups, setGroups] = useState<Tables<"bot_groups">[]>([]);
  const [templates, setTemplates] = useState<Tables<"broadcast_templates">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isTemplateDeleteDialogOpen, setIsTemplateDeleteDialogOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Tables<"broadcasts"> | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Tables<"broadcast_templates"> | null>(null);
  const [targetType, setTargetType] = useState<"channels" | "users" | "groups">("channels");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<"text" | "photo" | "document">("text");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [pinMessage, setPinMessage] = useState(false);
  const [buttonRows, setButtonRows] = useState<ButtonRow[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    caption: "",
  });
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    message: "",
    caption: "",
  });

  useEffect(() => {
    loadBroadcasts();
    loadChannels();
    loadUsers();
    loadGroups();
    loadTemplates();
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

  const loadUsers = async () => {
    const { data, error } = await userService.getUsers();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      setUsers(data.filter((u) => u.is_active));
    }
  };

  const loadGroups = async () => {
    const { data, error } = await groupService.getGroups();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      setGroups(data.filter((g) => g.is_active));
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await templateService.getTemplates();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      setTemplates(data);
    }
  };

  const openCreateDialog = () => {
    setFormData({ title: "", message: "", caption: "" });
    setTargetType("channels");
    setSelectedTargets([]);
    setMediaType("text");
    setUploadedFile(null);
    setMediaPreview(null);
    setScheduleEnabled(false);
    setScheduledDate("");
    setScheduledTime("");
    setPinMessage(false);
    setButtonRows([]);
    setIsCreateDialogOpen(true);
  };

  const openTemplateDialog = () => {
    setTemplateFormData({ name: "", message: "", caption: "" });
    setSelectedTemplate(null);
    setButtonRows([]);
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (template: Tables<"broadcast_templates">) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      name: template.name,
      message: template.message,
      caption: template.caption || "",
    });
    
    if (template.buttons) {
      const loadedButtons = (template.buttons as any).map((row: TelegramButton[], index: number) => ({
        id: `row-${Date.now()}-${index}`,
        buttons: row,
      }));
      setButtonRows(loadedButtons);
    } else {
      setButtonRows([]);
    }
    
    setIsTemplateDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

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

  const addButtonRow = () => {
    setButtonRows([
      ...buttonRows,
      {
        id: `row-${Date.now()}`,
        buttons: [{ text: "", url: "" }],
      },
    ]);
  };

  const addButtonToRow = (rowId: string) => {
    setButtonRows(
      buttonRows.map((row) =>
        row.id === rowId
          ? { ...row, buttons: [...row.buttons, { text: "", url: "" }] }
          : row
      )
    );
  };

  const updateButton = (
    rowId: string,
    buttonIndex: number,
    field: "text" | "url",
    value: string
  ) => {
    setButtonRows(
      buttonRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              buttons: row.buttons.map((btn, idx) =>
                idx === buttonIndex ? { ...btn, [field]: value } : btn
              ),
            }
          : row
      )
    );
  };

  const removeButton = (rowId: string, buttonIndex: number) => {
    setButtonRows(
      buttonRows.map((row) =>
        row.id === rowId
          ? { ...row, buttons: row.buttons.filter((_, idx) => idx !== buttonIndex) }
          : row
      ).filter((row) => row.buttons.length > 0)
    );
  };

  const removeButtonRow = (rowId: string) => {
    setButtonRows(buttonRows.filter((row) => row.id !== rowId));
  };

  const getButtonsArray = (): TelegramButton[][] | undefined => {
    const validRows = buttonRows
      .map((row) => row.buttons.filter((btn) => btn.text.trim() && btn.url?.trim()))
      .filter((row) => row.length > 0);

    return validRows.length > 0 ? validRows : undefined;
  };

  const applyTemplate = (template: Tables<"broadcast_templates">) => {
    setFormData({
      ...formData,
      message: template.message,
      caption: template.caption || "",
    });
    setMediaType(template.media_type as "text" | "photo" | "document");
    
    if (template.buttons) {
      const loadedButtons = (template.buttons as any).map((row: TelegramButton[], index: number) => ({
        id: `row-${Date.now()}-${index}`,
        buttons: row,
      }));
      setButtonRows(loadedButtons);
    }
    
    toast({
      title: "Template Applied",
      description: `"${template.name}" has been applied to your broadcast`,
    });
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

    if (selectedTargets.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one target",
        variant: "destructive",
      });
      return;
    }

    if (scheduleEnabled) {
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: "Error",
          description: "Please set schedule date and time",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      let mediaUrl = null;
      let mediaFilename = null;

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

      let scheduledAt = null;
      if (scheduleEnabled && scheduledDate && scheduledTime) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const buttons = getButtonsArray();

      const { error } = await broadcastService.createBroadcast({
        title: formData.title,
        message: formData.message,
        target_type: targetType,
        target_ids: selectedTargets,
        media_type: mediaType,
        media_url: mediaUrl || undefined,
        media_filename: mediaFilename || undefined,
        caption: formData.caption || undefined,
        scheduled_at: scheduledAt || undefined,
        buttons: buttons,
        pin_message: pinMessage,
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
          description: scheduleEnabled 
            ? `Broadcast scheduled for ${new Date(scheduledAt!).toLocaleString()}`
            : "Broadcast created successfully as draft",
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

  const handleSaveTemplate = async () => {
    if (!templateFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter template name",
        variant: "destructive",
      });
      return;
    }

    if (!templateFormData.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter template message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const buttons = getButtonsArray();

    if (selectedTemplate) {
      const { error } = await templateService.updateTemplate(selectedTemplate.id, {
        name: templateFormData.name,
        message: templateFormData.message,
        caption: templateFormData.caption,
        buttons: buttons,
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
          description: "Template updated successfully",
        });
        setIsTemplateDialogOpen(false);
        loadTemplates();
      }
    } else {
      const { error } = await templateService.createTemplate({
        name: templateFormData.name,
        message: templateFormData.message,
        caption: templateFormData.caption,
        buttons: buttons,
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
          description: "Template created successfully",
        });
        setIsTemplateDialogOpen(false);
        loadTemplates();
      }
    }

    setIsLoading(false);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);

    const { error } = await templateService.deleteTemplate(selectedTemplate.id);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      setIsTemplateDeleteDialogOpen(false);
      loadTemplates();
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

  const openTemplateDeleteDialog = (template: Tables<"broadcast_templates">) => {
    setSelectedTemplate(template);
    setIsTemplateDeleteDialogOpen(true);
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

  const toggleTargetSelection = (targetId: string) => {
    setSelectedTargets((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId]
    );
  };

  const getStatusBadge = (status: string, scheduledAt?: string | null) => {
    if (scheduledAt && status === "draft") {
      const scheduledDate = new Date(scheduledAt);
      const now = new Date();
      if (scheduledDate > now) {
        return (
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            Scheduled
          </Badge>
        );
      }
    }

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

  const getTargetTypeBadge = (type: string) => {
    const config: Record<string, { icon: any; label: string; variant: any }> = {
      channels: { icon: Tv, label: "Channels", variant: "default" },
      users: { icon: Users, label: "Users", variant: "secondary" },
      groups: { icon: MessageSquare, label: "Groups", variant: "outline" },
    };

    const { icon: Icon, label, variant } = config[type] || config.channels;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getCurrentTargets = () => {
    switch (targetType) {
      case "users":
        return users;
      case "groups":
        return groups;
      default:
        return channels;
    }
  };

  const getTargetId = (target: any) => {
    if (targetType === "users") {
      return target.user_id.toString();
    } else if (targetType === "groups") {
      return target.chat_id.toString();
    }
    return target.channel_id;
  };

  const getTargetName = (target: any) => {
    if (targetType === "users") {
      return target.first_name + (target.last_name ? ` ${target.last_name}` : "");
    } else if (targetType === "groups") {
      return target.title;
    }
    return target.channel_name;
  };

  const getTargetSecondary = (target: any) => {
    if (targetType === "users") {
      return target.username ? `@${target.username}` : null;
    } else if (targetType === "groups") {
      return target.username ? `@${target.username}` : `${target.member_count || 0} members`;
    }
    return target.channel_username ? `@${target.channel_username}` : null;
  };

  const totalBroadcasts = broadcasts.length;
  const sentBroadcasts = broadcasts.filter((b) => b.status === "sent").length;
  const draftBroadcasts = broadcasts.filter((b) => b.status === "draft").length;
  const scheduledBroadcasts = broadcasts.filter(
    (b) => b.status === "draft" && b.scheduled_at && new Date(b.scheduled_at) > new Date()
  ).length;

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
                Send messages to channels, groups, and users
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openTemplateDialog}>
                <BookOpen className="mr-2 h-4 w-4" />
                Templates
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Broadcast
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
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

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <h3 className="mt-2 font-heading text-3xl font-bold text-foreground">
                    {scheduledBroadcasts}
                  </h3>
                  <Badge variant="outline" className="mt-2">
                    Upcoming
                  </Badge>
                </div>
                <div className="rounded-lg bg-accent/10 p-3">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="broadcasts" className="w-full">
            <TabsList>
              <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
              <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="broadcasts" className="mt-6">
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
                          <TableHead>Target Type</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Recipients</TableHead>
                          <TableHead>Sent/Failed</TableHead>
                          <TableHead>Schedule</TableHead>
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
                                {broadcast.buttons && (broadcast.buttons as any).length > 0 && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    <LinkIcon className="mr-1 h-3 w-3" />
                                    {(broadcast.buttons as any).reduce((total: number, row: any) => total + row.length, 0)} buttons
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getTargetTypeBadge(broadcast.target_type)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {broadcast.media_type || "text"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(broadcast.status, broadcast.scheduled_at)}</TableCell>
                            <TableCell>{broadcast.target_ids.length}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <span className="text-success">{broadcast.sent_count || 0}</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-destructive">{broadcast.failed_count || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {broadcast.scheduled_at ? (
                                <div className="text-sm">
                                  {new Date(broadcast.scheduled_at).toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(broadcast.created_at).toLocaleDateString()}
                              {broadcast.pin_message && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  📌 Pinned
                                </Badge>
                              )}
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
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <Card>
                <div className="p-6 flex items-center justify-between">
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Message Templates
                  </h2>
                  <Button onClick={openTemplateDialog} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </div>

                {templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-6">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                      No templates yet
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create reusable templates for common messages
                    </p>
                    <Button onClick={openTemplateDialog} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{template.name}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="capitalize text-xs">
                                {template.media_type}
                              </Badge>
                              {template.buttons && (template.buttons as any).length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <LinkIcon className="mr-1 h-3 w-3" />
                                  {(template.buttons as any).reduce((total: number, row: any) => total + row.length, 0)} buttons
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditTemplateDialog(template)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTemplateDeleteDialog(template)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {template.message}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            applyTemplate(template);
                            openCreateDialog();
                          }}
                          className="w-full"
                        >
                          Use Template
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Broadcast</DialogTitle>
              <DialogDescription>
                Create a broadcast message to send to channels, groups, or users
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

              {templates.length > 0 && (
                <div>
                  <Label>Quick Apply Template</Label>
                  <Select onValueChange={(value) => {
                    const template = templates.find(t => t.id === value);
                    if (template) applyTemplate(template);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <div className="flex items-center justify-between mb-2">
                  <Label>Inline Buttons (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addButtonRow}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                  </Button>
                </div>
                
                {buttonRows.length > 0 && (
                  <div className="space-y-3 border border-border rounded-lg p-4">
                    {buttonRows.map((row, rowIndex) => (
                      <div key={row.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Row {rowIndex + 1}</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addButtonToRow(row.id)}
                              className="h-7 text-xs"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Button
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeButtonRow(row.id)}
                              className="h-7 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          {row.buttons.map((button, btnIndex) => (
                            <div key={btnIndex} className="flex gap-2">
                              <Input
                                placeholder="Button text"
                                value={button.text}
                                onChange={(e) =>
                                  updateButton(row.id, btnIndex, "text", e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="URL (https://...)"
                                value={button.url || ""}
                                onChange={(e) =>
                                  updateButton(row.id, btnIndex, "url", e.target.value)
                                }
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeButton(row.id, btnIndex)}
                                className="h-10 w-10 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Buttons will appear below the message. Each row can have multiple buttons side by side.
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="schedule"
                    checked={scheduleEnabled}
                    onCheckedChange={(checked) => setScheduleEnabled(!!checked)}
                  />
                  <Label htmlFor="schedule" className="font-normal cursor-pointer">
                    Schedule for later
                  </Label>
                </div>

                {scheduleEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinMessage"
                  checked={pinMessage}
                  onCheckedChange={(checked) => setPinMessage(!!checked)}
                />
                <Label htmlFor="pinMessage" className="font-normal cursor-pointer">
                  Pin message after sending (for channels/groups)
                </Label>
              </div>

              <div>
                <Label>Target Type *</Label>
                <RadioGroup value={targetType} onValueChange={(value: any) => {
                  setTargetType(value);
                  setSelectedTargets([]);
                }}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="channels" id="target-channels" />
                    <Label htmlFor="target-channels" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Tv className="h-4 w-4" />
                        Channels
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="users" id="target-users" />
                    <Label htmlFor="target-users" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Users (Private Chats)
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="groups" id="target-groups" />
                    <Label htmlFor="target-groups" className="font-normal cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Groups
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Select Targets * ({selectedTargets.length} selected)</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                  {getCurrentTargets().length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No active {targetType} available
                    </p>
                  ) : (
                    getCurrentTargets().map((target) => (
                      <div key={target.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={target.id}
                          checked={selectedTargets.includes(getTargetId(target))}
                          onCheckedChange={() => toggleTargetSelection(getTargetId(target))}
                        />
                        <Label
                          htmlFor={target.id}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {getTargetName(target)}
                          {getTargetSecondary(target) && (
                            <span className="ml-2 text-muted-foreground">
                              {getTargetSecondary(target)}
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
                {isLoading ? "Creating..." : scheduleEnabled ? "Schedule Broadcast" : "Create & Save as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
              <DialogDescription>
                Save reusable message templates for quick broadcasting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Weekly Update"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="template-message">Message *</Label>
                <Textarea
                  id="template-message"
                  placeholder="Type your template message..."
                  rows={6}
                  value={templateFormData.message}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, message: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="template-caption">Caption (Optional)</Label>
                <Textarea
                  id="template-caption"
                  placeholder="Add caption for media templates..."
                  rows={3}
                  value={templateFormData.caption}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, caption: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Inline Buttons (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addButtonRow}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                  </Button>
                </div>
                
                {buttonRows.length > 0 && (
                  <div className="space-y-3 border border-border rounded-lg p-4">
                    {buttonRows.map((row, rowIndex) => (
                      <div key={row.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Row {rowIndex + 1}</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addButtonToRow(row.id)}
                              className="h-7 text-xs"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Button
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeButtonRow(row.id)}
                              className="h-7 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          {row.buttons.map((button, btnIndex) => (
                            <div key={btnIndex} className="flex gap-2">
                              <Input
                                placeholder="Button text"
                                value={button.text}
                                onChange={(e) =>
                                  updateButton(row.id, btnIndex, "text", e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="URL (https://...)"
                                value={button.url || ""}
                                onChange={(e) =>
                                  updateButton(row.id, btnIndex, "url", e.target.value)
                                }
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeButton(row.id, btnIndex)}
                                className="h-10 w-10 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTemplateDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={isLoading}>
                {isLoading ? "Saving..." : selectedTemplate ? "Update Template" : "Create Template"}
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

        <AlertDialog open={isTemplateDeleteDialogOpen} onOpenChange={setIsTemplateDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTemplate}
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