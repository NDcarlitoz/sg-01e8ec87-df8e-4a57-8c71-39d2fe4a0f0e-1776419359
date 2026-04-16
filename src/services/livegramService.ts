import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface LivegramRuleInput {
  rule_name: string;
  source_chat_id: number;
  source_chat_title?: string;
  source_chat_type?: string;
  is_active?: boolean;
  filter_keywords?: string[];
  filter_user_types?: string[];
  filter_message_types?: string[];
  exclude_keywords?: string[];
  destinations: Array<{
    chat_id: number;
    chat_title: string;
    chat_type: string;
  }>;
  forward_mode?: "copy" | "forward" | "quote";
  remove_caption?: boolean;
  add_watermark?: boolean;
  watermark_text?: string;
  delay_seconds?: number;
  edit_message?: boolean;
  message_template?: string;
  send_as_admin?: boolean;
  preserve_formatting?: boolean;
}

export const livegramService = {
  /**
   * Get all livegram rules
   */
  async getRules(): Promise<{
    data: Tables<"livegram_rules">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("livegram_rules")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Get single rule
   */
  async getRule(id: string): Promise<{
    data: Tables<"livegram_rules"> | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("livegram_rules")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Create livegram rule
   */
  async createRule(
    input: LivegramRuleInput
  ): Promise<{ data: Tables<"livegram_rules"> | null; error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;

    if (!userId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("livegram_rules")
      .insert({
        owner_id: userId,
        rule_name: input.rule_name,
        source_chat_id: input.source_chat_id,
        source_chat_title: input.source_chat_title || null,
        source_chat_type: input.source_chat_type || null,
        is_active: input.is_active !== undefined ? input.is_active : true,
        filter_keywords: input.filter_keywords || null,
        filter_user_types: input.filter_user_types || null,
        filter_message_types: input.filter_message_types || null,
        exclude_keywords: input.exclude_keywords || null,
        destinations: input.destinations,
        forward_mode: input.forward_mode || "copy",
        remove_caption: input.remove_caption || false,
        add_watermark: input.add_watermark || false,
        watermark_text: input.watermark_text || null,
        delay_seconds: input.delay_seconds || 0,
        edit_message: input.edit_message || false,
        message_template: input.message_template || null,
        send_as_admin: input.send_as_admin || false,
        preserve_formatting: input.preserve_formatting !== undefined ? input.preserve_formatting : true,
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Update livegram rule
   */
  async updateRule(
    id: string,
    updates: Partial<LivegramRuleInput>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("livegram_rules")
      .update({
        rule_name: updates.rule_name,
        source_chat_id: updates.source_chat_id,
        source_chat_title: updates.source_chat_title,
        source_chat_type: updates.source_chat_type,
        is_active: updates.is_active,
        filter_keywords: updates.filter_keywords,
        filter_user_types: updates.filter_user_types,
        filter_message_types: updates.filter_message_types,
        exclude_keywords: updates.exclude_keywords,
        destinations: updates.destinations,
        forward_mode: updates.forward_mode,
        remove_caption: updates.remove_caption,
        add_watermark: updates.add_watermark,
        watermark_text: updates.watermark_text,
        delay_seconds: updates.delay_seconds,
        edit_message: updates.edit_message,
        message_template: updates.message_template,
        send_as_admin: updates.send_as_admin,
        preserve_formatting: updates.preserve_formatting,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Toggle rule active status
   */
  async toggleRule(id: string, isActive: boolean): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("livegram_rules")
      .update({ is_active: isActive })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Delete rule
   */
  async deleteRule(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("livegram_rules").delete().eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Get rule stats
   */
  async getRuleStats(ruleId: string): Promise<{
    data: {
      total_forwarded: number;
      success_count: number;
      failed_count: number;
      last_forwarded: string | null;
    } | null;
    error: string | null;
  }> {
    // Get rule stats
    const { data: rule } = await supabase
      .from("livegram_rules")
      .select("total_forwarded, last_forwarded_at")
      .eq("id", ruleId)
      .single();

    // Get logs count
    const { data: logs } = await supabase
      .from("livegram_logs")
      .select("status")
      .eq("rule_id", ruleId);

    const successCount = logs?.filter((l) => l.status === "sent").length || 0;
    const failedCount = logs?.filter((l) => l.status === "failed").length || 0;

    return {
      data: {
        total_forwarded: rule?.total_forwarded || 0,
        success_count: successCount,
        failed_count: failedCount,
        last_forwarded: rule?.last_forwarded_at || null,
      },
      error: null,
    };
  },

  /**
   * Get recent logs
   */
  async getRecentLogs(ruleId: string, limit = 50): Promise<{
    data: Tables<"livegram_logs">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("livegram_logs")
      .select("*")
      .eq("rule_id", ruleId)
      .order("forwarded_at", { ascending: false })
      .limit(limit);

    return { data, error: error?.message || null };
  },
};