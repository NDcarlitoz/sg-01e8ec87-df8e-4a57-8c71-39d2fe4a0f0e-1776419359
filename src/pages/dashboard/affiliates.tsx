import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { affiliateService, type CurrencyCode } from "@/services/affiliateService";
import type { Tables } from "@/integrations/supabase/types";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Link as LinkIcon, 
  Globe,
  Award,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
  Download,
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function AffiliatesPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsRes, affRes, refRes, commRes, payoutsRes] = await Promise.all([
      affiliateService.getAffiliateStats(),
      affiliateService.getAffiliates(),
      affiliateService.getReferrals(""),
      affiliateService.getCommissions(),
      affiliateService.getPayouts()
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (affRes.data) setAffiliates(affRes.data);
    if (refRes.data) setReferrals(refRes.data);
    if (commRes.data) setCommissions(commRes.data);
    if (payoutsRes.data) setPayouts(payoutsRes.data);
  };

  const handleProcessPayout = async (payoutId: string, status: "completed" | "cancelled") => {
    const { error } = await affiliateService.processPayout(payoutId, status);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Payout marked as ${status}` });
      loadData();
    }
  };

  const handleApproveReferral = async (referralId: string, programId: string) => {
    const { error } = await affiliateService.confirmReferral(referralId, programId);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Referral approved and commission created" });
      loadData();
    }
  };

  const handleCopyLink = (code: string) => {
    const link = `https://t.me/yourbot?start=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
  };

  const formatAmount = (amount: number, currency: string = "USD") => {
    return affiliateService.formatCurrency(amount, currency);
  };

  const currencyOptions = affiliateService.getSupportedCurrencies();

  const filteredAffiliates = affiliates.filter(aff => {
    const matchesSearch = !searchQuery || 
      aff.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aff.referral_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && aff.is_active) ||
      (filterStatus === "inactive" && !aff.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const topPerformers = [...affiliates]
    .sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0))
    .slice(0, 5);

  const exportToCSV = () => {
    const headers = ["Name", "Code", "Currency", "Referrals", "Earnings", "Pending", "Status"];
    const rows = affiliates.map(aff => [
      aff.profile?.full_name || "Unknown",
      aff.referral_code,
      aff.preferred_currency || "USD",
      aff.total_referrals || 0,
      aff.total_earnings || 0,
      aff.pending_payout || 0,
      aff.is_active ? "Active" : "Inactive"
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliates-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <ProtectedRoute>
      <SEO title="Affiliates - Dashboard" description="Manage affiliate programs and payouts" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Affiliate System</h1>
              <p className="text-muted-foreground mt-1">Track partners, referrals, commissions, and manage payouts</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Globe className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{curr.symbol}</span>
                        <span>{curr.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Users className="h-4 w-4" /> Total Affiliates
              </div>
              <div className="text-3xl font-bold">{stats?.total_affiliates || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Active partners</div>
            </Card>
            
            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <LinkIcon className="h-4 w-4" /> Total Referrals
              </div>
              <div className="text-3xl font-bold">{stats?.total_referrals || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">All time referrals</div>
            </Card>
            
            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-success">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" /> Total Commissions
              </div>
              <div className="text-3xl font-bold">{formatAmount(stats?.total_commissions || 0, selectedCurrency)}</div>
              <div className="text-xs text-muted-foreground mt-1">in {selectedCurrency}</div>
            </Card>
            
            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-warning">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <CreditCard className="h-4 w-4" /> Pending Payouts
              </div>
              <div className="text-3xl font-bold text-warning">{formatAmount(stats?.pending_payouts || 0, selectedCurrency)}</div>
              <div className="text-xs text-muted-foreground mt-1">in {selectedCurrency}</div>
            </Card>
          </div>

          <Tabs defaultValue="affiliates" className="space-y-6">
            <TabsList>
              <TabsTrigger value="affiliates">Partners ({affiliates.length})</TabsTrigger>
              <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
              <TabsTrigger value="commissions">Commissions ({commissions.length})</TabsTrigger>
              <TabsTrigger value="payouts">Payouts ({payouts.filter(p => p.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            
            {/* Affiliates Tab */}
            <TabsContent value="affiliates" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                {filteredAffiliates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No affiliates yet</h3>
                    <p className="text-muted-foreground text-sm">Users who join your affiliate program will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Referrals</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAffiliates.map(aff => (
                        <TableRow key={aff.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{aff.profile?.full_name || "Unknown User"}</div>
                              <div className="text-xs text-muted-foreground">{aff.profile?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-xs">{aff.referral_code}</code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopyLink(aff.referral_code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {affiliateService.getCurrencySymbol(aff.preferred_currency || "USD")} {aff.preferred_currency || "USD"}
                            </Badge>
                          </TableCell>
                          <TableCell>{aff.total_referrals || 0}</TableCell>
                          <TableCell className="text-success font-semibold">
                            {formatAmount(aff.total_earnings || 0, aff.preferred_currency || "USD")}
                          </TableCell>
                          <TableCell className="text-warning">
                            {formatAmount(aff.pending_payout || 0, aff.preferred_currency || "USD")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={aff.is_active ? "default" : "secondary"}>
                              {aff.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAffiliate(aff);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals">
              <Card>
                {referrals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <LinkIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No referrals yet</h3>
                    <p className="text-muted-foreground text-sm">Referrals from affiliates will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referred User</TableHead>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map(ref => (
                        <TableRow key={ref.id}>
                          <TableCell className="font-medium">
                            {ref.referred_username || `User ${ref.referred_user_id}`}
                          </TableCell>
                          <TableCell>{ref.affiliate?.profile?.full_name || "Unknown"}</TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-xs">{ref.referral_code}</code>
                          </TableCell>
                          <TableCell className="capitalize">{ref.source || "telegram"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              ref.status === "confirmed" ? "default" : 
                              ref.status === "pending" ? "outline" : "secondary"
                            }>
                              {ref.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {ref.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveReferral(ref.id, ref.affiliate?.program_id || "")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            {/* Commissions Tab */}
            <TabsContent value="commissions">
              <Card>
                {commissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No commissions yet</h3>
                    <p className="text-muted-foreground text-sm">Commission records will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map(comm => (
                        <TableRow key={comm.id}>
                          <TableCell className="font-medium">
                            {comm.affiliate?.profile?.full_name || "Unknown"}
                          </TableCell>
                          <TableCell className="font-bold text-success">
                            {formatAmount(comm.amount, comm.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {affiliateService.getCurrencySymbol(comm.currency)} {comm.currency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {comm.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant={comm.status === "approved" ? "default" : "outline"}>
                              {comm.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(comm.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            {/* Payouts Tab */}
            <TabsContent value="payouts">
              <Card>
                {payouts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No payout requests</h3>
                    <p className="text-muted-foreground text-sm">When affiliates request withdrawals, they will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.affiliate?.profile?.full_name || "Unknown"}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatAmount(p.amount, p.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {affiliateService.getCurrencySymbol(p.currency)} {p.currency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="capitalize">{p.payment_method}</div>
                            {p.payment_details && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {JSON.stringify(p.payment_details)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              p.status === "completed" ? "default" : 
                              p.status === "pending" ? "outline" : "secondary"
                            } className={
                              p.status === "pending" ? "border-warning text-warning" : 
                              p.status === "completed" ? "bg-success" : ""
                            }>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(p.requested_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8"
                                  onClick={() => handleProcessPayout(p.id, "cancelled")}
                                >
                                  Reject
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="h-8 bg-success hover:bg-success/90"
                                  onClick={() => handleProcessPayout(p.id, "completed")}
                                >
                                  Mark Paid
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5 text-warning" />
                  <h3 className="font-heading text-xl font-bold">Top Performers</h3>
                </div>
                
                {topPerformers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Award className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No data yet</h3>
                    <p className="text-muted-foreground text-sm">Leaderboard will appear when affiliates start earning.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topPerformers.map((aff, index) => (
                      <div key={aff.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                          index === 0 ? "bg-warning text-white" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-amber-600 text-white" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-semibold">{aff.profile?.full_name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">
                            {aff.total_referrals || 0} referrals • {formatAmount(aff.total_earnings || 0, aff.preferred_currency || "USD")}
                          </div>
                          <Progress 
                            value={(aff.total_earnings / topPerformers[0].total_earnings) * 100} 
                            className="h-2 mt-2"
                          />
                        </div>
                        
                        <Badge variant={aff.is_active ? "default" : "secondary"}>
                          {aff.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Affiliate Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAffiliate?.profile?.full_name || "Affiliate Details"}</DialogTitle>
              <DialogDescription>Complete affiliate information and performance</DialogDescription>
            </DialogHeader>
            
            {selectedAffiliate && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Referrals</div>
                    <div className="text-2xl font-bold">{selectedAffiliate.total_referrals || 0}</div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Earnings</div>
                    <div className="text-2xl font-bold text-success">
                      {formatAmount(selectedAffiliate.total_earnings || 0, selectedAffiliate.preferred_currency || "USD")}
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Pending Payout</div>
                    <div className="text-2xl font-bold text-warning">
                      {formatAmount(selectedAffiliate.pending_payout || 0, selectedAffiliate.preferred_currency || "USD")}
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Lifetime Payouts</div>
                    <div className="text-2xl font-bold">
                      {formatAmount(selectedAffiliate.lifetime_payouts || 0, selectedAffiliate.preferred_currency || "USD")}
                    </div>
                  </Card>
                </div>

                <div>
                  <Label>Referral Link</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      value={`https://t.me/yourbot?start=${selectedAffiliate.referral_code}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(selectedAffiliate.referral_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Contact Information</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24">Email:</span>
                      <span className="font-medium">{selectedAffiliate.profile?.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24">Currency:</span>
                      <Badge variant="outline" className="font-mono">
                        {affiliateService.getCurrencySymbol(selectedAffiliate.preferred_currency || "USD")} {selectedAffiliate.preferred_currency || "USD"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24">Status:</span>
                      <Badge variant={selectedAffiliate.is_active ? "default" : "secondary"}>
                        {selectedAffiliate.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24">Joined:</span>
                      <span>{new Date(selectedAffiliate.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}