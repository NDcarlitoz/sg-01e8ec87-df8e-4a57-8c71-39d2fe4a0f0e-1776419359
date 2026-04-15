import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { telegramService, type TelegramButton } from "./telegramService";

export const broadcastService = {
  /**
   * Get all broadcasts for current user
   */
  async getBroadcasts(): Promise<{
    data: Tables<"broadcasts">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Upload media file to Supabase Storage
   */
  async uploadMedia(
    file: File
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user.id;

      if (!userId) {
        return { url: null, error: "Authentication required" };
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("broadcast-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        return { url: null, error: error.message };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("broadcast-media").getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  },

  /**
   * Create new broadcast
   */
  async createBroadcast(broadcastData: {
    title: string;
    message: string;
    target_type: string;
    target_ids: string[];
    media_type?: string;
    media_url?: string;
    media_filename?: string;
    caption?: string;
    scheduled_at?: string;
    buttons?: TelegramButton[][];
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
        target_ids: broadcastData.target_ids,
        media_type: broadcastData.media_type || "text",
        media_url: broadcastData.media_url,
        media_filename: broadcastData.media_filename,
        caption: broadcastData.caption,
        scheduled_at: broadcastData.scheduled_at,
        buttons: broadcastData.buttons as any,
        status: "draft",
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Send broadcast to all targets
   */
  async sendBroadcast(
    broadcastId: string
  ): Promise<{ success: boolean; error: string | null }> {
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
      const { token, error: tokenError } =
        await telegramService.getActiveBotToken();
      if (tokenError || !token) {
        return { success: false, error: "No active bot token found" };
      }

      // Update status to sending
      await supabase
        .from("broadcasts")
        .update({ status: "sending" })
        .eq("id", broadcastId);

      let sentCount = 0;
      let failedCount = 0;

      const buttons = (broadcast.buttons as unknown) as TelegramButton[][] | null;

      // Send to each target
      for (const targetId of broadcast.target_ids) {
        let result;

        if (broadcast.media_type === "photo" && broadcast.media_url) {
          result = await telegramService.sendPhoto(
            token,
            targetId,
            broadcast.media_url,
            broadcast.caption || broadcast.message,
            buttons || undefined
          );
        } else if (broadcast.media_type === "document" && broadcast.media_url) {
          result = await telegramService.sendDocument(
            token,
            targetId,
            broadcast.media_url,
            broadcast.caption || broadcast.message,
            broadcast.media_filename,
            buttons || undefined
          );
        } else {
          result = await telegramService.sendMessage(
            token,
            targetId,
            broadcast.message,
            buttons || undefined
          );
        }

        if (result.error) {
          failedCount++;
          console.error(`Failed to send to ${targetId}:`, result.error);
        } else {
          sentCount++;
        }
      }

      // Update broadcast with results
      await supabase
        .from("broadcasts")
        .update({
          status: failedCount === broadcast.target_ids.length ? "failed" : "sent",
          sent_count: sentCount,
          failed_count: failedCount,
        })
        .eq("id", broadcastId);

      return { success: true, error: null };
    } catch (error) {
      console.error("Send broadcast error:", error);
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