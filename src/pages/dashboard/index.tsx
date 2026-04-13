import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotPreview } from "@/components/bot/BotPreview";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Power, PowerOff, Check } from "lucide-react";
import { botTokenService } from "@/services/botTokenService";
import type { BotToken } from "@/services/botTokenService";
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
import { Badge } from "@/components/ui/badge";

interface MenuButton {
  id: string;
  text: string;
  url: string;
}

export default function BotSettingsPage() {
  const { toast } = useToast();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [menuButtons, setMenuButtons] = useState<MenuButton[]>([]);
  const [newButtonText, setNewButtonText] = useState("");
  const [newButtonUrl, setNewButtonUrl] = useState("");

  // Bot Token Management States
  const [botTokens, setBotTokens] = useState<BotToken[]>([]);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<BotToken | null>(null);
  const [tokenForm, setTokenForm] = useState({
    bot_name: "",
    bot_token: "",
    bot_username: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load bot tokens on mount
  useEffect(() => {
    loadBotTokens();
  }, []);

  const loadBotTokens = async () => {
    const { data, error } = await botTokenService.getBotTokens();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load bot tokens",
        variant: "destructive",
      });
    } else {
      setBotTokens(data);
    }
  };

  const handleAddButton = () => {
    if (!newButtonText || !newButtonUrl) {
      toast({
        title: "Error",
        description: "Sila isi text dan URL untuk button",
        variant: "destructive",
      });
      return;
    }

    if (menuButtons.length >= 6) {
      toast({
        title: "Error",
        description: "Maximum 6 buttons sahaja dibenarkan",
        variant: "destructive",
      });
      return;
    }

    const newButton: MenuButton = {
      id: Date.now().toString(),
      text: newButtonText,
      url: newButtonUrl,
    };

    setMenuButtons([...menuButtons, newButton]);
    setNewButtonText("");
    setNewButtonUrl("");

    toast({
      title: "Success",
      description: "Button berjaya ditambah",
    });
  };

  const handleRemoveButton = (id: string) => {
    setMenuButtons(menuButtons.filter((btn) => btn.id !== id));
    toast({
      title: "Success",
      description: "Button berjaya dibuang",
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "Success",
      description: "Bot settings berjaya disimpan",
    });
  };

  const handleResetSettings = () => {
    setWelcomeMessage("");
    setMenuButtons([]);
    toast({
      title: "Success",
      description: "Settings telah di-reset",
    });
  };

  // Bot Token Handlers
  const handleOpenTokenDialog = (token?: BotToken) => {
    if (token) {
      setSelectedToken(token);
      setTokenForm({
        bot_name: token.bot_name,
        bot_token: token.bot_token,
        bot_username: token.bot_username || "",
      });
    } else {
      setSelectedToken(null);
      setTokenForm({
        bot_name: "",
        bot_token: "",
        bot_username: "",
      });
    }
    setIsTokenDialogOpen(true);
  };

  const handleCloseTokenDialog = () => {
    setIsTokenDialogOpen(false);
    setSelectedToken(null);
    setTokenForm({
      bot_name: "",
      bot_token: "",
      bot_username: "",
    });
  };

  const handleSaveToken = async () => {
    // Validate
    if (!tokenForm.bot_name || !tokenForm.bot_token) {
      toast({
        title: "Error",
        description: "Bot name dan token diperlukan",
        variant: "destructive",
      });
      return;
    }

    if (!botTokenService.validateBotToken(tokenForm.bot_token)) {
      toast({
        title: "Error",
        description: "Format token tidak sah. Format: 123456789:ABCdef...",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (selectedToken) {
      // Update
      const { error } = await botTokenService.updateBotToken(selectedToken.id, tokenForm);
      if (error) {
        toast({
          title: "Error",
          description: "Gagal update bot token",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Bot token berjaya dikemaskini",
        });
        loadBotTokens();
        handleCloseTokenDialog();
      }
    } else {
      // Create
      const { error } = await botTokenService.createBotToken(tokenForm);
      if (error) {
        toast({
          title: "Error",
          description: "Gagal tambah bot token",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Bot token berjaya ditambah",
        });
        loadBotTokens();
        handleCloseTokenDialog();
      }
    }

    setIsLoading(false);
  };

  const handleDeleteToken = async () => {
    if (!selectedToken) return;

    setIsLoading(true);
    const { error } = await botTokenService.deleteBotToken(selectedToken.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal delete bot token",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Bot token berjaya dihapuskan",
      });
      loadBotTokens();
    }

    setIsLoading(false);
    setIsDeleteDialogOpen(false);
    setSelectedToken(null);
  };

  const handleToggleStatus = async (token: BotToken) => {
    const { error } = await botTokenService.toggleBotStatus(token.id, !token.is_active);
    if (error) {
      toast({
        title: "Error",
        description: "Gagal toggle status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Bot ${!token.is_active ? "activated" : "deactivated"}`,
      });
      loadBotTokens();
    }
  };

  return (
    <ProtectedRoute>
      <SEO title="Bot Settings - Telegram Bot Admin" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold">Bot Settings</h1>
            <p className="mt-2 text-muted-foreground">
              Configure telegram bot settings dan manage bot tokens
            </p>
          </div>

          <Tabs defaultValue="tokens" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tokens">Bot Tokens</TabsTrigger>
              <TabsTrigger value="welcome">Welcome Message</TabsTrigger>
              <TabsTrigger value="menu">Menu Buttons</TabsTrigger>
            </TabsList>

            {/* Bot Tokens Tab */}
            <TabsContent value="tokens" className="space-y-6">
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-semibold">Bot Tokens</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your Telegram bot tokens
                    </p>
                  </div>
                  <Button onClick={() => handleOpenTokenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bot Token
                  </Button>
                </div>

                {botTokens.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">
                      Tiada bot token lagi. Klik "Add Bot Token" untuk mula.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {botTokens.map((token) => (
                      <Card key={token.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{token.bot_name}</h4>
                              <Badge variant={token.is_active ? "default" : "secondary"}>
                                {token.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            {token.bot_username && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                @{token.bot_username}
                              </p>
                            )}
                            <p className="mt-2 font-mono text-xs text-muted-foreground">
                              {token.bot_token.substring(0, 20)}...
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={token.is_active ? "outline" : "default"}
                              onClick={() => handleToggleStatus(token)}
                            >
                              {token.is_active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenTokenDialog(token)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setSelectedToken(token);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Welcome Message Tab */}
            <TabsContent value="welcome" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <h3 className="mb-4 font-heading text-lg font-semibold">
                    Welcome Message Editor
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="welcome">Welcome Message</Label>
                      <Textarea
                        id="welcome"
                        placeholder="Masukkan mesej welcome untuk bot..."
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        rows={8}
                        className="mt-2"
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Mesej ini akan dihantar apabila user mula chat dengan bot
                      </p>
                    </div>
                  </div>
                </Card>

                <BotPreview welcomeMessage={welcomeMessage} menuButtons={menuButtons} />
              </div>
            </TabsContent>

            {/* Menu Buttons Tab */}
            <TabsContent value="menu" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <h3 className="mb-4 font-heading text-lg font-semibold">Menu Buttons</h3>
                  <div className="space-y-4">
                    <div className="space-y-4 rounded-lg border p-4">
                      <div>
                        <Label htmlFor="btn-text">Button Text</Label>
                        <Input
                          id="btn-text"
                          placeholder="Contoh: Menu Utama"
                          value={newButtonText}
                          onChange={(e) => setNewButtonText(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="btn-url">Button URL</Label>
                        <Input
                          id="btn-url"
                          placeholder="https://example.com"
                          value={newButtonUrl}
                          onChange={(e) => setNewButtonUrl(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <Button onClick={handleAddButton} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Button
                      </Button>
                    </div>

                    {menuButtons.length > 0 && (
                      <div className="space-y-2">
                        <Label>Current Buttons ({menuButtons.length}/6)</Label>
                        <div className="space-y-2">
                          {menuButtons.map((btn) => (
                            <div
                              key={btn.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{btn.text}</p>
                                <p className="text-xs text-muted-foreground">{btn.url}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveButton(btn.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <BotPreview welcomeMessage={welcomeMessage} menuButtons={menuButtons} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleResetSettings}>
              Reset
            </Button>
            <Button onClick={handleSaveSettings}>
              <Check className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </DashboardLayout>

      {/* Add/Edit Token Dialog */}
      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedToken ? "Edit Bot Token" : "Add Bot Token"}
            </DialogTitle>
            <DialogDescription>
              Masukkan details Telegram bot anda. Token boleh didapatkan dari @BotFather.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bot_name">Bot Name *</Label>
              <Input
                id="bot_name"
                placeholder="My Awesome Bot"
                value={tokenForm.bot_name}
                onChange={(e) =>
                  setTokenForm({ ...tokenForm, bot_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="bot_token">Bot Token *</Label>
              <Input
                id="bot_token"
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={tokenForm.bot_token}
                onChange={(e) =>
                  setTokenForm({ ...tokenForm, bot_token: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Format: bot_id:auth_token
              </p>
            </div>
            <div>
              <Label htmlFor="bot_username">Bot Username (optional)</Label>
              <Input
                id="bot_username"
                placeholder="myawesomebot"
                value={tokenForm.bot_username}
                onChange={(e) =>
                  setTokenForm({ ...tokenForm, bot_username: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseTokenDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveToken} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bot Token?</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti mahu delete bot token "{selectedToken?.bot_name}"? Tindakan
              ini tidak boleh di-undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteToken}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}