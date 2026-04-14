import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { telegramService } from "./telegramService";

export const broadcastService = {
  /**
   * Get all broadcasts for current user
   */
  async getBroadcasts(): Promise<{ data: Tables<"broadcasts">[] | null; error: string | null }> {
    const { data, error } = await supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Create new broadcast
   */
  async createBroadcast(broadcastData: {
    title: string;
    message: string;
    target_type: string;
    target_ids?: string[];
    scheduled_at?: string;
  }): Promise<{ data: Tables<"broadcasts"> | null; error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;

    if (!userId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("broadcasts")
      .insert({
        user_id: userId,
        title: broadcastData.title,
        message: broadcastData.message,
        target_type: broadcastData.target_type,
        target_ids: broadcastData.target_ids || [],
        scheduled_at: broadcastData.scheduled_at || null,
        status: "draft",
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Send broadcast to targets
   */
  async sendBroadcast(broadcastId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get broadcast details
      const { data: broadcast, error: fetchError } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("id", broadcastId)
        .single();

      if (fetchError || !broadcast) {
        return { success: false, error: "Broadcast not found" };
      }

      // Get active bot token
      const { token: botToken, error: tokenError } = await telegramService.getActiveBotToken();
      if (tokenError || !botToken) {
        return { success: false, error: "No active bot token found" };
      }

      // Update status to sending
      await supabase
        .from("broadcasts")
        .update({ status: "sending" })
        .eq("id", broadcastId);

      let sentCount = 0;
      let failedCount = 0;
      const targetIds = broadcast.target_ids || [];

      // Send messages to all targets
      for (const chatId of targetIds) {
        try {
          const { error: sendError } = await telegramService.sendMessage(
            botToken,
            chatId,
            broadcast.message
          );

          if (sendError) {
            failedCount++;
          } else {
            sentCount++;
          }
        } catch (err) {
          failedCount++;
        }
      }

      // Update broadcast status
      await supabase
        .from("broadcasts")
        .update({
          status: failedCount === targetIds.length ? "failed" : "sent",
          sent_count: sentCount,
          failed_count: failedCount,
          total_recipients: targetIds.length,
          sent_at: new Date().toISOString(),
        })
        .eq("id", broadcastId);

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send broadcast",
      };
    }
  },

  /**
   * Delete broadcast
   */
  async deleteBroadcast(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("broadcasts").delete().eq("id", id);

    return { error: error?.message || null };
  },
};