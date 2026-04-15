import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type UserFilter = {
  status?: "all" | "active" | "inactive" | "blocked" | "premium";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type UserInput = {
  user_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  language_code?: string;
  is_bot?: boolean;
  is_active?: boolean;
  is_blocked?: boolean;
  is_premium?: boolean;
  notes?: string;
  tags?: string[];
};

export type InteractionInput = {
  bot_user_id: string;
  interaction_type: string;
  content?: string;
  metadata?: any;
};

export const userService = {
  /**
   * Get all bot users with filters
   */
  async getUsers(filters?: UserFilter): Promise<{
    data: Tables<"bot_users">[];
    error: string | null;
  }> {
    let query = supabase
      .from("bot_users")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      if (filters.status === "active") {
        query = query.eq("is_active", true).eq("is_blocked", false);
      } else if (filters.status === "inactive") {
        query = query.eq("is_active", false);
      } else if (filters.status === "blocked") {
        query = query.eq("is_blocked", true);
      } else if (filters.status === "premium") {
        query = query.eq("is_premium", true);
      }
    }

    // Search filter
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      query = query.or(
        `username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%,phone_number.ilike.%${search}%,user_id.eq.${parseInt(search) || 0}`
      );
    }

    // Date range filter
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    const { data, error } = await query;

    return { 
      data: data || [], 
      error: error?.message || null 
    };
  },

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<{
    data: Tables<"bot_users"> | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("bot_users")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    data: {
      total: number;
      active: number;
      inactive: number;
      blocked: number;
      premium: number;
      new_today: number;
      new_week: number;
    } | null;
    error: string | null;
  }> {
    const { data: users, error } = await this.getUsers();
    
    if (error) return { data: null, error };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: users.length,
      active: users.filter(u => u.is_active && !u.is_blocked).length,
      inactive: users.filter(u => !u.is_active).length,
      blocked: users.filter(u => u.is_blocked).length,
      premium: users.filter(u => u.is_premium).length,
      new_today: users.filter(u => new Date(u.created_at) >= today).length,
      new_week: users.filter(u => new Date(u.created_at) >= weekAgo).length,
    };

    return { data: stats, error: null };
  },

  /**
   * Create new user
   */
  async createUser(userData: UserInput): Promise<{
    data: Tables<"bot_users"> | null;
    error: string | null;
  }> {
    const { data: authData } = await supabase.auth.getSession();
    const ownerId = authData.session?.user.id;

    if (!ownerId) {
      return { data: null, error: "Authentication required" };
    }

    // Check if user_id already exists
    const { data: existing } = await supabase
      .from("bot_users")
      .select("id")
      .eq("user_id", userData.user_id)
      .eq("owner_id", ownerId)
      .single();

    if (existing) {
      return { data: null, error: "User ID already exists" };
    }

    const { data, error } = await supabase
      .from("bot_users")
      .insert({
        ...userData,
        owner_id: ownerId,
        created_at: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Update user
   */
  async updateUser(
    id: string,
    updates: Partial<UserInput>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_users")
      .delete()
      .eq("id", id);

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
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Block/unblock user
   */
  async toggleBlockStatus(
    id: string,
    isBlocked: boolean
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_users")
      .update({ 
        is_blocked: isBlocked,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Toggle premium status
   */
  async togglePremiumStatus(
    id: string,
    isPremium: boolean
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_users")
      .update({ 
        is_premium: isPremium,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Get user interactions/activity
   */
  async getUserInteractions(botUserId: string): Promise<{
    data: Tables<"user_interactions">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("user_interactions")
      .select("*")
      .eq("bot_user_id", botUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    return { 
      data: data || [], 
      error: error?.message || null 
    };
  },

  /**
   * Add user interaction
   */
  async addInteraction(interaction: InteractionInput): Promise<{
    error: string | null;
  }> {
    const { error } = await supabase
      .from("user_interactions")
      .insert(interaction);

    return { error: error?.message || null };
  },

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<UserInput>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", userIds);

    return { error: error?.message || null };
  },

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(userIds: string[]): Promise<{
    error: string | null;
  }> {
    const { error } = await supabase
      .from("bot_users")
      .delete()
      .in("id", userIds);

    return { error: error?.message || null };
  },

  /**
   * Export users to CSV
   */
  async exportUsers(filters?: UserFilter): Promise<{
    data: string | null;
    error: string | null;
  }> {
    const { data: users, error } = await this.getUsers(filters);
    
    if (error) return { data: null, error };

    const headers = [
      "User ID",
      "Username",
      "Full Name",
      "Phone",
      "Status",
      "Premium",
      "Language",
      "Created",
      "Last Seen"
    ];

    const rows = users.map(u => [
      u.user_id.toString(),
      u.username || "-",
      u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "-",
      u.phone_number || "-",
      u.is_blocked ? "Blocked" : u.is_active ? "Active" : "Inactive",
      u.is_premium ? "Yes" : "No",
      u.language_code || "-",
      new Date(u.created_at).toLocaleDateString(),
      u.last_seen ? new Date(u.last_seen).toLocaleDateString() : "-",
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    return { data: csv, error: null };
  },
};