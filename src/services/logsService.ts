import { supabase } from "@/integrations/supabase/client";

export interface LogEntry {
  id: string;
  bot_user_id: string;
  interaction_type: string;
  content: string | null;
  metadata: any;
  created_at: string;
  user_name?: string;
  user_username?: string;
}

export interface LogsFilter {
  interaction_type?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export const logsService = {
  /**
   * Get all interaction logs with filters
   */
  async getLogs(
    filter?: LogsFilter,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ data: LogEntry[] | null; error: string | null; count: number }> {
    try {
      let query = supabase
        .from("user_interactions")
        .select(
          `
          *,
          bot_user:bot_users!user_interactions_bot_user_id_fkey(
            user_id,
            username,
            first_name,
            last_name,
            full_name
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filter?.type && filter.type !== "all") {
        query = query.eq("interaction_type", filter.type);
      }

      if (filter?.userId) {
        query = query.eq("bot_user_id", filter.userId);
      }

      if (filter?.search) {
        query = query.ilike("content", `%${filter.search}%`);
      }

      if (filter?.startDate) {
        query = query.gte("created_at", filter.startDate);
      }

      if (filter?.endDate) {
        query = query.lte("created_at", filter.endDate);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("Fetch logs error:", error);
        return { data: null, error: error.message, count: 0 };
      }

      return { data: data as LogEntry[], error: null, count: count || 0 };
    } catch (error) {
      console.error("Get logs error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        count: 0,
      };
    }
  },

  /**
   * Get logs statistics
   */
  async getLogsStats(): Promise<{
    data: {
      total: number;
      today: number;
      byType: Record<string, number>;
    } | null;
    error: string | null;
  }> {
    try {
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from("user_interactions")
        .select("*", { count: "exact", head: true });

      if (totalError) {
        return { data: null, error: totalError.message };
      }

      // Get today's count
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayCount, error: todayError } = await supabase
        .from("user_interactions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      if (todayError) {
        return { data: null, error: todayError.message };
      }

      // Get count by type
      const { data: typeData, error: typeError } = await supabase
        .from("user_interactions")
        .select("interaction_type");

      if (typeError) {
        return { data: null, error: typeError.message };
      }

      const byType: Record<string, number> = {};
      typeData?.forEach((item) => {
        const type = item.interaction_type || "unknown";
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        data: {
          total: total || 0,
          today: todayCount || 0,
          byType,
        },
        error: null,
      };
    } catch (error) {
      console.error("Get logs stats error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Export logs to CSV
   */
  async exportLogsToCSV(filter?: LogsFilter): Promise<{ data: string | null; error: string | null }> {
    try {
      const { data: logs, error } = await this.getLogs(filter, 10000, 0);

      if (error || !logs) {
        return { data: null, error: error || "Failed to fetch logs" };
      }

      // Create CSV header
      const headers = ["Timestamp", "User ID", "Username", "Full Name", "Type", "Content", "Metadata"];
      
      // Create CSV rows
      const rows = logs.map((log) => [
        new Date(log.created_at).toLocaleString(),
        log.bot_user?.user_id || "",
        log.bot_user?.username || "",
        log.bot_user?.full_name || "",
        log.interaction_type,
        log.content,
        JSON.stringify(log.metadata || {}),
      ]);

      // Combine headers and rows
      const csv = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      return { data: csv, error: null };
    } catch (error) {
      console.error("Export logs error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Clear old logs (older than specified days)
   */
  async clearOldLogs(daysOld: number = 30): Promise<{ success: boolean; error: string | null }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from("user_interactions")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Clear old logs error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};