import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Search, Filter, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ClientError = Tables<"client_errors">;

export default function ErrorLogsPage() {
  const [errors, setErrors] = useState<ClientError[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchErrors();
  }, [filterType, filterSeverity, showResolved]);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("client_errors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterType !== "all") {
        query = query.eq("error_type", filterType);
      }

      if (filterSeverity !== "all") {
        query = query.eq("severity", filterSeverity);
      }

      if (!showResolved) {
        query = query.eq("is_resolved", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setErrors(data || []);
    } catch (error) {
      console.error("Error fetching error logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch error logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (errorId: string) => {
    try {
      const { error } = await supabase
        .from("client_errors")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", errorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Error marked as resolved",
      });

      fetchErrors();
    } catch (error) {
      console.error("Error updating error log:", error);
      toast({
        title: "Error",
        description: "Failed to update error log",
        variant: "destructive",
      });
    }
  };

  const filteredErrors = errors.filter((error) =>
    error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.page_path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "fatal":
        return "destructive";
      case "error":
        return "default";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "react":
        return "⚛️";
      case "javascript":
        return "🔧";
      case "promise_rejection":
        return "❌";
      case "network":
        return "🌐";
      case "api":
        return "📡";
      default:
        return "⚠️";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Error Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and track client-side errors reported from your application
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search errors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Error Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="promise_rejection">Promise</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="fatal">Fatal</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showResolved ? "default" : "outline"}
                onClick={() => setShowResolved(!showResolved)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showResolved ? "Hide" : "Show"} Resolved
              </Button>

              <Button onClick={fetchErrors} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Loading error logs...</p>
          </Card>
        ) : filteredErrors.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
              <h3 className="text-lg font-semibold mb-2">No errors found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== "all" || filterSeverity !== "all"
                  ? "Try adjusting your filters"
                  : "Your application is running smoothly!"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredErrors.map((error) => (
              <Card key={error.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
                      error.is_resolved ? "bg-success/10" : "bg-destructive/10"
                    }`}>
                      {error.is_resolved ? "✓" : getTypeIcon(error.error_type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 break-words">
                          {error.error_message}
                        </h3>
                        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                          <Badge variant={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                          <Badge variant="outline">
                            {error.error_type.replace("_", " ")}
                          </Badge>
                          <span>•</span>
                          <a
                            href={error.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary inline-flex items-center gap-1"
                          >
                            {error.page_path}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {error.occurrence_count > 1 && (
                            <>
                              <span>•</span>
                              <span className="font-medium">
                                {error.occurrence_count} occurrences
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {!error.is_resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsResolved(error.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                    </div>

                    {error.error_stack && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium hover:text-primary">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                          {error.error_stack}
                        </pre>
                      </details>
                    )}

                    {error.component_stack && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium hover:text-primary">
                          Component Stack
                        </summary>
                        <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                          {error.component_stack}
                        </pre>
                      </details>
                    )}

                    {error.browser_info && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        Browser: {(error.browser_info as any).name} {(error.browser_info as any).version} on {(error.browser_info as any).os}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground">
                      {new Date(error.created_at).toLocaleString()}
                      {error.last_occurred_at !== error.created_at && (
                        <> (Last: {new Date(error.last_occurred_at).toLocaleString()})</>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}