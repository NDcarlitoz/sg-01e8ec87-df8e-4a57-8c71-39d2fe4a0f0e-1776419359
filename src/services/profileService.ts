import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export const profileService = {
  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<{ data: Profile | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return { data, error };
  },

  /**
   * Update current user's profile
   */
  async updateProfile(updates: {
    full_name?: string;
    avatar_url?: string;
  }): Promise<{ data: Profile | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Upload avatar image to Supabase Storage
   */
  async uploadAvatar(file: File): Promise<{ data: string | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    // Create unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return { data: publicUrl, error: null };
  },

  /**
   * Create profile for new user
   */
  async createProfile(userId: string, email: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
      })
      .select()
      .single();

    return { data, error };
  },
};