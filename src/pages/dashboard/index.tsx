import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Bot, Activity, Zap, Edit, Radio } from "lucide-react";
import { botTokenService } from "@/services/botTokenService";
import { profileService } from "@/services/profileService";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type BotToken = Tables<"bot_tokens">;

export default function BotSettings() {
  const [botTokens, setBotTokens] = useState<BotToken[]>([]);
  const [webhookStatuses, setWebhookStatuses] = useState<Record<string, {
    is_set: boolean;
    url: string | null;
    checking: boolean;
  }>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<BotToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("User");
  const [botStats, setBotStats] = useState({ total: 0, active: 0, inactive: 0 });
  
  const [formData, setFormData] = useState({
    bot_name: "",
    bot_token: "",
    bot_username: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadBotTokens();
    loadUserProfile();
    loadBotStats();
  }, []);

  const loadUserProfile = async () => {
    const { data } = await profileService.getCurrentProfile();
    if (data?.full_name) {
      setUserName(data.full_name.split(" ")[0] || "User");
    }
  };

  const loadBotStats = async () => {
    const { data } = await botTokenService.getBotStats();
    if (data) {
      setBotStats(data);
    }
  };

  const loadBotTokens = async () => {
    const { data } = await botTokenService.getBotTokens();
    if (data) {
      setBotTokens(data);
      // Auto-check webhook status for each bot
      data.forEach(bot => checkWebhookStatus(bot.id));
    }
  };

  const checkWebhookStatus = async (botId: string) => {
    setWebhookStatuses(prev => ({
      ...prev,
      [botId]: { ...prev[botId], checking: true }
    }));

    const { data, error } = await botTokenService.checkWebhookStatus(botId);
    
    setWebhookStatuses(prev => ({
      ...prev,
      [botId]: {
        is_set: data?.is_set || false,
        url: data?.url || null,
        checking: false,
      }
    }));

    if (error) {
      console.error(`Webhook check error for bot ${botId}:`, error);
    }
  };

  const handleAddToken = async () => {
    if (!formData.bot_name || !formData.bot_token) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    if (!botTokenService.validateBotToken(formData.bot_token)) {
      toast({
        title: "Invalid Token",
        description: "Bot token format is invalid. It should be in format: 123456789:ABCdefGHI...",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await botTokenService.createBotToken({
      bot_name: formData.bot_name,
      bot_token: formData.bot_token,
      bot_username: formData.bot_username
    });
    setIsLoading(false);

    if (error) {
      console.error("Bot token creation error:", error);
      toast({
        title: "Error",
        description: error || "Failed to add bot token",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Bot token added successfully",
    });

    setIsAddDialogOpen(false);
    setFormData({ bot_name: "", bot_token: "", bot_username: "" });
    loadBotTokens();
    loadBotStats();
  };

  const handleEditToken = async () => {
    if (!selectedToken || !formData.bot_name || !formData.bot_token) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    if (!botTokenService.validateBotToken(formData.bot_token)) {
      toast({
        title: "Invalid Token",
        description: "Bot token format is invalid",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await botTokenService.updateBotToken(selectedToken.id, {
      bot_name: formData.bot_name,
      bot_token: formData.bot_token,
      bot_username: formData.bot_username
    });
    setIsLoading(false);

    if (error) {
      console.error("Bot token update error:", error);
      toast({
        title: "Error",
        description: error || "Failed to update bot token",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Bot token updated successfully",
    });

    setIsEditDialogOpen(false);
    setSelectedToken(null);
    setFormData({ bot_name: "", bot_token: "", bot_username: "" });
    loadBotTokens();
    loadBotStats();
  };

  const handleSetupWebhook = async (botId: string) => {
    setIsLoading(true);
    
    const response = await fetch("/api/telegram/set-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId }),
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      toast({
        title: "Error",
        description: data.error || "Failed to setup webhook",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Bot webhook configured successfully! Your bot is now live.",
    });

    loadBotTokens();
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bot token?")) return;

    setIsLoading(true);
    const { error } = await botTokenService.deleteBotToken(id);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Bot token deleted",
    });

    loadBotTokens();
  };

  const handleToggleStatus = async (token: BotToken) => {
    const { error } = await botTokenService.toggleBotStatus(token.id, !token.is_active);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to toggle bot status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Bot ${!token.is_active ? "activated" : "deactivated"} successfully`,
    });

    loadBotTokens();
    loadBotStats();
  };

  const openEditDialog = (token: BotToken) => {
    setSelectedToken(token);
    setFormData({
      bot_name: token.bot_name,
      bot_token: token.bot_token,
      bot_username: token.bot_username || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (token: BotToken) => {
    setSelectedToken(token);
    setIsDeleteDialogOpen(true);
  };

  const maskToken = (token: string) => {
    if (token.length <= 10) return token;
    return token.substring(0, 10) + "..." + token.substring(token.length - 10);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ProtectedRoute>
      <SEO title="Bot Settings - Telegram Admin" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="border-0 bg-gradient-to-br from-primary via-primary to-accent shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-white">
                      {getGreeting()}, {userName}! 👋
                    </h2>
                    <p className="mt-1 text-primary-foreground/80">
                      Welcome back to your Telegram Bot Dashboard
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-primary-foreground/80">Active Bots</p>
                        <p className="text-2xl font-bold text-white">{botStats.active}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-primary-foreground/80">Total Bots</p>
                        <p className="text-2xl font-bold text-white">{botStats.total}</p>
                      </div>
                    </div>

                    {botStats.inactive > 0 && (
                      <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/80">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-primary-foreground/80">Inactive</p>
                          <p className="text-2xl font-bold text-white">{botStats.inactive}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bot Tokens Management */}
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Bot Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your Telegram bot tokens and configurations
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bot Tokens</CardTitle>
                  <CardDescription>
                    Add and manage your Telegram bot tokens from @BotFather
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {botTokens.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed p-12 text-center">
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-semibold">No bot tokens yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Get started by adding your first bot token from @BotFather
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Bot
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Status & Webhook</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {botTokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell className="font-medium">{token.bot_name}</TableCell>
                          <TableCell>
                            {token.bot_username ? `@${token.bot_username}` : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {maskToken(token.bot_token)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={token.is_active || false}
                                onCheckedChange={() => handleToggleStatus(token)}
                              />
                              {webhookStatuses[token.id]?.checking ? (
                                <Badge variant="outline" className="gap-1">
                                  <Radio className="h-3 w-3 animate-pulse" />
                                  Checking...
                                </Badge>
                              ) : webhookStatuses[token.id]?.is_set ? (
                                <Badge variant="default" className="gap-1 bg-success">
                                  <Radio className="h-3 w-3" />
                                  Webhook Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <Radio className="h-3 w-3" />
                                  Not Set
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {webhookStatuses[token.id]?.is_set ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => checkWebhookStatus(token.id)}
                                  disabled={webhookStatuses[token.id]?.checking}
                                >
                                  <Radio className="h-4 w-4 mr-1" />
                                  Check Status
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetupWebhook(token.id)}
                                  disabled={isLoading}
                                  className="text-warning border-warning hover:bg-warning/10"
                                >
                                  <Zap className="h-4 w-4 mr-1" />
                                  Setup Webhook
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedToken(token);
                                  setFormData({
                                    bot_name: token.bot_name,
                                    bot_token: token.bot_token,
                                    bot_username: token.bot_username || "",
                                  });
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteToken(token.id)}
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
            </CardContent>
          </Card>
        </div>

        {/* Add Bot Token Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bot Token</DialogTitle>
              <DialogDescription>
                Enter your Telegram bot token from @BotFather
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot_name">Bot Name *</Label>
                <Input
                  id="bot_name"
                  placeholder="My Awesome Bot"
                  value={formData.bot_name}
                  onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot_token">Bot Token *</Label>
                <Input
                  id="bot_token"
                  type="password"
                  placeholder="123456789:ABCdefGHI..."
                  value={formData.bot_token}
                  onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Get this from @BotFather on Telegram
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot_username">Bot Username</Label>
                <Input
                  id="bot_username"
                  placeholder="mybot"
                  value={formData.bot_username}
                  onChange={(e) => setFormData({ ...formData, bot_username: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddToken} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Bot Token"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bot Token Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bot Token</DialogTitle>
              <DialogDescription>
                Update your bot token details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_bot_name">Bot Name *</Label>
                <Input
                  id="edit_bot_name"
                  placeholder="My Awesome Bot"
                  value={formData.bot_name}
                  onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_bot_token">Bot Token *</Label>
                <Input
                  id="edit_bot_token"
                  type="password"
                  placeholder="123456789:ABCdefGHI..."
                  value={formData.bot_token}
                  onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_bot_username">Bot Username</Label>
                <Input
                  id="edit_bot_username"
                  placeholder="mybot"
                  value={formData.bot_username}
                  onChange={(e) => setFormData({ ...formData, bot_username: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditToken} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Bot Token"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the bot token for{" "}
                <span className="font-semibold">{selectedToken?.bot_name}</span>. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteToken(selectedToken?.id || "")}
                className="bg-destructive hover:bg-destructive/90"
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