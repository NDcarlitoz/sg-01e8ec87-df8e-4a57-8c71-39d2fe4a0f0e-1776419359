import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const botTokenService = {
  /**
   * Get all bot tokens for current user
   */
  async getBotTokens(): Promise<{ data: Tables<"bot_tokens">[] | null; error: string | null }> {
    const { data, error } = await supabase
      .from("bot_tokens")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Get bot statistics
   */
  async getBotStats(): Promise<{
    data: {
      total: number;
      active: number;
      inactive: number;
    } | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("bot_tokens")
      .select("id, is_active");

    if (error) {
      return { data: null, error: error.message };
    }

    const total = data?.length || 0;
    const active = data?.filter((bot) => bot.is_active).length || 0;
    const inactive = total - active;

    return {
      data: { total, active, inactive },
      error: null,
    };
  },

  /**
   * Create new bot token with Telegram verification
   */
  async createBotToken(tokenData: {
    bot_name: string;
    bot_token: string;
    bot_username?: string;
  }): Promise<{ data: Tables<"bot_tokens"> | null; error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;
    
    if (!userId) {
      return { data: null, error: "Authentication required" };
    }

    console.log("Verifying bot token with Telegram API...");

    try {
      // Verify token with Telegram API first
      const verifyResponse = await fetch("/api/telegram/get-bot-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: tokenData.bot_token }),
      });

      console.log("Telegram API response status:", verifyResponse.status);

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        console.error("Telegram API error:", errorData);
        return { data: null, error: errorData.error || "Invalid bot token - verification failed" };
      }

      const { data: botInfo } = await verifyResponse.json();
      console.log("Bot verified successfully:", botInfo);

      // Insert to database with verified bot info
      const { data, error } = await supabase
        .from("bot_tokens")
        .insert({
          bot_name: tokenData.bot_name,
          bot_token: tokenData.bot_token,
          bot_username: tokenData.bot_username || botInfo?.username || null,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error("Database insert error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Bot token creation error:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : "Failed to verify bot token"
      };
    }
  },

  /**
   * Update existing bot token
   */
  async updateBotToken(
    id: string,
    tokenData: {
      bot_name: string;
      bot_token: string;
      bot_username?: string;
    }
  ): Promise<{ data: Tables<"bot_tokens"> | null; error: string | null }> {
    console.log("Verifying updated bot token...");

    try {
      // Verify token with Telegram API first
      const verifyResponse = await fetch("/api/telegram/get-bot-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: tokenData.bot_token }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        console.error("Telegram API error:", errorData);
        return { data: null, error: errorData.error || "Invalid bot token" };
      }

      const { data, error } = await supabase
        .from("bot_tokens")
        .update({
          bot_name: tokenData.bot_name,
          bot_token: tokenData.bot_token,
          bot_username: tokenData.bot_username,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Database update error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Bot token update error:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : "Failed to update bot token"
      };
    }
  },

  /**
   * Delete bot token
   */
  async deleteBotToken(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("bot_tokens").delete().eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Toggle bot active status
   */
  async toggleBotStatus(id: string, isActive: boolean): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_tokens")
      .update({ is_active: isActive })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Check webhook status for a bot
   */
  async checkWebhookStatus(botId: string): Promise<{
    data: {
      url: string | null;
      is_set: boolean;
      pending_updates: number;
      last_error?: string;
    } | null;
    error: string | null;
  }> {
    try {
      const response = await fetch("/api/telegram/check-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || "Failed to check webhook" };
      }

      const { webhook } = await response.json();

      return {
        data: {
          url: webhook.url,
          is_set: webhook.is_set,
          pending_updates: webhook.pending_update_count,
          last_error: webhook.last_error_message,
        },
        error: null,
      };
    } catch (error) {
      console.error("Check webhook status error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to check webhook",
      };
    }
  },

  /**
   * Validate bot token format
   */
  validateBotToken(token: string): boolean {
    // Telegram bot token format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    return tokenRegex.test(token);
  },

  /**
   * Update bot welcome message
   */
  async updateWelcomeMessage(
    botId: string,
    welcomeMessage: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("bot_tokens")
        .update({ welcome_message: welcomeMessage })
        .eq("id", botId);

      if (error) {
        console.error("Update welcome message error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Update welcome message error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get bot welcome message
   */
  async getWelcomeMessage(
    botId: string
  ): Promise<{ data: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("bot_tokens")
        .select("welcome_message")
        .eq("id", botId)
        .single();

      if (error) {
        console.error("Get welcome message error:", error);
        return { data: null, error: error.message };
      }

      return { data: data?.welcome_message || null, error: null };
    } catch (error) {
      console.error("Get welcome message error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};