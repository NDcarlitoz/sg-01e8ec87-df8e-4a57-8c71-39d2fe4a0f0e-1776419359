import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { moderationService } from "@/services/moderationService";
import { groupService } from "@/services/groupService";
import { channelService } from "@/services/channelService";
import type { Tables } from "@/integrations/supabase/types";
import {
  Shield,
  Plus,
  Trash2,
  Save,
  Eye,
  Ban,
  UserX,
  MessageSquareOff,
  Hash,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ModerationPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Tables<"bot_groups">[]>([]);
  const [channels, setChannels] = useState<Tables<"channels">[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<Tables<"group_moderation_settings"> | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    auto_delete_enabled: true,
    auto_kick_enabled: false,
    auto_ban_enabled: false,
    kick_threshold: 3,
    ban_threshold: 5,
    violation_reset_hours: 24,
  });

  // Banned words state
  const [bannedWords, setBannedWords] = useState<Tables<"banned_words">[]>([]);
  const [isAddWordDialogOpen, setIsAddWordDialogOpen] = useState(false);
  const [wordForm, setWordForm] = useState({
    word: "",
    isRegex: false,
    caseSensitive: false,
    action: "delete" as "delete" | "kick" | "ban",
  });

  // Force join state
  const [forceJoinChannels, setForceJoinChannels] = useState<
    (Tables<"force_join_channels"> & { channel: Tables<"channels"> })[]
  >([]);
  const [isAddChannelDialogOpen, setIsAddChannelDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  // Logs state
  const [moderationLogs, setModerationLogs] = useState<Tables<"moderation_logs">[]>([]);

  // Delete dialogs state
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadModerationSettings();
      loadBannedWords();
      loadForceJoinChannels();
      loadModerationLogs();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    const { data, error } = await groupService.getGroups();
    if (!error && data) {
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0].id);
      }
    }
  };

  const loadChannels = async () => {
    const { data, error } = await channelService.getChannels();
    if (!error && data) {
      setChannels(data);
    }
  };

  const loadModerationSettings = async () => {
    const { data, error } = await moderationService.getModerationSettings(selectedGroup);
    if (!error && data) {
      setSettings(data);
      setSettingsForm({
        auto_delete_enabled: data.auto_delete_enabled,
        auto_kick_enabled: data.auto_kick_enabled,
        auto_ban_enabled: data.auto_ban_enabled,
        kick_threshold: data.kick_threshold,
        ban_threshold: data.ban_threshold,
        violation_reset_hours: data.violation_reset_hours,
      });
    }
  };

  const loadBannedWords = async () => {
    const { data, error } = await moderationService.getBannedWords(selectedGroup);
    if (!error && data) {
      setBannedWords(data);
    }
  };

  const loadForceJoinChannels = async () => {
    const { data, error } = await moderationService.getForceJoinChannels(selectedGroup);
    if (!error && data) {
      setForceJoinChannels(data);
    }
  };

  const loadModerationLogs = async () => {
    const { data, error } = await moderationService.getModerationLogs(selectedGroup, 50);
    if (!error && data) {
      setModerationLogs(data);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedGroup) return;

    setIsLoading(true);
    const { error } = await moderationService.upsertModerationSettings(
      selectedGroup,
      settingsForm
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
        description: "Moderation settings saved successfully",
      });
      loadModerationSettings();
    }
    setIsLoading(false);
  };

  const handleAddBannedWord = async () => {
    if (!selectedGroup || !wordForm.word.trim()) {
      toast({
        title: "Error",
        description: "Please enter a word or phrase",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await moderationService.addBannedWord(
      selectedGroup,
      wordForm.word,
      {
        isRegex: wordForm.isRegex,
        caseSensitive: wordForm.caseSensitive,
        action: wordForm.action,
      }
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
        description: "Banned word added successfully",
      });
      setIsAddWordDialogOpen(false);
      setWordForm({
        word: "",
        isRegex: false,
        caseSensitive: false,
        action: "delete",
      });
      loadBannedWords();
    }
    setIsLoading(false);
  };

  const handleDeleteBannedWord = async () => {
    if (!deleteWordId) return;

    setIsLoading(true);
    const { error } = await moderationService.deleteBannedWord(deleteWordId);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Banned word removed successfully",
      });
      loadBannedWords();
    }
    setDeleteWordId(null);
    setIsLoading(false);
  };

  const handleAddForceJoinChannel = async () => {
    if (!selectedGroup || !selectedChannel) {
      toast({
        title: "Error",
        description: "Please select a channel",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await moderationService.addForceJoinChannel(
      selectedGroup,
      selectedChannel
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
        description: "Force join channel added successfully",
      });
      setIsAddChannelDialogOpen(false);
      setSelectedChannel("");
      loadForceJoinChannels();
    }
    setIsLoading(false);
  };

  const handleRemoveForceJoinChannel = async () => {
    if (!deleteChannelId) return;

    setIsLoading(true);
    const { error } = await moderationService.removeForceJoinChannel(deleteChannelId);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Force join channel removed successfully",
      });
      loadForceJoinChannels();
    }
    setDeleteChannelId(null);
    setIsLoading(false);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "delete":
        return <Badge variant="secondary"><MessageSquareOff className="mr-1 h-3 w-3" />Delete</Badge>;
      case "kick":
        return <Badge variant="outline" className="border-warning text-warning"><UserX className="mr-1 h-3 w-3" />Kick</Badge>;
      case "ban":
        return <Badge variant="destructive"><Ban className="mr-1 h-3 w-3" />Ban</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const getLogActionBadge = (action: string) => {
    switch (action) {
      case "delete_message":
        return <Badge variant="secondary">Message Deleted</Badge>;
      case "kick":
        return <Badge variant="outline" className="border-warning text-warning">Kicked</Badge>;
      case "ban":
        return <Badge variant="destructive">Banned</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Warning</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <ProtectedRoute>
      <SEO
        title="Group Moderation - Dashboard"
        description="Manage group moderation settings, banned words, and security features"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Group Moderation
              </h1>
              <p className="mt-2 text-muted-foreground">
                Auto-moderation, banned words, force join channels, and security settings
              </p>
            </div>
            <Shield className="h-12 w-12 text-primary" />
          </div>

          {groups.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-heading text-xl font-semibold text-foreground">
                  No Groups Available
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Add groups in the Groups Management page to enable moderation features
                </p>
                <Button className="mt-4" onClick={() => window.location.href = "/dashboard/groups"}>
                  Go to Groups Management
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <Label htmlFor="group-select" className="text-base font-semibold">
                  Select Group to Moderate
                </Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger id="group-select" className="mt-2">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <span>{group.title}</span>
                          {group.is_active ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <XCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGroupData && (
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Chat ID: <code className="text-xs bg-muted px-1 rounded">{selectedGroupData.chat_id}</code></span>
                    <span>•</span>
                    <span>Members: {selectedGroupData.member_count || 0}</span>
                    <span>•</span>
                    <Badge variant={selectedGroupData.is_active ? "default" : "secondary"}>
                      {selectedGroupData.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                )}
              </Card>

              {selectedGroup && (
                <Tabs defaultValue="settings" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="banned-words">Banned Words</TabsTrigger>
                    <TabsTrigger value="force-join">Force Join</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    <Card className="p-6">
                      <h2 className="font-heading text-xl font-semibold mb-4">
                        Auto-Moderation Settings
                      </h2>

                      <div className="space-y-6">
                        {/* Auto Delete Messages */}
                        <div className="flex items-start justify-between space-x-4 rounded-lg border p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquareOff className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">Auto-Delete Messages</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Automatically delete messages containing banned words
                            </p>
                          </div>
                          <Switch
                            checked={settingsForm.auto_delete_enabled}
                            onCheckedChange={(checked) =>
                              setSettingsForm({ ...settingsForm, auto_delete_enabled: checked })
                            }
                          />
                        </div>

                        {/* Auto Kick */}
                        <div className="flex items-start justify-between space-x-4 rounded-lg border p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <UserX className="h-5 w-5 text-warning" />
                              <h3 className="font-semibold">Auto-Kick Users</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Kick users after reaching violation threshold
                            </p>
                            {settingsForm.auto_kick_enabled && (
                              <div className="mt-3">
                                <Label className="text-sm">Kick after violations:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={settingsForm.kick_threshold}
                                  onChange={(e) =>
                                    setSettingsForm({
                                      ...settingsForm,
                                      kick_threshold: parseInt(e.target.value) || 3,
                                    })
                                  }
                                  className="mt-1 w-32"
                                />
                              </div>
                            )}
                          </div>
                          <Switch
                            checked={settingsForm.auto_kick_enabled}
                            onCheckedChange={(checked) =>
                              setSettingsForm({ ...settingsForm, auto_kick_enabled: checked })
                            }
                          />
                        </div>

                        {/* Auto Ban */}
                        <div className="flex items-start justify-between space-x-4 rounded-lg border p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Ban className="h-5 w-5 text-destructive" />
                              <h3 className="font-semibold">Auto-Ban Users</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Permanently ban users after severe violations
                            </p>
                            {settingsForm.auto_ban_enabled && (
                              <div className="mt-3">
                                <Label className="text-sm">Ban after violations:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={settingsForm.ban_threshold}
                                  onChange={(e) =>
                                    setSettingsForm({
                                      ...settingsForm,
                                      ban_threshold: parseInt(e.target.value) || 5,
                                    })
                                  }
                                  className="mt-1 w-32"
                                />
                              </div>
                            )}
                          </div>
                          <Switch
                            checked={settingsForm.auto_ban_enabled}
                            onCheckedChange={(checked) =>
                              setSettingsForm({ ...settingsForm, auto_ban_enabled: checked })
                            }
                          />
                        </div>

                        {/* Violation Reset */}
                        <div className="rounded-lg border p-4">
                          <h3 className="font-semibold mb-1">Violation Counter Reset</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Reset user violation counters after this many hours
                          </p>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min="1"
                              max="168"
                              value={settingsForm.violation_reset_hours}
                              onChange={(e) =>
                                setSettingsForm({
                                  ...settingsForm,
                                  violation_reset_hours: parseInt(e.target.value) || 24,
                                })
                              }
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground">hours</span>
                          </div>
                        </div>

                        <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full">
                          <Save className="mr-2 h-4 w-4" />
                          {isLoading ? "Saving..." : "Save Settings"}
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Banned Words Tab */}
                  <TabsContent value="banned-words" className="space-y-6">
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="font-heading text-xl font-semibold">Banned Words & Phrases</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {bannedWords.length} banned {bannedWords.length === 1 ? "word" : "words"}
                          </p>
                        </div>
                        <Button onClick={() => setIsAddWordDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Banned Word
                        </Button>
                      </div>

                      {bannedWords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
                          <h3 className="font-semibold text-foreground">No banned words yet</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add words or phrases to filter from group messages
                          </p>
                          <Button onClick={() => setIsAddWordDialogOpen(true)} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Banned Word
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Word/Pattern</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Case Sensitive</TableHead>
                                <TableHead>Added</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bannedWords.map((word) => (
                                <TableRow key={word.id}>
                                  <TableCell>
                                    <code className="bg-muted px-2 py-1 rounded text-sm">
                                      {word.word}
                                    </code>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={word.is_regex ? "default" : "secondary"}>
                                      {word.is_regex ? "Regex" : "Keyword"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{getActionBadge(word.action)}</TableCell>
                                  <TableCell>
                                    {word.case_sensitive ? (
                                      <Badge variant="outline" className="text-xs">Yes</Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(word.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteWordId(word.id)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  {/* Force Join Tab */}
                  <TabsContent value="force-join" className="space-y-6">
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="font-heading text-xl font-semibold">Force Join Channels</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Require users to join these channels before participating in group
                          </p>
                        </div>
                        <Button onClick={() => setIsAddChannelDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Channel
                        </Button>
                      </div>

                      {forceJoinChannels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Hash className="h-12 w-12 text-muted-foreground mb-3" />
                          <h3 className="font-semibold text-foreground">No required channels</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add channels that users must join before posting in this group
                          </p>
                          <Button onClick={() => setIsAddChannelDialogOpen(true)} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Channel
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {forceJoinChannels.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex items-center gap-3">
                                <Hash className="h-5 w-5 text-primary" />
                                <div>
                                  <h3 className="font-semibold">{item.channel.title}</h3>
                                  {item.channel.username && (
                                    <a
                                      href={`https://t.me/${item.channel.username}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-accent hover:underline"
                                    >
                                      @{item.channel.username}
                                    </a>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Added {new Date(item.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteChannelId(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  {/* Logs Tab */}
                  <TabsContent value="logs" className="space-y-6">
                    <Card className="p-6">
                      <div className="mb-4">
                        <h2 className="font-heading text-xl font-semibold">Moderation Logs</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Recent moderation actions (last 50)
                        </p>
                      </div>

                      {moderationLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Eye className="h-12 w-12 text-muted-foreground mb-3" />
                          <h3 className="font-semibold text-foreground">No logs yet</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Moderation actions will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date/Time</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Triggered By</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {moderationLogs.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell className="text-sm">
                                    {new Date(log.performed_at).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">
                                        {log.username ? `@${log.username}` : "Unknown"}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ID: {log.user_id}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getLogActionBadge(log.action)}</TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="text-sm">{log.reason}</div>
                                    {log.message_text && (
                                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        "{log.message_text}"
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {log.triggered_by || "Manual"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>

        {/* Add Banned Word Dialog */}
        <Dialog open={isAddWordDialogOpen} onOpenChange={setIsAddWordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Banned Word</DialogTitle>
              <DialogDescription>
                Add a word or phrase to filter from group messages
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="word">Word or Pattern *</Label>
                <Input
                  id="word"
                  value={wordForm.word}
                  onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                  placeholder="spam, buy now, .*promo.*"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use plain text or regex pattern (if regex is enabled)
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="is-regex">Use Regex Pattern</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable for advanced pattern matching
                  </p>
                </div>
                <Switch
                  id="is-regex"
                  checked={wordForm.isRegex}
                  onCheckedChange={(checked) =>
                    setWordForm({ ...wordForm, isRegex: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="case-sensitive">Case Sensitive</Label>
                  <p className="text-xs text-muted-foreground">
                    Match exact letter casing
                  </p>
                </div>
                <Switch
                  id="case-sensitive"
                  checked={wordForm.caseSensitive}
                  onCheckedChange={(checked) =>
                    setWordForm({ ...wordForm, caseSensitive: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="action">Action on Detection *</Label>
                <Select
                  value={wordForm.action}
                  onValueChange={(value: any) => setWordForm({ ...wordForm, action: value })}
                >
                  <SelectTrigger id="action">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delete">Delete Message Only</SelectItem>
                    <SelectItem value="kick">Delete + Kick User</SelectItem>
                    <SelectItem value="ban">Delete + Ban User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddWordDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddBannedWord} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Banned Word"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Force Join Channel Dialog */}
        <Dialog open={isAddChannelDialogOpen} onOpenChange={setIsAddChannelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Force Join Channel</DialogTitle>
              <DialogDescription>
                Require users to join this channel before posting in the group
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="channel">Select Channel *</Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Choose a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels
                      .filter(
                        (c) =>
                          !forceJoinChannels.some((fj) => fj.channel_id === c.id)
                      )
                      .map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.title}
                          {channel.username && ` (@${channel.username})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {channels.filter(
                  (c) => !forceJoinChannels.some((fj) => fj.channel_id === c.id)
                ).length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    All channels already added or no channels available
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddChannelDialogOpen(false);
                  setSelectedChannel("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddForceJoinChannel} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Channel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Banned Word Dialog */}
        <AlertDialog open={!!deleteWordId} onOpenChange={() => setDeleteWordId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Banned Word</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this banned word? This will stop filtering
                messages containing this word.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBannedWord}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Force Join Channel Dialog */}
        <AlertDialog open={!!deleteChannelId} onOpenChange={() => setDeleteChannelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Force Join Channel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this channel? Users will no longer be
                required to join it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveForceJoinChannel}
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