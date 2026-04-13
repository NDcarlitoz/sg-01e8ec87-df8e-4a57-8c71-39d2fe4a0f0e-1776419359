import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BotToken = Tables<"bot_tokens">;

export const botTokenService = {
  // Get all bot tokens for current user
  async getBotTokens() {
    const { data, error } = await supabase
      .from("bot_tokens")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("getBotTokens:", { data, error });
    return { data: data || [], error };
  },

  // Get single bot token
  async getBotToken(id: string) {
    const { data, error } = await supabase
      .from("bot_tokens")
      .select("*")
      .eq("id", id)
      .single();

    console.log("getBotToken:", { data, error });
    return { data, error };
  },

  // Create new bot token
  async createBotToken(botData: {
    bot_name: string;
    bot_token: string;
    bot_username?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error("User not authenticated") };
    }

    const { data, error } = await supabase
      .from("bot_tokens")
      .insert({
        user_id: user.id,
        bot_name: botData.bot_name,
        bot_token: botData.bot_token,
        bot_username: botData.bot_username,
        is_active: true,
      })
      .select()
      .single();

    console.log("createBotToken:", { data, error });
    return { data, error };
  },

  // Update bot token
  async updateBotToken(
    id: string,
    updates: {
      bot_name?: string;
      bot_token?: string;
      bot_username?: string;
      is_active?: boolean;
    }
  ) {
    const { data, error } = await supabase
      .from("bot_tokens")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("updateBotToken:", { data, error });
    return { data, error };
  },

  // Delete bot token
  async deleteBotToken(id: string) {
    const { error } = await supabase
      .from("bot_tokens")
      .delete()
      .eq("id", id);

    console.log("deleteBotToken:", { error });
    return { error };
  },

  // Toggle bot active status
  async toggleBotStatus(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from("bot_tokens")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    console.log("toggleBotStatus:", { data, error });
    return { data, error };
  },

  // Validate Telegram bot token format
  validateBotToken(token: string): boolean {
    // Telegram bot token format: <bot_id>:<auth_token>
    // Example: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    return tokenRegex.test(token);
  },
};