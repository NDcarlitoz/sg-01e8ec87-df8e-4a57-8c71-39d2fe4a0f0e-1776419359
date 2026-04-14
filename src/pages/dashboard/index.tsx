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
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { botTokenService } from "@/services/botTokenService";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type BotToken = Tables<"bot_tokens">;

export default function BotSettings() {
  const [botTokens, setBotTokens] = useState<BotToken[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<BotToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    bot_name: "",
    bot_token: "",
    bot_username: "",
  });

  const { toast } = useToast();

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
      return;
    }
    setBotTokens(data || []);
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
      toast({
        title: "Error",
        description: "Failed to add bot token",
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
      toast({
        title: "Error",
        description: "Failed to update bot token",
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
  };

  const handleDeleteToken = async () => {
    if (!selectedToken) return;

    setIsLoading(true);
    const { error } = await botTokenService.deleteBotToken(selectedToken.id);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete bot token",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Bot token deleted successfully",
    });

    setIsDeleteDialogOpen(false);
    setSelectedToken(null);
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

  return (
    <ProtectedRoute>
      <SEO title="Bot Settings - Telegram Admin" />
      <DashboardLayout>
        <div className="space-y-6">
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
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bot Token
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {botTokens.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed p-12 text-center">
                  <p className="text-muted-foreground">
                    No bot tokens configured yet. Add your first bot token to get started.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Status</TableHead>
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
                                checked={token.is_active}
                                onCheckedChange={() => handleToggleStatus(token)}
                              />
                              <Badge variant={token.is_active ? "default" : "secondary"}>
                                {token.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(token)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(token)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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
                onClick={handleDeleteToken}
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