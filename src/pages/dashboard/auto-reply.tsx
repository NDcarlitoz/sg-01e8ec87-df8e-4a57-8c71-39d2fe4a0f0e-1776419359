import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, MessageSquare, Zap } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { autoReplyService } from "@/services/autoReplyService";
import type { TelegramButton } from "@/services/telegramService";

interface ButtonEditorItem {
  id: string;
  text: string;
  type: "url" | "callback";
  action: string;
  row: number;
}

export default function AutoReplyPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<Tables<"auto_reply_rules">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Tables<"auto_reply_rules"> | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    trigger_type: "keyword",
    trigger_value: "",
    response_type: "text",
    response_message: "",
    response_caption: "",
    response_media_url: "",
    priority: 0,
    delay_seconds: 0,
  });
  const [matchCaseSensitive, setMatchCaseSensitive] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [buttonRows, setButtonRows] = useState<ButtonEditorItem[]>([]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    const { data, error } = await autoReplyService.getRules();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      setRules(data);
    }
    setIsLoading(false);
  };

  const openCreateDialog = () => {
    setSelectedRule(null);
    setFormData({
      title: "",
      trigger_type: "keyword",
      trigger_value: "",
      response_type: "text",
      response_message: "",
      response_caption: "",
      response_media_url: "",
      priority: 0,
      delay_seconds: 0,
    });
    setMatchCaseSensitive(false);
    setMatchWholeWord(false);
    setButtonRows([]);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (rule: Tables<"auto_reply_rules">) => {
    setSelectedRule(rule);
    setFormData({
      title: rule.title,
      trigger_type: rule.trigger_type,
      trigger_value: rule.trigger_value,
      response_type: rule.response_type,
      response_message: rule.response_message || "",
      response_caption: rule.response_caption || "",
      response_media_url: rule.response_media_url || "",
      priority: rule.priority || 0,
      delay_seconds: rule.delay_seconds || 0,
    });
    setMatchCaseSensitive(rule.match_case_sensitive);
    setMatchWholeWord(rule.match_whole_word);

    // Load buttons if exists
    if (rule.response_buttons) {
      const buttons = rule.response_buttons as unknown as TelegramButton[][];
      const flatButtons: ButtonEditorItem[] = [];
      buttons.forEach((row, rowIndex) => {
        row.forEach((btn) => {
          flatButtons.push({
            id: Math.random().toString(36).substr(2, 9),
            text: btn.text,
            type: btn.url ? "url" : "callback",
            action: btn.url || btn.callback_data || "",
            row: rowIndex + 1,
          });
        });
      });
      setButtonRows(flatButtons);
    } else {
      setButtonRows([]);
    }

    setIsCreateDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.trigger_value.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and trigger value",
        variant: "destructive",
      });
      return;
    }

    if (formData.response_type === "text" && !formData.response_message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const buttons = getButtonsArray();

      if (selectedRule) {
        const { error } = await autoReplyService.updateRule(selectedRule.id, {
          ...formData,
          match_case_sensitive: matchCaseSensitive,
          match_whole_word: matchWholeWord,
          response_buttons: buttons,
        });

        if (error) {
          toast({ title: "Error", description: error, variant: "destructive" });
        } else {
          toast({ title: "Success", description: "Rule updated successfully" });
          setIsCreateDialogOpen(false);
          loadRules();
        }
      } else {
        const { error } = await autoReplyService.createRule({
          ...formData,
          match_case_sensitive: matchCaseSensitive,
          match_whole_word: matchWholeWord,
          response_buttons: buttons,
        });

        if (error) {
          toast({ title: "Error", description: error, variant: "destructive" });
        } else {
          toast({ title: "Success", description: "Rule created successfully" });
          setIsCreateDialogOpen(false);
          loadRules();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save rule",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleToggle = async (rule: Tables<"auto_reply_rules">) => {
    const { error } = await autoReplyService.toggleRule(rule.id, !rule.is_active);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({
        title: "Success",
        description: rule.is_active ? "Rule disabled" : "Rule enabled",
      });
      loadRules();
    }
  };

  const handleDelete = async () => {
    if (!selectedRule) return;

    setIsLoading(true);
    const { error } = await autoReplyService.deleteRule(selectedRule.id);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Rule deleted successfully" });
      loadRules();
    }

    setIsLoading(false);
    setIsDeleteDialogOpen(false);
  };

  const getButtonsArray = (): TelegramButton[][] | undefined => {
    if (buttonRows.length === 0) return undefined;

    const rowMap = new Map<number, TelegramButton[]>();
    buttonRows.forEach((btn) => {
      if (!rowMap.has(btn.row)) {
        rowMap.set(btn.row, []);
      }
      rowMap.get(btn.row)!.push({
        text: btn.text,
        ...(btn.type === "url" ? { url: btn.action } : { callback_data: btn.action }),
      });
    });

    return Array.from(rowMap.values());
  };

  const addButton = () => {
    setButtonRows([
      ...buttonRows,
      {
        id: Math.random().toString(36).substr(2, 9),
        text: "",
        type: "url",
        action: "",
        row: 1,
      },
    ]);
  };

  const removeButton = (id: string) => {
    setButtonRows(buttonRows.filter((btn) => btn.id !== id));
  };

  const updateButton = (id: string, field: keyof ButtonEditorItem, value: any) => {
    setButtonRows(
      buttonRows.map((btn) => (btn.id === id ? { ...btn, [field]: value } : btn))
    );
  };

  const getTriggerTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      keyword: { label: "Keyword", variant: "default" },
      exact: { label: "Exact", variant: "secondary" },
      command: { label: "Command", variant: "outline" },
      regex: { label: "Regex", variant: "destructive" },
    };
    const config = variants[type] || variants.keyword;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ProtectedRoute>
      <SEO
        title="Auto-Reply Rules - Dashboard"
        description="Manage automated reply rules for your Telegram bot"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Auto-Reply Rules</h1>
              <p className="text-muted-foreground mt-1">
                Configure automated responses based on keywords and triggers
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <Zap className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rules.filter((r) => r.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rules.reduce((sum, r) => sum + (r.usage_count || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rules</CardTitle>
              <CardDescription>Manage your auto-reply rules</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rules yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first auto-reply rule to get started
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Rule
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Active</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => handleToggle(rule)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{rule.title}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {rule.trigger_type === "command" && "/"}
                            {rule.trigger_value}
                          </TableCell>
                          <TableCell>{getTriggerTypeBadge(rule.trigger_type)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.priority}</Badge>
                          </TableCell>
                          <TableCell>{rule.usage_count || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(rule)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRule(rule);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRule ? "Edit Auto-Reply Rule" : "Create Auto-Reply Rule"}
              </DialogTitle>
              <DialogDescription>
                Configure automated responses to user messages
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Rule Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Welcome Message"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trigger_type">Trigger Type *</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, trigger_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Keyword</SelectItem>
                      <SelectItem value="exact">Exact Match</SelectItem>
                      <SelectItem value="command">Command</SelectItem>
                      <SelectItem value="regex">Regex Pattern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="trigger_value">Trigger Value *</Label>
                  <Input
                    id="trigger_value"
                    placeholder={
                      formData.trigger_type === "command"
                        ? "start"
                        : formData.trigger_type === "regex"
                        ? "^hello.*"
                        : "hello"
                    }
                    value={formData.trigger_value}
                    onChange={(e) =>
                      setFormData({ ...formData, trigger_value: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="caseSensitive"
                    checked={matchCaseSensitive}
                    onCheckedChange={(checked) => setMatchCaseSensitive(!!checked)}
                  />
                  <Label htmlFor="caseSensitive" className="font-normal cursor-pointer">
                    Case sensitive matching
                  </Label>
                </div>
                {formData.trigger_type === "keyword" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wholeWord"
                      checked={matchWholeWord}
                      onCheckedChange={(checked) => setMatchWholeWord(!!checked)}
                    />
                    <Label htmlFor="wholeWord" className="font-normal cursor-pointer">
                      Match whole word only
                    </Label>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="response_type">Response Type *</Label>
                <Select
                  value={formData.response_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, response_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.response_type === "text" ? (
                <div>
                  <Label htmlFor="response_message">Response Message *</Label>
                  <Textarea
                    id="response_message"
                    placeholder="Enter your auto-reply message..."
                    rows={4}
                    value={formData.response_message}
                    onChange={(e) =>
                      setFormData({ ...formData, response_message: e.target.value })
                    }
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="media_url">Media URL *</Label>
                    <Input
                      id="media_url"
                      placeholder="https://..."
                      value={formData.response_media_url}
                      onChange={(e) =>
                        setFormData({ ...formData, response_media_url: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="caption">Caption (Optional)</Label>
                    <Textarea
                      id="caption"
                      placeholder="Enter caption..."
                      rows={3}
                      value={formData.response_caption}
                      onChange={(e) =>
                        setFormData({ ...formData, response_caption: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {/* Buttons Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Inline Buttons (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addButton}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Button
                  </Button>
                </div>

                {buttonRows.length > 0 && (
                  <div className="space-y-2 p-3 border rounded-md">
                    {buttonRows.map((btn) => (
                      <div key={btn.id} className="flex items-center gap-2">
                        <Input
                          placeholder="Button text"
                          value={btn.text}
                          onChange={(e) => updateButton(btn.id, "text", e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={btn.type}
                          onValueChange={(value) =>
                            updateButton(btn.id, "type", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="callback">Callback</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder={btn.type === "url" ? "https://..." : "callback_data"}
                          value={btn.action}
                          onChange={(e) => updateButton(btn.id, "action", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          placeholder="Row"
                          value={btn.row}
                          onChange={(e) =>
                            updateButton(btn.id, "row", parseInt(e.target.value) || 1)
                          }
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeButton(btn.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority (0-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={0}
                    max={10}
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher priority rules are checked first
                  </p>
                </div>

                <div>
                  <Label htmlFor="delay">Delay (seconds)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min={0}
                    max={60}
                    value={formData.delay_seconds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delay_seconds: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Wait before sending reply
                  </p>
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
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Saving..." : selectedRule ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the auto-reply rule. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}