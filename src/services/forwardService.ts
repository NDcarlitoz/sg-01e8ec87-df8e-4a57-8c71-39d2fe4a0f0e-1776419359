import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { telegramService } from "./telegramService";

export const forwardService = {
  /**
   * Get all message forwards
   */
  async getForwards(): Promise<{
    data: Tables<"message_forwards">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("message_forwards")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Create new forward
   */
  async createForward(forwardData: {
    title: string;
    source_chat_id: string;
    source_message_id: number;
    target_type: string;
    target_ids: string[];
    scheduled_at?: string;
  }): Promise<{ data: Tables<"message_forwards"> | null; error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;

    if (!userId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("message_forwards")
      .insert({
        user_id: userId,
        title: forwardData.title,
        source_chat_id: forwardData.source_chat_id,
        source_message_id: forwardData.source_message_id,
        target_type: forwardData.target_type,
        target_ids: forwardData.target_ids,
        scheduled_at: forwardData.scheduled_at,
        status: "draft",
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Execute forward operation
   */
  async executeForward(
    forwardId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get forward details
      const { data: forward, error: fetchError } = await supabase
        .from("message_forwards")
        .select("*")
        .eq("id", forwardId)
        .single();

      if (fetchError || !forward) {
        return { success: false, error: "Forward not found" };
      }

      // Get active bot token
      const { token, error: tokenError } =
        await telegramService.getActiveBotToken();
      if (tokenError || !token) {
        return { success: false, error: "No active bot token found" };
      }

      // Update status to forwarding
      await supabase
        .from("message_forwards")
        .update({ status: "forwarding" })
        .eq("id", forwardId);

      let forwardedCount = 0;
      let failedCount = 0;
      const forwardResults: Array<{
        target_id: string;
        success: boolean;
        error?: string;
      }> = [];

      // Forward to each target
      for (const targetId of forward.target_ids) {
        const result = await telegramService.forwardMessage(
          token,
          targetId,
          forward.source_chat_id,
          forward.source_message_id
        );

        if (result.error) {
          failedCount++;
          forwardResults.push({
            target_id: targetId,
            success: false,
            error: result.error,
          });
          console.error(`Failed to forward to ${targetId}:`, result.error);
        } else {
          forwardedCount++;
          forwardResults.push({
            target_id: targetId,
            success: true,
          });
        }

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update forward with results
      await supabase
        .from("message_forwards")
        .update({
          status:
            failedCount === forward.target_ids.length ? "failed" : "completed",
          forwarded_count: forwardedCount,
          failed_count: failedCount,
          forward_results: forwardResults as any,
        })
        .eq("id", forwardId);

      return { success: true, error: null };
    } catch (error) {
      console.error("Execute forward error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to forward messages",
      };
    }
  },

  /**
   * Delete forward
   */
  async deleteForward(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("message_forwards")
      .delete()
      .eq("id", id);

    return { error: error?.message || null };
  },
};