import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export const profileService = {
  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<{ data: Profile | null; error: string | null }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: userError?.message || "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Get profile error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Get profile error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get profile by explicit user ID (avoids extra auth calls)
   */
  async getProfileById(userId: string): Promise<{ data: Profile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Get profile by id error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Get profile by id error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    updates: Partial<Profile>
  ): Promise<{ data: Profile | null; error: string | null }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: userError?.message || "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Update profile error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File): Promise<{ data: string | null; error: string | null }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: userError?.message || "User not authenticated" };
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);

      if (uploadError) {
        console.error("Upload avatar error:", uploadError);
        return { data: null, error: uploadError.message };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      await this.updateProfile({ avatar_url: publicUrl });

      return { data: publicUrl, error: null };
    } catch (error) {
      console.error("Upload avatar error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};