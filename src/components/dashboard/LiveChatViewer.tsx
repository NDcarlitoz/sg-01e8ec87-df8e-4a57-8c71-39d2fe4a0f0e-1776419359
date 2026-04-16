import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, Bot, User, RefreshCw, Search, X } from "lucide-react";
import { logsService, type LogEntry } from "@/services/logsService";
import { format } from "date-fns";

interface LiveChatViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LiveChatViewer({ open, onOpenChange }: LiveChatViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open]);

  useEffect(() => {
    if (!autoRefresh || !open) return;

    const interval = setInterval(() => {
      loadLogs(true); // Silent refresh
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, open]);

  useEffect(() => {
    // Filter logs based on search
    if (searchQuery.trim() === "") {
      setFilteredLogs(logs);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredLogs(
        logs.filter(
          (log) =>
            log.content?.toLowerCase().includes(query) ||
            log.user_name?.toLowerCase().includes(query) ||
            log.user_username?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, logs]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs]);

  const loadLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);

    const { data } = await logsService.getLogs();

    if (data) {
      // Sort by timestamp ascending (oldest first) for chat-like view
      const sorted = [...data].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setLogs(sorted);
      setFilteredLogs(sorted);
    }

    if (!silent) setIsLoading(false);
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "HH:mm:ss");
  };

  const formatDate = (timestamp: string) => {
    return format(new Date(timestamp), "MMM dd, yyyy");
  };

  const getBotResponse = (content: string) => {
    // Simple logic to detect bot responses
    // You can enhance this based on your bot's response patterns
    if (content.startsWith("👋") || content.includes("Welcome") || content.includes("Available commands")) {
      return "Welcome message sent";
    }
    if (content.includes("Help") || content.includes("support")) {
      return "Help information sent";
    }
    return "Response sent";
  };

  const groupMessagesByDate = () => {
    const groups: Record<string, LogEntry[]> = {};
    
    filteredLogs.forEach((log) => {
      const date = formatDate(log.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                Live Chat Logs
              </DialogTitle>
              <DialogDescription>
                Real-time conversation between users and bot
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={autoRefresh ? "default" : "secondary"} className="gap-1">
                <div className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                {autoRefresh ? "Live" : "Paused"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-accent" />
                <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {searchQuery ? "No messages found" : "No chat logs yet"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  {searchQuery
                    ? "Try a different search term"
                    : "Messages will appear here when users interact with your bot"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {Object.entries(messageGroups).map(([date, messages]) => (
                <div key={date}>
                  {/* Date Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs font-medium text-muted-foreground px-2">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-3">
                    {messages.map((log) => (
                      <div key={log.id} className="space-y-2">
                        {/* User Message */}
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
                            <User className="h-4 w-4 text-accent" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {log.user_name || "Unknown User"}
                              </span>
                              {log.user_username && (
                                <span className="text-xs text-muted-foreground">
                                  @{log.user_username}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatTime(log.created_at)}
                              </span>
                            </div>
                            <div className="rounded-lg rounded-tl-none bg-accent/10 px-3 py-2 inline-block">
                              <p className="text-sm">{log.content || "(No content)"}</p>
                            </div>
                            {log.interaction_type && (
                              <Badge variant="secondary" className="text-xs">
                                {log.interaction_type}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Bot Response (if command) */}
                        {log.interaction_type === "command" && (
                          <div className="flex items-start gap-3 ml-11">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">Bot</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatTime(log.created_at)}
                                </span>
                              </div>
                              <div className="rounded-lg rounded-tl-none bg-primary/10 px-3 py-2 inline-block">
                                <p className="text-sm text-muted-foreground">
                                  {getBotResponse(log.content || "")}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer Stats */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filteredLogs.length} message{filteredLogs.length !== 1 ? "s" : ""}
              {searchQuery && ` (filtered)`}
            </span>
            <span>Auto-refresh: {autoRefresh ? "ON" : "OFF"}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}