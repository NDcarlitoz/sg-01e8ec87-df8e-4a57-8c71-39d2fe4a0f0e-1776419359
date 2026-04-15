import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { TelegramButton } from "./telegramService";

export const templateService = {
  /**
   * Get all templates for current user
   */
  async getTemplates(): Promise<{
    data: Tables<"broadcast_templates">[] | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("broadcast_templates")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error: error?.message || null };
  },

  /**
   * Create new template
   */
  async createTemplate(templateData: {
    name: string;
    message: string;
    caption?: string;
    media_type?: string;
    buttons?: TelegramButton[][];
  }): Promise<{
    data: Tables<"broadcast_templates"> | null;
    error: string | null;
  }> {
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;

    if (!userId) {
      return { data: null, error: "Authentication required" };
    }

    const { data, error } = await supabase
      .from("broadcast_templates")
      .insert({
        user_id: userId,
        name: templateData.name,
        message: templateData.message,
        caption: templateData.caption,
        media_type: templateData.media_type || "text",
        buttons: templateData.buttons as any,
      })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Update existing template
   */
  async updateTemplate(
    id: string,
    templateData: {
      name: string;
      message: string;
      caption?: string;
      media_type?: string;
      buttons?: TelegramButton[][];
    }
  ): Promise<{
    data: Tables<"broadcast_templates"> | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("broadcast_templates")
      .update({
        name: templateData.name,
        message: templateData.message,
        caption: templateData.caption,
        media_type: templateData.media_type,
        buttons: templateData.buttons as any,
      })
      .eq("id", id)
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("broadcast_templates")
      .delete()
      .eq("id", id);

    return { error: error?.message || null };
  },
};