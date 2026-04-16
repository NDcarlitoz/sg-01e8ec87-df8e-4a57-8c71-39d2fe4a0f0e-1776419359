import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { livegramService, type LivegramRuleInput } from "@/services/livegramService";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Radio,
  Copy,
  Forward,
  MessageSquareQuote,
  Filter,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type LivegramRule = Tables<"livegram_rules">;

export default function Livegram() {
  const { toast } = useToast();
  const [rules, setRules] = useState<LivegramRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<LivegramRule | null>(null);

  const [formData, setFormData] = useState<{
    rule_name: string;
    source_chat_id: string;
    source_chat_title: string;
    source_chat_type: string;
    destinations: string;
    forward_mode: "copy" | "forward" | "quote";
    filter_keywords: string;
    exclude_keywords: string;
    watermark_text: string;
    delay_seconds: string;
    remove_caption: boolean;
    add_watermark: boolean;
    is_active: boolean;
  }>({
    rule_name: "",
    source_chat_id: "",
    source_chat_title: "",
    source_chat_type: "group",
    destinations: "",
    forward_mode: "copy",
    filter_keywords: "",
    exclude_keywords: "",
    watermark_text: "",
    delay_seconds: "0",
    remove_caption: false,
    add_watermark: false,
    is_active: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const { data } = await livegramService.getRules();
    if (data) setRules(data);
  };

  const handleAddRule = async () => {
    if (!formData.rule_name || !formData.source_chat_id || !formData.destinations) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    // Parse destinations JSON
    let destinations;
    try {
      destinations = JSON.parse(formData.destinations);
      if (!Array.isArray(destinations)) throw new Error("Destinations must be an array");
    } catch (e) {
      toast({
        title: "Error",
        description: "Invalid destinations format. Use JSON array format.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await livegramService.createRule({
      rule_name: formData.rule_name,
      source_chat_id: parseInt(formData.source_chat_id),
      source_chat_title: formData.source_chat_title || undefined,
      source_chat_type: formData.source_chat_type,
      destinations,
      forward_mode: formData.forward_mode,
      filter_keywords: formData.filter_keywords ? formData.filter_keywords.split(",").map(k => k.trim()) : undefined,
      exclude_keywords: formData.exclude_keywords ? formData.exclude_keywords.split(",").map(k => k.trim()) : undefined,
      watermark_text: formData.watermark_text || undefined,
      delay_seconds: parseInt(formData.delay_seconds) || 0,
      remove_caption: formData.remove_caption,
      add_watermark: formData.add_watermark,
      is_active: formData.is_active,
    });
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
      description: "Livegram rule created",
    });

    setIsAddDialogOpen(false);
    resetForm();
    loadRules();
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;

    let destinations;
    try {
      destinations = JSON.parse(formData.destinations);
    } catch (e) {
      toast({
        title: "Error",
        description: "Invalid destinations format",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await livegramService.updateRule(selectedRule.id, {
      rule_name: formData.rule_name,
      source_chat_id: parseInt(formData.source_chat_id),
      source_chat_title: formData.source_chat_title || undefined,
      source_chat_type: formData.source_chat_type,
      destinations,
      forward_mode: formData.forward_mode,
      filter_keywords: formData.filter_keywords ? formData.filter_keywords.split(",").map(k => k.trim()) : undefined,
      exclude_keywords: formData.exclude_keywords ? formData.exclude_keywords.split(",").map(k => k.trim()) : undefined,
      watermark_text: formData.watermark_text || undefined,
      delay_seconds: parseInt(formData.delay_seconds) || 0,
      remove_caption: formData.remove_caption,
      add_watermark: formData.add_watermark,
      is_active: formData.is_active,
    });
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
      description: "Livegram rule updated",
    });

    setIsEditDialogOpen(false);
    setSelectedRule(null);
    resetForm();
    loadRules();
  };

  const handleToggleRule = async (id: string, currentStatus: boolean) => {
    const { error } = await livegramService.toggleRule(id, !currentStatus);
    
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
      description: `Rule ${!currentStatus ? "activated" : "deactivated"}`,
    });

    loadRules();
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    const { error } = await livegramService.deleteRule(id);
    
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
      description: "Rule deleted",
    });

    loadRules();
  };

  const resetForm = () => {
    setFormData({
      rule_name: "",
      source_chat_id: "",
      source_chat_title: "",
      source_chat_type: "group",
      destinations: "",
      forward_mode: "copy",
      filter_keywords: "",
      exclude_keywords: "",
      watermark_text: "",
      delay_seconds: "0",
      remove_caption: false,
      add_watermark: false,
      is_active: true,
    });
  };

  const openEditDialog = (rule: LivegramRule) => {
    setSelectedRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      source_chat_id: rule.source_chat_id.toString(),
      source_chat_title: rule.source_chat_title || "",
      source_chat_type: rule.source_chat_type || "group",
      destinations: JSON.stringify(rule.destinations, null, 2),
      forward_mode: (rule.forward_mode as "copy" | "forward" | "quote") || "copy",
      filter_keywords: Array.isArray(rule.filter_keywords) ? (rule.filter_keywords as string[]).join(", ") : "",
      exclude_keywords: Array.isArray(rule.exclude_keywords) ? (rule.exclude_keywords as string[]).join(", ") : "",
      watermark_text: rule.watermark_text || "",
      delay_seconds: (rule.delay_seconds || 0).toString(),
      remove_caption: rule.remove_caption || false,
      add_watermark: rule.add_watermark || false,
      is_active: rule.is_active || false,
    });
    setIsEditDialogOpen(true);
  };

  const getForwardModeIcon = (mode: string) => {
    switch (mode) {
      case "copy": return <Copy className="h-4 w-4" />;
      case "forward": return <Forward className="h-4 w-4" />;
      case "quote": return <MessageSquareQuote className="h-4 w-4" />;
      default: return <Copy className="h-4 w-4" />;
    }
  };

  return (
    <ProtectedRoute>
      <SEO title="Livegram - Auto Forward Messages" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold">Livegram</h1>
              <p className="text-muted-foreground">Auto-forward messages between groups & channels</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destinations</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No livegram rules yet. Create one to start auto-forwarding!
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.rule_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{rule.source_chat_title || `ID: ${rule.source_chat_id}`}</div>
                          <Badge variant="outline" className="mt-1">
                            {rule.source_chat_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Array.isArray(rule.destinations) ? rule.destinations.length : 0} destinations
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getForwardModeIcon(rule.forward_mode || "copy")}
                          <span className="text-sm capitalize">{rule.forward_mode}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <BarChart3 className="h-3 w-3" />
                          {rule.total_forwarded || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active || false}
                            onCheckedChange={() => handleToggleRule(rule.id, rule.is_active || false)}
                          />
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Add Rule Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Livegram Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name *</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., Forward Tech News"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source_chat_id">Source Chat ID *</Label>
                    <Input
                      id="source_chat_id"
                      value={formData.source_chat_id}
                      onChange={(e) => setFormData({ ...formData, source_chat_id: e.target.value })}
                      placeholder="-1001234567890"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get chat ID from @userinfobot
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="source_chat_title">Source Chat Title</Label>
                    <Input
                      id="source_chat_title"
                      value={formData.source_chat_title}
                      onChange={(e) => setFormData({ ...formData, source_chat_title: e.target.value })}
                      placeholder="Tech News Channel"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="destinations">Destinations (JSON) *</Label>
                  <Textarea
                    id="destinations"
                    value={formData.destinations}
                    onChange={(e) => setFormData({ ...formData, destinations: e.target.value })}
                    placeholder='[{"chat_id": -1001234567890, "chat_title": "My Channel", "chat_type": "channel"}]'
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Array of destination chats with chat_id, chat_title, and chat_type
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="forward_mode">Forward Mode</Label>
                    <select
                      id="forward_mode"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={formData.forward_mode}
                      onChange={(e) => setFormData({ ...formData, forward_mode: e.target.value as "copy" | "forward" | "quote" })}
                    >
                      <option value="copy">Copy (no "forwarded from")</option>
                      <option value="forward">Forward (show original sender)</option>
                      <option value="quote">Quote (reply style)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="delay_seconds">Delay (seconds)</Label>
                    <Input
                      id="delay_seconds"
                      type="number"
                      value={formData.delay_seconds}
                      onChange={(e) => setFormData({ ...formData, delay_seconds: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="filter_keywords">Filter Keywords (comma-separated)</Label>
                    <Input
                      id="filter_keywords"
                      value={formData.filter_keywords}
                      onChange={(e) => setFormData({ ...formData, filter_keywords: e.target.value })}
                      placeholder="bitcoin, crypto, trading"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exclude_keywords">Exclude Keywords</Label>
                    <Input
                      id="exclude_keywords"
                      value={formData.exclude_keywords}
                      onChange={(e) => setFormData({ ...formData, exclude_keywords: e.target.value })}
                      placeholder="spam, scam"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="add_watermark">Add Watermark</Label>
                    <Switch
                      id="add_watermark"
                      checked={formData.add_watermark}
                      onCheckedChange={(checked) => setFormData({ ...formData, add_watermark: checked })}
                    />
                  </div>
                  {formData.add_watermark && (
                    <Input
                      value={formData.watermark_text}
                      onChange={(e) => setFormData({ ...formData, watermark_text: e.target.value })}
                      placeholder="📢 Forwarded from Tech News"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="remove_caption">Remove Original Caption</Label>
                  <Switch
                    id="remove_caption"
                    checked={formData.remove_caption}
                    onCheckedChange={(checked) => setFormData({ ...formData, remove_caption: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRule} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Rule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Rule Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Livegram Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Same form fields as Add Dialog */}
                <div>
                  <Label htmlFor="edit_rule_name">Rule Name *</Label>
                  <Input
                    id="edit_rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_source_chat_id">Source Chat ID *</Label>
                    <Input
                      id="edit_source_chat_id"
                      value={formData.source_chat_id}
                      onChange={(e) => setFormData({ ...formData, source_chat_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_source_chat_title">Source Chat Title</Label>
                    <Input
                      id="edit_source_chat_title"
                      value={formData.source_chat_title}
                      onChange={(e) => setFormData({ ...formData, source_chat_title: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit_destinations">Destinations (JSON) *</Label>
                  <Textarea
                    id="edit_destinations"
                    value={formData.destinations}
                    onChange={(e) => setFormData({ ...formData, destinations: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_forward_mode">Forward Mode</Label>
                    <select
                      id="edit_forward_mode"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={formData.forward_mode}
                      onChange={(e) => setFormData({ ...formData, forward_mode: e.target.value as "copy" | "forward" | "quote" })}
                    >
                      <option value="copy">Copy</option>
                      <option value="forward">Forward</option>
                      <option value="quote">Quote</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit_delay_seconds">Delay (seconds)</Label>
                    <Input
                      id="edit_delay_seconds"
                      type="number"
                      value={formData.delay_seconds}
                      onChange={(e) => setFormData({ ...formData, delay_seconds: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_filter_keywords">Filter Keywords</Label>
                    <Input
                      id="edit_filter_keywords"
                      value={formData.filter_keywords}
                      onChange={(e) => setFormData({ ...formData, filter_keywords: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_exclude_keywords">Exclude Keywords</Label>
                    <Input
                      id="edit_exclude_keywords"
                      value={formData.exclude_keywords}
                      onChange={(e) => setFormData({ ...formData, exclude_keywords: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit_add_watermark">Add Watermark</Label>
                    <Switch
                      id="edit_add_watermark"
                      checked={formData.add_watermark}
                      onCheckedChange={(checked) => setFormData({ ...formData, add_watermark: checked })}
                    />
                  </div>
                  {formData.add_watermark && (
                    <Input
                      value={formData.watermark_text}
                      onChange={(e) => setFormData({ ...formData, watermark_text: e.target.value })}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="edit_remove_caption">Remove Original Caption</Label>
                  <Switch
                    id="edit_remove_caption"
                    checked={formData.remove_caption}
                    onCheckedChange={(checked) => setFormData({ ...formData, remove_caption: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="edit_is_active">Active</Label>
                  <Switch
                    id="edit_is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRule} disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Rule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}