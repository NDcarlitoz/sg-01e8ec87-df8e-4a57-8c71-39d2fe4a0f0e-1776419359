import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, RefreshCw, Search, Filter, FileText, MessageSquare, Activity } from "lucide-react";
import { logsService, type LogEntry, type LogsFilter } from "@/services/logsService";
import { useToast } from "@/hooks/use-toast";

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, byType: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<LogsFilter>({
    type: "all",
    search: "",
  });
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setIsLoading(true);
    const filterToApply = filter.type === "all" ? { ...filter, type: undefined } : filter;
    const { data, error } = await logsService.getLogs(filterToApply);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }

    if (data) {
      setLogs(data);
    }

    setIsLoading(false);
  };

  const loadStats = async () => {
    const { data } = await logsService.getLogsStats();
    if (data) {
      setStats(data);
    }
  };

  const handleSearch = () => {
    setFilter({ ...filter, search: search || undefined });
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setFilter({ ...filter, type: type === "all" ? undefined : type });
  };

  const handleExport = async () => {
    setIsLoading(true);
    const { data, error } = await logsService.exportLogsToCSV(filter);
    setIsLoading(false);

    if (error || !data) {
      toast({
        title: "Error",
        description: error || "Failed to export logs",
        variant: "destructive",
      });
      return;
    }

    // Download CSV
    const blob = new Blob([data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telegram-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Logs exported successfully",
    });
  };

  const handleRefresh = () => {
    loadLogs();
    loadStats();
    toast({
      title: "Refreshed",
      description: "Logs updated",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "message":
        return "default";
      case "command":
        return "secondary";
      case "callback_query":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <ProtectedRoute>
      <SEO title="Activity Logs - Telegram Admin" />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Activity Logs</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor all incoming Telegram commands and bot responses
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Interactions</p>
                    <p className="mt-2 text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today</p>
                    <p className="mt-2 text-3xl font-bold">{stats.today}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <MessageSquare className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">By Type</p>
                    <div className="mt-2 flex gap-2">
                      {Object.entries(stats.byType).map(([type, count]) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}: {String(count)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Interaction Logs</CardTitle>
                  <CardDescription>View and filter all user interactions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by content..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Type Filter */}
                <div className="w-[200px]">
                  <Select value={selectedType} onValueChange={handleTypeFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="message">Messages</SelectItem>
                      <SelectItem value="command">Commands</SelectItem>
                      <SelectItem value="callback_query">Callbacks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No logs found. Interactions will appear here once users start using your bot.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{log.bot_user?.full_name}</span>
                              {log.bot_user?.username && (
                                <span className="text-xs text-muted-foreground">
                                  @{log.bot_user.username}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeBadgeColor(log.interaction_type)}>
                              {log.interaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">{log.content}</TableCell>
                          <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                            {JSON.stringify(log.metadata)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}