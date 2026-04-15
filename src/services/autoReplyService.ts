import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { telegramService, type TelegramButton } from "./telegramService";

export const autoReplyService = {
  /**
   * Get all auto-reply rules
   */
  async getRules(): Promise<{
    data: Tables<"auto_reply_rules">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("auto_reply_rules")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    return { data: data || [], error: error?.message || null };
  },

  /**
   * Create new auto-reply rule
   */
  async createRule(ruleData: {
    title: string;
    trigger_type: string;
    trigger_value: string;
    response_type: string;
    response_message?: string;
    response_media_url?: string;
    response_caption?: string;
    response_buttons?: TelegramButton[][];
    match_case_sensitive?: boolean;
    match_whole_word?: boolean;
    priority?: number;
    delay_seconds?: number;
  }): Promise<{
    data: Tables<"auto_reply_rules"> | null;
    error: string | null;
  }> {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;

    if (!userId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("auto_reply_rules")
      .insert({
        user_id: userId,
        title: ruleData.title,
        trigger_type: ruleData.trigger_type,
        trigger_value: ruleData.trigger_value,
        response_type: ruleData.response_type,
        response_message: ruleData.response_message,
        response_media_url: ruleData.response_media_url,
        response_caption: ruleData.response_caption,
        response_buttons: ruleData.response_buttons as any,
        match_case_sensitive: ruleData.match_case_sensitive || false,
        match_whole_word: ruleData.match_whole_word || false,
        priority: ruleData.priority || 0,
        delay_seconds: ruleData.delay_seconds || 0,
        is_active: true,
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Update existing rule
   */
  async updateRule(
    id: string,
    ruleData: {
      title?: string;
      trigger_type?: string;
      trigger_value?: string;
      response_type?: string;
      response_message?: string;
      response_media_url?: string;
      response_caption?: string;
      response_buttons?: TelegramButton[][];
      match_case_sensitive?: boolean;
      match_whole_word?: boolean;
      priority?: number;
      delay_seconds?: number;
      is_active?: boolean;
    }
  ): Promise<{
    data: Tables<"auto_reply_rules"> | null;
    error: string | null;
  }> {
    const updateData: any = {
      ...ruleData,
      updated_at: new Date().toISOString(),
    };

    if (ruleData.response_buttons !== undefined) {
      updateData.response_buttons = ruleData.response_buttons as any;
    }

    const { data, error } = await supabase
      .from("auto_reply_rules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Delete rule
   */
  async deleteRule(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("auto_reply_rules")
      .delete()
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Toggle rule active status
   */
  async toggleRule(
    id: string,
    isActive: boolean
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("auto_reply_rules")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Match message against rules and return matching rule
   */
  async findMatchingRule(
    message: string
  ): Promise<{ rule: Tables<"auto_reply_rules"> | null; error: string | null }> {
    // Get all active rules sorted by priority
    const { data: rules, error } = await supabase
      .from("auto_reply_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (error) {
      return { rule: null, error: error.message };
    }

    if (!rules || rules.length === 0) {
      return { rule: null, error: null };
    }

    // Check each rule for match
    for (const rule of rules) {
      let isMatch = false;
      const triggerValue = rule.match_case_sensitive
        ? rule.trigger_value
        : rule.trigger_value.toLowerCase();
      const messageText = rule.match_case_sensitive
        ? message
        : message.toLowerCase();

      switch (rule.trigger_type) {
        case "exact":
          isMatch = messageText === triggerValue;
          break;

        case "keyword":
          if (rule.match_whole_word) {
            const regex = new RegExp(`\\b${triggerValue}\\b`, "i");
            isMatch = regex.test(messageText);
          } else {
            isMatch = messageText.includes(triggerValue);
          }
          break;

        case "command":
          isMatch = messageText.startsWith("/" + triggerValue);
          break;

        case "regex":
          try {
            const regex = new RegExp(triggerValue, rule.match_case_sensitive ? "" : "i");
            isMatch = regex.test(messageText);
          } catch (e) {
            console.error("Invalid regex:", e);
          }
          break;
      }

      if (isMatch) {
        // Update usage stats
        await supabase
          .from("auto_reply_rules")
          .update({
            usage_count: (rule.usage_count || 0) + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", rule.id);

        return { rule, error: null };
      }
    }

    return { rule: null, error: null };
  },

  /**
   * Execute auto-reply rule
   */
  async executeRule(
    rule: Tables<"auto_reply_rules">,
    chatId: string | number,
    botToken: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Apply delay if configured
      if (rule.delay_seconds && rule.delay_seconds > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, rule.delay_seconds! * 1000)
        );
      }

      const buttons = rule.response_buttons as unknown as TelegramButton[][] | null;

      let result;

      // Send response based on type
      if (rule.response_type === "photo" && rule.response_media_url) {
        result = await telegramService.sendPhoto(
          botToken,
          chatId,
          rule.response_media_url,
          rule.response_caption || rule.response_message,
          buttons || undefined
        );
      } else if (rule.response_type === "document" && rule.response_media_url) {
        result = await telegramService.sendDocument(
          botToken,
          chatId,
          rule.response_media_url,
          rule.response_caption || rule.response_message,
          undefined,
          buttons || undefined
        );
      } else {
        result = await telegramService.sendMessage(
          botToken,
          chatId,
          rule.response_message || "Auto-reply",
          buttons || undefined
        );
      }

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Execute rule error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute rule",
      };
    }
  },
};