import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  DialogTrigger,
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
import { affiliateService } from "@/services/affiliateService";
import type { Tables } from "@/integrations/supabase/types";
import { Settings, Plus, Trash2, Save, DollarSign, Percent, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AffiliateSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState<Tables<"affiliate_system_settings"> | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    enabled: false,
    auto_approve_referrals: false,
    auto_approve_payouts: false,
    minimum_payout_amount: 50,
    default_currency: "USD",
    terms_and_conditions: "",
  });

  // Programs
  const [programs, setPrograms] = useState<Tables<"affiliate_programs">[]>([]);
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Tables<"affiliate_programs"> | null>(null);
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    commission_type: "percentage" as "percentage" | "fixed",
    commission_value: 10,
    currency: "USD",
    is_active: true,
  });
  const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [settingsRes, programsRes] = await Promise.all([
      affiliateService.getSystemSettings(),
      affiliateService.getPrograms(),
    ]);

    if (settingsRes.data) {
      setSystemSettings(settingsRes.data);
      setSettingsForm({
        enabled: settingsRes.data.enabled,
        auto_approve_referrals: settingsRes.data.auto_approve_referrals,
        auto_approve_payouts: settingsRes.data.auto_approve_payouts,
        minimum_payout_amount: settingsRes.data.minimum_payout_amount || 50,
        default_currency: settingsRes.data.default_currency || "USD",
        terms_and_conditions: settingsRes.data.terms_and_conditions || "",
      });
    }

    if (programsRes.data) {
      setPrograms(programsRes.data);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    const { error } = await affiliateService.updateSystemSettings(settingsForm);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Affiliate system settings saved successfully",
      });
      loadData();
    }
    setIsLoading(false);
  };

  const handleCreateProgram = async () => {
    setIsLoading(true);
    const { error } = await affiliateService.createProgram(programForm);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Affiliate program created successfully",
      });
      setShowProgramDialog(false);
      resetProgramForm();
      loadData();
    }
    setIsLoading(false);
  };

  const handleUpdateProgram = async () => {
    if (!editingProgram) return;

    setIsLoading(true);
    const { error } = await affiliateService.updateProgram(editingProgram.id, programForm);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Program updated successfully",
      });
      setShowProgramDialog(false);
      setEditingProgram(null);
      resetProgramForm();
      loadData();
    }
    setIsLoading(false);
  };

  const handleDeleteProgram = async () => {
    if (!deleteProgramId) return;

    setIsLoading(true);
    const { error } = await affiliateService.deleteProgram(deleteProgramId);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
      setDeleteProgramId(null);
      loadData();
    }
    setIsLoading(false);
  };

  const openEditDialog = (program: Tables<"affiliate_programs">) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name,
      description: program.description || "",
      commission_type: program.commission_type as "percentage" | "fixed",
      commission_value: program.commission_value || 0,
      currency: program.currency,
      is_active: program.is_active,
    });
    setShowProgramDialog(true);
  };

  const resetProgramForm = () => {
    setProgramForm({
      name: "",
      description: "",
      commission_type: "percentage",
      commission_value: 10,
      currency: "USD",
      is_active: true,
    });
    setEditingProgram(null);
  };

  const currencyOptions = affiliateService.getSupportedCurrencies();

  return (
    <ProtectedRoute>
      <SEO title="Affiliate Settings - Dashboard" description="Configure affiliate system" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Affiliate System Settings</h1>
              <p className="text-muted-foreground mt-1">Configure programs and system preferences</p>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="programs">Affiliate Programs</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="font-heading text-xl font-semibold">System Configuration</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enable and configure the affiliate system
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Enable/Disable */}
                  <div className="flex items-start justify-between space-x-4 rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold">Enable Affiliate System</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Turn on affiliate tracking, commissions, and payouts
                      </p>
                    </div>
                    <Switch
                      checked={settingsForm.enabled}
                      onCheckedChange={(checked) =>
                        setSettingsForm({ ...settingsForm, enabled: checked })
                      }
                    />
                  </div>

                  {settingsForm.enabled && (
                    <>
                      {/* Auto-approve Settings */}
                      <div className="rounded-lg border p-4 space-y-4">
                        <h3 className="font-semibold">Automation Settings</h3>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Auto-approve Referrals</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Automatically confirm referrals and create commissions
                            </p>
                          </div>
                          <Switch
                            checked={settingsForm.auto_approve_referrals}
                            onCheckedChange={(checked) =>
                              setSettingsForm({ ...settingsForm, auto_approve_referrals: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Auto-approve Payouts</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Automatically approve payout requests (not recommended)
                            </p>
                          </div>
                          <Switch
                            checked={settingsForm.auto_approve_payouts}
                            onCheckedChange={(checked) =>
                              setSettingsForm({ ...settingsForm, auto_approve_payouts: checked })
                            }
                          />
                        </div>
                      </div>

                      {/* Payout Settings */}
                      <div className="rounded-lg border p-4 space-y-4">
                        <h3 className="font-semibold">Payout Settings</h3>
                        
                        <div>
                          <Label className="text-sm">Minimum Payout Amount</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Minimum amount affiliates must reach to request payout
                          </p>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={settingsForm.minimum_payout_amount}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                minimum_payout_amount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-32"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Default Currency</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Default currency for new affiliate programs
                          </p>
                          <Select
                            value={settingsForm.default_currency}
                            onValueChange={(value) =>
                              setSettingsForm({ ...settingsForm, default_currency: value })
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencyOptions.map((curr) => (
                                <SelectItem key={curr.code} value={curr.code}>
                                  {curr.symbol} {curr.code} - {curr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Terms & Conditions */}
                      <div className="rounded-lg border p-4">
                        <Label className="text-sm font-medium">Terms & Conditions</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Affiliate program terms shown to new affiliates
                        </p>
                        <Textarea
                          value={settingsForm.terms_and_conditions}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              terms_and_conditions: e.target.value,
                            })
                          }
                          rows={6}
                          placeholder="Enter terms and conditions..."
                        />
                      </div>
                    </>
                  )}

                  <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-xl font-semibold">Affiliate Programs</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create and manage commission structures
                    </p>
                  </div>
                  <Dialog open={showProgramDialog} onOpenChange={setShowProgramDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={resetProgramForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Program
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingProgram ? "Edit Program" : "Create Affiliate Program"}
                        </DialogTitle>
                        <DialogDescription>
                          Set up commission structure and program details
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Program Name</Label>
                          <Input
                            value={programForm.name}
                            onChange={(e) =>
                              setProgramForm({ ...programForm, name: e.target.value })
                            }
                            placeholder="e.g., Standard Affiliate Program"
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={programForm.description}
                            onChange={(e) =>
                              setProgramForm({ ...programForm, description: e.target.value })
                            }
                            placeholder="Program description..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Commission Type</Label>
                          <Select
                            value={programForm.commission_type}
                            onValueChange={(value: "percentage" | "fixed") =>
                              setProgramForm({ ...programForm, commission_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Commission Value</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={programForm.commission_value}
                              onChange={(e) =>
                                setProgramForm({
                                  ...programForm,
                                  commission_value: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {programForm.commission_type === "percentage" ? "%" : programForm.currency}
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label>Currency</Label>
                          <Select
                            value={programForm.currency}
                            onValueChange={(value) =>
                              setProgramForm({ ...programForm, currency: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencyOptions.map((curr) => (
                                <SelectItem key={curr.code} value={curr.code}>
                                  {curr.symbol} {curr.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Active</Label>
                          <Switch
                            checked={programForm.is_active}
                            onCheckedChange={(checked) =>
                              setProgramForm({ ...programForm, is_active: checked })
                            }
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowProgramDialog(false);
                            resetProgramForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={editingProgram ? handleUpdateProgram : handleCreateProgram}
                          disabled={isLoading || !programForm.name}
                        >
                          {isLoading
                            ? "Saving..."
                            : editingProgram
                            ? "Update Program"
                            : "Create Program"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {programs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No programs yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Create your first affiliate program to get started
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program Name</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{program.name}</div>
                              {program.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {program.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {program.commission_type === "percentage" ? (
                                <Percent className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-semibold">
                                {program.commission_value}
                                {program.commission_type === "percentage" ? "%" : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {affiliateService.getCurrencySymbol(program.currency)}{" "}
                              {program.currency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={program.is_active ? "default" : "secondary"}>
                              {program.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(program)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteProgramId(program.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteProgramId} onOpenChange={() => setDeleteProgramId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Program</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this affiliate program? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProgram}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}