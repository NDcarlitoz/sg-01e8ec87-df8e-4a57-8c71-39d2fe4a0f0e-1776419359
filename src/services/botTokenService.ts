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

    // Verify token with Telegram API first
    const verifyResponse = await fetch("/api/telegram/get-bot-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: tokenData.bot_token }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      return { data: null, error: errorData.error || "Invalid bot token" };
    }

    const { data: botInfo } = await verifyResponse.json();

    // Insert to database with verified bot info
    const { data, error } = await supabase
      .from("bot_tokens")
      .insert({
        bot_name: tokenData.bot_name,
        bot_token: tokenData.bot_token,
        bot_username: tokenData.bot_username || botInfo.username || null,
        user_id: userId,
      })
      .select()
      .single();

    return { data, error: error?.message || null };
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
    // Verify token with Telegram API first
    const verifyResponse = await fetch("/api/telegram/get-bot-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: tokenData.bot_token }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
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

    return { data, error: error?.message || null };
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
   * Validate bot token format
   */
  validateBotToken(token: string): boolean {
    // Telegram bot token format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    return tokenRegex.test(token);
  },
};