import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const userService = {
  /**
   * Get all bot users for current owner
   */
  async getUsers(): Promise<{
    data: Tables<"bot_users">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("bot_users")
      .select("*")
      .order("last_interaction", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Add or update user
   */
  async upsertUser(userData: {
    user_id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    is_bot?: boolean;
    language_code?: string;
  }): Promise<{ data: Tables<"bot_users"> | null; error: string | null }> {
    const { data: authData } = await supabase.auth.getSession();
    const ownerId = authData.session?.user.id;

    if (!ownerId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("bot_users")
      .upsert({
        user_id: userData.user_id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_bot: userData.is_bot || false,
        language_code: userData.language_code,
        owner_id: ownerId,
        last_interaction: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("bot_users").delete().eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(
    id: string,
    isActive: boolean
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_users")
      .update({ is_active: isActive })
      .eq("id", id);

    return { error: error?.message || null };
  },
};