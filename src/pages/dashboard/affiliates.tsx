import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { affiliateService, CURRENCIES, type CurrencyCode } from "@/services/affiliateService";
import type { Tables } from "@/integrations/supabase/types";
import { DollarSign, Users, TrendingUp, CreditCard, Link as LinkIcon, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AffiliatesPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsRes, affRes, payoutsRes] = await Promise.all([
      affiliateService.getAffiliateStats(),
      affiliateService.getAffiliates(),
      affiliateService.getPayouts()
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (affRes.data) setAffiliates(affRes.data);
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

  const formatAmount = (amount: number, currency: string = "USD") => {
    return affiliateService.formatCurrency(amount, currency);
  };

  const currencyOptions = affiliateService.getSupportedCurrencies();

  return (
    <ProtectedRoute>
      <SEO title="Affiliates - Dashboard" description="Manage affiliate programs and payouts" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Affiliate System</h1>
              <p className="text-muted-foreground mt-1">Track referrals, commissions, and manage payouts</p>
            </div>
            <div className="flex items-center gap-3">
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
                        <span className="text-muted-foreground text-xs">({curr.name})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="p-5 flex flex-col justify-center border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Users className="h-4 w-4" /> Total Affiliates
              </div>
              <div className="text-3xl font-bold">{stats?.total_affiliates || 0}</div>
             </Card>
             <Card className="p-5 flex flex-col justify-center border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <LinkIcon className="h-4 w-4" /> Total Referrals
              </div>
              <div className="text-3xl font-bold">{stats?.total_referrals || 0}</div>
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
              <TabsTrigger value="affiliates">Active Affiliates</TabsTrigger>
              <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="affiliates">
              <Card>
                {affiliates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No affiliates yet</h3>
                    <p className="text-muted-foreground text-sm">Users who join your affiliate program will appear here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate Name</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Total Referrals</TableHead>
                        <TableHead>Total Earnings</TableHead>
                        <TableHead>Pending Payout</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates.map(aff => (
                        <TableRow key={aff.id}>
                          <TableCell className="font-medium">{aff.profile?.full_name || 'Unknown User'}</TableCell>
                          <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{aff.referral_code}</code></TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {affiliateService.getCurrencySymbol(aff.preferred_currency || "USD")} {aff.preferred_currency || "USD"}
                            </Badge>
                          </TableCell>
                          <TableCell>{aff.total_referrals}</TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
            
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
                        <TableHead>Requested Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.affiliate?.profile?.full_name || 'Unknown'}</TableCell>
                          <TableCell className="font-bold">{formatAmount(p.amount, p.currency)}</TableCell>
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
                              p.status === 'completed' ? 'default' : 
                              p.status === 'pending' ? 'outline' : 'secondary'
                            } className={p.status === 'pending' ? 'border-warning text-warning' : p.status === 'completed' ? 'bg-success' : ''}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(p.requested_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            {p.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-8" onClick={() => handleProcessPayout(p.id, "cancelled")}>Reject</Button>
                                <Button size="sm" className="h-8 bg-success hover:bg-success/90" onClick={() => handleProcessPayout(p.id, "completed")}>Mark Paid</Button>
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
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}