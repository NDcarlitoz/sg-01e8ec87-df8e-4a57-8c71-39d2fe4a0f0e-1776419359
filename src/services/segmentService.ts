import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface SegmentFilter {
  field: string;
  operator: string;
  value: any;
}

export const segmentService = {
  /**
   * Get all segments
   */
  async getSegments(): Promise<{
    data: Tables<"user_segments">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("user_segments")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: data || [], error: error?.message || null };
  },

  /**
   * Create new segment
   */
  async createSegment(segmentData: {
    name: string;
    description?: string;
    filter_conditions: SegmentFilter[];
  }): Promise<{
    data: Tables<"user_segments"> | null;
    error: string | null;
  }> {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;

    if (!userId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("user_segments")
      .insert({
        user_id: userId,
        name: segmentData.name,
        description: segmentData.description,
        filter_conditions: segmentData.filter_conditions as any,
        is_active: true,
      })
      .select()
      .single();

    if (data) {
      // Update member count
      await this.updateSegmentCount(data.id);
    }

    return { data, error: error?.message || null };
  },

  /**
   * Update segment
   */
  async updateSegment(
    id: string,
    segmentData: {
      name?: string;
      description?: string;
      filter_conditions?: SegmentFilter[];
      is_active?: boolean;
    }
  ): Promise<{
    data: Tables<"user_segments"> | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("user_segments")
      .update({
        ...segmentData,
        filter_conditions: segmentData.filter_conditions as any,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (data && segmentData.filter_conditions) {
      // Update member count if filters changed
      await this.updateSegmentCount(data.id);
    }

    return { data, error: error?.message || null };
  },

  /**
   * Delete segment
   */
  async deleteSegment(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("user_segments")
      .delete()
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Get segment members
   */
  async getSegmentMembers(
    segmentId: string
  ): Promise<{
    data: Tables<"bot_users">[];
    error: string | null;
  }> {
    // Get segment filters
    const { data: segment, error: segmentError } = await supabase
      .from("user_segments")
      .select("filter_conditions")
      .eq("id", segmentId)
      .single();

    if (segmentError || !segment) {
      return { data: [], error: segmentError?.message || "Segment not found" };
    }

    const filters = segment.filter_conditions as SegmentFilter[];

    // Build query based on filters
    let query = supabase.from("bot_users").select("*");

    for (const filter of filters) {
      switch (filter.operator) {
        case "equals":
          query = query.eq(filter.field, filter.value);
          break;
        case "not_equals":
          query = query.neq(filter.field, filter.value);
          break;
        case "contains":
          if (filter.field === "tags") {
            query = query.contains(filter.field, [filter.value]);
          } else {
            query = query.ilike(filter.field, `%${filter.value}%`);
          }
          break;
        case "greater_than":
          query = query.gt(filter.field, filter.value);
          break;
        case "less_than":
          query = query.lt(filter.field, filter.value);
          break;
        case "is_null":
          query = query.is(filter.field, null);
          break;
        case "is_not_null":
          query = query.not(filter.field, "is", null);
          break;
      }
    }

    const { data, error } = await query;

    return { data: data || [], error: error?.message || null };
  },

  /**
   * Update segment member count
   */
  async updateSegmentCount(segmentId: string): Promise<void> {
    const { data: members } = await this.getSegmentMembers(segmentId);

    await supabase
      .from("user_segments")
      .update({
        member_count: members?.length || 0,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", segmentId);
  },

  /**
   * Add tag to user
   */
  async addUserTag(
    userId: string,
    tag: string
  ): Promise<{ error: string | null }> {
    const { data: user } = await supabase
      .from("bot_users")
      .select("tags")
      .eq("user_id", userId)
      .single();

    if (!user) {
      return { error: "User not found" };
    }

    const currentTags = (user.tags as string[]) || [];
    if (currentTags.includes(tag)) {
      return { error: null }; // Tag already exists
    }

    const { error } = await supabase
      .from("bot_users")
      .update({ tags: [...currentTags, tag] })
      .eq("user_id", userId);

    return { error: error?.message || null };
  },

  /**
   * Remove tag from user
   */
  async removeUserTag(
    userId: string,
    tag: string
  ): Promise<{ error: string | null }> {
    const { data: user } = await supabase
      .from("bot_users")
      .select("tags")
      .eq("user_id", userId)
      .single();

    if (!user) {
      return { error: "User not found" };
    }

    const currentTags = (user.tags as string[]) || [];
    const newTags = currentTags.filter((t) => t !== tag);

    const { error } = await supabase
      .from("bot_users")
      .update({ tags: newTags })
      .eq("user_id", userId);

    return { error: error?.message || null };
  },

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<{ data: string[]; error: string | null }> {
    const { data: users, error } = await supabase
      .from("bot_users")
      .select("tags");

    if (error) {
      return { data: [], error: error.message };
    }

    const allTags = new Set<string>();
    users?.forEach((user) => {
      const tags = (user.tags as string[]) || [];
      tags.forEach((tag) => allTags.add(tag));
    });

    return { data: Array.from(allTags), error: null };
  },
};