import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { telegramService } from "./telegramService";

export const moderationService = {
  /**
   * Get moderation settings for a group
   */
  async getModerationSettings(
    groupId: string
  ): Promise<{
    data: Tables<"group_moderation_settings"> | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("group_moderation_settings")
      .select("*")
      .eq("group_id", groupId)
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Upsert moderation settings
   */
  async upsertModerationSettings(
    groupId: string,
    settings: Partial<Tables<"group_moderation_settings">>
  ): Promise<{ error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const ownerId = authData.session?.user.id;

    if (!ownerId) {
      return { error: "Authentication required" };
    }

    const { error } = await supabase.from("group_moderation_settings").upsert({
      group_id: groupId,
      owner_id: ownerId,
      ...settings,
    });

    return { error: error?.message || null };
  },

  /**
   * Get banned words for a group
   */
  async getBannedWords(
    groupId: string
  ): Promise<{ data: Tables<"banned_words">[] | null; error: string | null }> {
    const { data, error } = await supabase
      .from("banned_words")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Add banned word
   */
  async addBannedWord(
    groupId: string,
    word: string,
    options: {
      isRegex?: boolean;
      caseSensitive?: boolean;
      action?: string;
    } = {}
  ): Promise<{ error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const ownerId = authData.session?.user.id;

    if (!ownerId) {
      return { error: "Authentication required" };
    }

    const { error } = await supabase.from("banned_words").insert({
      group_id: groupId,
      owner_id: ownerId,
      word,
      is_regex: options.isRegex || false,
      case_sensitive: options.caseSensitive || false,
      action: options.action || "delete",
    });

    return { error: error?.message || null };
  },

  /**
   * Delete banned word
   */
  async deleteBannedWord(wordId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("banned_words")
      .delete()
      .eq("id", wordId);

    return { error: error?.message || null };
  },

  /**
   * Get force join channels for a group
   */
  async getForceJoinChannels(
    groupId: string
  ): Promise<{
    data: (Tables<"force_join_channels"> & { channel: Tables<"channels"> })[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("force_join_channels")
      .select("*, channel:channels(*)")
      .eq("group_id", groupId);

    return { data: data as any, error: error?.message || null };
  },

  /**
   * Add force join channel
   */
  async addForceJoinChannel(
    groupId: string,
    channelId: string
  ): Promise<{ error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const ownerId = authData.session?.user.id;

    if (!ownerId) {
      return { error: "Authentication required" };
    }

    const { error } = await supabase.from("force_join_channels").insert({
      group_id: groupId,
      channel_id: channelId,
      owner_id: ownerId,
    });

    return { error: error?.message || null };
  },

  /**
   * Remove force join channel
   */
  async removeForceJoinChannel(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("force_join_channels")
      .delete()
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Get moderation logs for a group
   */
  async getModerationLogs(
    groupId: string,
    limit: number = 100
  ): Promise<{
    data: Tables<"moderation_logs">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("moderation_logs")
      .select("*")
      .eq("group_id", groupId)
      .order("performed_at", { ascending: false })
      .limit(limit);

    return { data, error: error?.message || null };
  },

  /**
   * Log moderation action
   */
  async logAction(
    groupId: string,
    userId: number,
    action: string,
    reason: string,
    details?: {
      username?: string;
      triggeredBy?: string;
      messageText?: string;
    }
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.from("moderation_logs").insert({
      group_id: groupId,
      user_id: userId,
      username: details?.username,
      action,
      reason,
      triggered_by: details?.triggeredBy,
      message_text: details?.messageText,
    });

    return { error: error?.message || null };
  },

  /**
   * Check if message contains banned words
   */
  async checkBannedWords(
    groupId: string,
    message: string
  ): Promise<{
    hasBannedWord: boolean;
    matchedWord: Tables<"banned_words"> | null;
  }> {
    const { data: bannedWords } = await this.getBannedWords(groupId);

    if (!bannedWords || bannedWords.length === 0) {
      return { hasBannedWord: false, matchedWord: null };
    }

    for (const bannedWord of bannedWords) {
      const text = bannedWord.case_sensitive ? message : message.toLowerCase();
      const word = bannedWord.case_sensitive
        ? bannedWord.word
        : bannedWord.word.toLowerCase();

      if (bannedWord.is_regex) {
        try {
          const regex = new RegExp(word, bannedWord.case_sensitive ? "" : "i");
          if (regex.test(text)) {
            return { hasBannedWord: true, matchedWord: bannedWord };
          }
        } catch (e) {
          console.error("Invalid regex:", word);
        }
      } else {
        if (text.includes(word)) {
          return { hasBannedWord: true, matchedWord: bannedWord };
        }
      }
    }

    return { hasBannedWord: false, matchedWord: null };
  },

  /**
   * Record user violation
   */
  async recordViolation(
    groupId: string,
    userId: number
  ): Promise<{ violationCount: number; error: string | null }> {
    // Get or create violation record
    const { data: existing } = await supabase
      .from("user_violations")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Check if we should reset violations
      const resetAt = new Date(existing.reset_at || 0);
      const now = new Date();

      if (now > resetAt) {
        // Reset violations
        const { error } = await supabase
          .from("user_violations")
          .update({
            violation_count: 1,
            last_violation_at: now.toISOString(),
            reset_at: new Date(
              now.getTime() + 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("id", existing.id);

        return { violationCount: 1, error: error?.message || null };
      } else {
        // Increment violations
        const newCount = existing.violation_count + 1;
        const { error } = await supabase
          .from("user_violations")
          .update({
            violation_count: newCount,
            last_violation_at: now.toISOString(),
          })
          .eq("id", existing.id);

        return { violationCount: newCount, error: error?.message || null };
      }
    } else {
      // Create new violation record
      const now = new Date();
      const { error } = await supabase.from("user_violations").insert({
        group_id: groupId,
        user_id: userId,
        violation_count: 1,
        last_violation_at: now.toISOString(),
        reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      });

      return { violationCount: 1, error: error?.message || null };
    }
  },

  /**
   * Execute moderation action via Telegram API
   */
  async executeAction(
    action: string,
    chatId: number,
    userId: number,
    messageId?: number
  ): Promise<{ success: boolean; error: string | null }> {
    const { token } = await telegramService.getActiveBotToken();

    if (!token) {
      return { success: false, error: "No active bot token" };
    }

    try {
      switch (action) {
        case "delete":
          if (!messageId) {
            return { success: false, error: "Message ID required for delete" };
          }
          const deleteResult = await fetch(
            `https://api.telegram.org/bot${token}/deleteMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
              }),
            }
          );
          const deleteData = await deleteResult.json();
          return {
            success: deleteData.ok,
            error: deleteData.description || null,
          };

        case "kick":
          const kickResult = await fetch(
            `https://api.telegram.org/bot${token}/banChatMember`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                user_id: userId,
                revoke_messages: false,
              }),
            }
          );
          const kickData = await kickResult.json();
          
          // Unban immediately after kick
          if (kickData.ok) {
            await fetch(
              `https://api.telegram.org/bot${token}/unbanChatMember`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  user_id: userId,
                }),
              }
            );
          }
          
          return {
            success: kickData.ok,
            error: kickData.description || null,
          };

        case "ban":
          const banResult = await fetch(
            `https://api.telegram.org/bot${token}/banChatMember`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                user_id: userId,
                revoke_messages: true,
              }),
            }
          );
          const banData = await banResult.json();
          return {
            success: banData.ok,
            error: banData.description || null,
          };

        default:
          return { success: false, error: "Unknown action" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Check if user is member of required channels
   */
  async checkChannelMembership(
    userId: number,
    channelIds: string[]
  ): Promise<{ isMember: boolean; error: string | null }> {
    const { token } = await telegramService.getActiveBotToken();

    if (!token) {
      return { isMember: false, error: "No active bot token" };
    }

    // Get channel chat IDs
    const { data: channels } = await supabase
      .from("channels")
      .select("chat_id")
      .in("id", channelIds);

    if (!channels || channels.length === 0) {
      return { isMember: true, error: null };
    }

    // Check membership in all channels
    for (const channel of channels) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${token}/getChatMember`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: channel.chat_id,
              user_id: userId,
            }),
          }
        );

        const data = await response.json();

        if (!data.ok) {
          return { isMember: false, error: null };
        }

        const status = data.result?.status;
        if (!["member", "administrator", "creator"].includes(status)) {
          return { isMember: false, error: null };
        }
      } catch (error) {
        return {
          isMember: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return { isMember: true, error: null };
  },
};