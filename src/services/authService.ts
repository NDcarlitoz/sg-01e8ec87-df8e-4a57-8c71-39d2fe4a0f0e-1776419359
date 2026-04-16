import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Get current authenticated user
 * Note: Prefer using useAuth() hook in components for cached session
 */
export const authService = {
  async getCurrentUser(): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { data: null, error: error.message };
      }

      return { data: user, error: null };
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async signIn(email: string, password: string): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.user, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async signUp(email: string, password: string, fullName?: string): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
          },
        },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.user, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Update password error:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Helper to get dynamic redirect URL for OAuth
   */
  getRedirectUrl(): string {
    if (typeof window === "undefined") {
      return "";
    }

    // For production, use the actual domain
    if (window.location.hostname === "mmautobot.it.com") {
      return "https://mmautobot.it.com";
    }

    // For development/preview, use current origin
    return window.location.origin;
  },
};