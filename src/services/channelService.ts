import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Channel = Tables<"channels">;

interface CreateChannelData {
  channel_name: string;
  channel_username: string;
  channel_id: string;
  description?: string;
  subscriber_count?: number;
}

interface UpdateChannelData {
  channel_name?: string;
  channel_username?: string;
  description?: string;
  subscriber_count?: number;
  is_active?: boolean;
}

export const channelService = {
  async getChannels() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    console.log("getChannels:", { data, error });
    return { data, error };
  },

  async createChannel(channelData: CreateChannelData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("channels")
      .insert({
        user_id: user.id,
        ...channelData,
      })
      .select()
      .single();

    console.log("createChannel:", { data, error });
    return { data, error };
  },

  async updateChannel(id: string, updates: UpdateChannelData) {
    const { data, error } = await supabase
      .from("channels")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("updateChannel:", { data, error });
    return { data, error };
  },

  async deleteChannel(id: string) {
    const { error } = await supabase
      .from("channels")
      .delete()
      .eq("id", id);

    console.log("deleteChannel:", { error });
    return { error };
  },

  async toggleChannelStatus(id: string, isActive: boolean) {
    return this.updateChannel(id, { is_active: isActive });
  },

  // Validate Telegram channel username format (@channelname)
  validateChannelUsername(username: string): boolean {
    const usernameRegex = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
    return usernameRegex.test(username);
  },

  // Validate Telegram channel ID (numeric or with -100 prefix)
  validateChannelId(id: string): boolean {
    const idRegex = /^-?\d+$/;
    return idRegex.test(id);
  },
};