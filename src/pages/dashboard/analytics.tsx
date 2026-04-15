import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { affiliateService } from "@/services/affiliateService";
import {
  BarChart3,
  Users,
  TrendingUp,
  Send,
  DollarSign,
  Hash,
  MessageSquare,
  Activity,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [isLoading, setIsLoading] = useState(false);
  const [affiliateEnabled, setAffiliateEnabled] = useState(false);

  // Platform Overview Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalChannels: 0,
    totalBroadcasts: 0,
    totalLeads: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    broadcastsSent: 0,
  });

  // Growth Data
  const [growthData, setGrowthData] = useState<any[]>([]);

  // Affiliate Stats (if enabled)
  const [affiliateStats, setAffiliateStats] = useState<any>(null);

  // Broadcast Performance
  const [broadcastStats, setBroadcastStats] = useState<any[]>([]);

  // Top Groups
  const [topGroups, setTopGroups] = useState<any[]>([]);

  useEffect(() => {
    checkAffiliateStatus();
    loadAllAnalytics();
  }, [timeRange]);

  const checkAffiliateStatus = async () => {
    const enabled = await affiliateService.isEnabled();
    setAffiliateEnabled(enabled);
  };

  const loadAllAnalytics = async () => {
    setIsLoading(true);
    await Promise.all([
      loadPlatformStats(),
      loadGrowthData(),
      loadBroadcastStats(),
      loadTopGroups(),
      affiliateEnabled && loadAffiliateStats(),
    ]);
    setIsLoading(false);
  };

  const loadPlatformStats = async () => {
    const [usersRes, groupsRes, channelsRes, broadcastsRes, leadsRes] = await Promise.all([
      supabase.from("bot_users").select("*", { count: "exact", head: true }),
      supabase.from("bot_groups").select("*", { count: "exact", head: true }),
      supabase.from("channels").select("*", { count: "exact", head: true }),
      supabase.from("broadcasts").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }),
    ]);

    // Get active users (users who interacted in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: activeCount } = await supabase
      .from("bot_users")
      .select("*", { count: "exact", head: true })
      .gte("last_interaction", thirtyDaysAgo.toISOString());

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newUsersCount } = await supabase
      .from("bot_users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    // Get broadcasts sent this month
    const { count: broadcastsCount } = await supabase
      .from("broadcasts")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", startOfMonth.toISOString());

    setStats({
      totalUsers: usersRes.count || 0,
      totalGroups: groupsRes.count || 0,
      totalChannels: channelsRes.count || 0,
      totalBroadcasts: broadcastsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      activeUsers: activeCount || 0,
      newUsersThisMonth: newUsersCount || 0,
      broadcastsSent: broadcastsCount || 0,
    });
  };

  const loadGrowthData = async () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from("bot_users")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Group by date
    const grouped = (data || []).reduce((acc: any, user) => {
      const date = new Date(user.created_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(grouped).map(([date, count]) => ({
      date,
      users: count,
    }));

    setGrowthData(chartData);
  };

  const loadBroadcastStats = async () => {
    const { data } = await supabase
      .from("broadcasts")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    setBroadcastStats(data || []);
  };

  const loadTopGroups = async () => {
    const { data } = await supabase
      .from("bot_groups")
      .select("*")
      .order("member_count", { ascending: false })
      .limit(5);

    setTopGroups(data || []);
  };

  const loadAffiliateStats = async () => {
    const { data } = await affiliateService.getAffiliateStats();
    setAffiliateStats(data);
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Analytics report will be downloaded shortly",
    });
    // Implement CSV/PDF export
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return (
    <ProtectedRoute>
      <SEO title="Analytics - Dashboard" description="Platform analytics and insights" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Track performance, growth, and engagement metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.totalUsers.toLocaleString()}</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium">
                      +{stats.newUsersThisMonth} this month
                    </span>
                  </div>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Groups</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.totalGroups.toLocaleString()}</h3>
                  <p className="text-sm text-muted-foreground mt-2">Connected groups</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Broadcasts Sent</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.broadcastsSent.toLocaleString()}</h3>
                  <p className="text-sm text-muted-foreground mt-2">This month</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.totalLeads.toLocaleString()}</h3>
                  <p className="text-sm text-muted-foreground mt-2">All sources</p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                  <MessageSquare className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
              {affiliateEnabled && <TabsTrigger value="affiliates">Affiliates</TabsTrigger>}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Growth Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-xl font-semibold">User Growth</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Daily user registrations over time
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>

                {growthData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No growth data yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Data will appear as users join
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Simple bar chart visualization */}
                    <div className="h-64 flex items-end justify-between gap-2">
                      {growthData.slice(-30).map((item, idx) => {
                        const maxUsers = Math.max(...growthData.map((d) => d.users));
                        const height = (item.users / maxUsers) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-accent rounded-t-sm transition-all hover:bg-accent/80 cursor-pointer relative group"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {item.users} users
                              </div>
                            </div>
                            {idx % 5 === 0 && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-accent" />
                        <span className="text-muted-foreground">New Users</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Top Groups */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-xl font-semibold">Top Groups</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Largest connected groups by member count
                    </p>
                  </div>
                  <Hash className="h-8 w-8 text-primary" />
                </div>

                {topGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No groups connected yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topGroups.map((group, idx) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{group.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.username ? `@${group.username}` : `ID: ${group.chat_id}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {group.member_count?.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">members</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="h-6 w-6 text-success" />
                    <h3 className="font-semibold">Active Users</h3>
                  </div>
                  <div className="text-3xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-2">Last 30 days</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Engagement Rate</span>
                      <span className="font-semibold">
                        {stats.totalUsers > 0
                          ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            stats.totalUsers > 0
                              ? (stats.activeUsers / stats.totalUsers) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold">Total Reach</h3>
                  </div>
                  <div className="text-3xl font-bold">
                    {(stats.totalUsers + stats.totalGroups * 100).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Estimated reach</p>
                  <Badge variant="outline" className="mt-4">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Growing
                  </Badge>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <h3 className="font-semibold">Avg Response Time</h3>
                  </div>
                  <div className="text-3xl font-bold">{"<1"} min</div>
                  <p className="text-sm text-muted-foreground mt-2">Bot response time</p>
                  <Badge variant="default" className="mt-4 bg-success">
                    Excellent
                  </Badge>
                </Card>
              </div>
            </TabsContent>

            {/* Broadcasts Tab */}
            <TabsContent value="broadcasts" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-xl font-semibold">Recent Broadcasts</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Performance of latest broadcast campaigns
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-accent" />
                </div>

                {broadcastStats.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No broadcasts sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {broadcastStats.map((broadcast) => (
                      <div
                        key={broadcast.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold">{broadcast.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {new Date(broadcast.created_at).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant="default" className="bg-success">
                            Completed
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Target</div>
                            <div className="font-semibold mt-1 capitalize">
                              {broadcast.target_type}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Recipients</div>
                            <div className="font-semibold mt-1">
                              {broadcast.total_recipients?.toLocaleString() || 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Success Rate</div>
                            <div className="font-semibold mt-1 text-success">
                              {broadcast.total_recipients > 0
                                ? (
                                    ((broadcast.successful_sends || 0) /
                                      broadcast.total_recipients) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Affiliates Tab */}
            {affiliateEnabled && (
              <TabsContent value="affiliates" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Total Affiliates
                      </span>
                    </div>
                    <div className="text-3xl font-bold">
                      {affiliateStats?.total_affiliates || 0}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Total Referrals
                      </span>
                    </div>
                    <div className="text-3xl font-bold">
                      {affiliateStats?.total_referrals || 0}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Total Commissions
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-success">
                      ${(affiliateStats?.total_commissions || 0).toFixed(2)}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Pending Payouts
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-warning">
                      ${(affiliateStats?.pending_payouts || 0).toFixed(2)}
                    </div>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}