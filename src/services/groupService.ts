import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const groupService = {
  /**
   * Get all bot groups for current owner
   */
  async getGroups(): Promise<{
    data: Tables<"bot_groups">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("bot_groups")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Add or update group
   */
  async upsertGroup(groupData: {
    chat_id: number;
    title: string;
    type: string;
    username?: string;
    member_count?: number;
    description?: string;
  }): Promise<{ data: Tables<"bot_groups"> | null; error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const ownerId = authData.session?.user.id;

    if (!ownerId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("bot_groups")
      .upsert({
        chat_id: groupData.chat_id,
        title: groupData.title,
        type: groupData.type,
        username: groupData.username,
        member_count: groupData.member_count,
        description: groupData.description,
        owner_id: ownerId,
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Delete group
   */
  async deleteGroup(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("bot_groups").delete().eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Toggle group active status
   */
  async toggleGroupStatus(
    id: string,
    isActive: boolean
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_groups")
      .update({ is_active: isActive })
      .eq("id", id);

    return { error: error?.message || null };
  },
};