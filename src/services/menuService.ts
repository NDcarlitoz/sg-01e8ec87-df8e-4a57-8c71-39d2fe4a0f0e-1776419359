import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ButtonType = "text" | "link" | "callback" | "submenu" | "command" | "page";
export type ActionType = "show_text" | "open_url" | "run_command" | "show_page";
export type PageType = "text" | "image" | "video" | "file" | "interactive";

export interface MenuItemInput {
  parent_id?: string;
  title: string;
  description?: string;
  position: number;
  icon?: string;
  button_type: ButtonType;
  action_type?: ActionType;
  action_value?: string;
  is_active?: boolean;
  show_in_main_menu?: boolean;
  requires_subscription?: boolean;
  metadata?: any;
}

export interface PageInput {
  title: string;
  content: string;
  page_type?: PageType;
  image_url?: string;
  video_url?: string;
  file_url?: string;
  buttons?: any;
  is_active?: boolean;
  show_back_button?: boolean;
  metadata?: any;
}

export const menuService = {
  /**
   * Get all menu items
   */
  async getMenuItems(): Promise<{
    data: Tables<"bot_menu_items">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("bot_menu_items")
      .select("*")
      .order("position", { ascending: true });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Get menu structure (with parent-child relationships)
   */
  async getMenuStructure(): Promise<{
    data: any[];
    error: string | null;
  }> {
    const { data, error } = await this.getMenuItems();
    if (error) return { data: [], error };

    // Build tree structure
    type MenuItemWithChildren = Tables<"bot_menu_items"> & { children: any[] };
    const itemsMap = new Map<string, MenuItemWithChildren>(
      data.map((item) => [item.id, { ...item, children: [] }])
    );
    const rootItems: any[] = [];

    itemsMap.forEach((item) => {
      if (item.parent_id && itemsMap.has(item.parent_id)) {
        itemsMap.get(item.parent_id)!.children.push(item);
      } else {
        rootItems.push(item);
      }
    });

    return { data: rootItems, error: null };
  },

  /**
   * Create menu item
   */
  async createMenuItem(input: MenuItemInput): Promise<{
    data: Tables<"bot_menu_items"> | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("bot_menu_items")
        .insert({
          parent_id: input.parent_id || null,
          title: input.title,
          description: input.description || null,
          position: input.position,
          icon: input.icon || null,
          button_type: input.button_type,
          action_type: input.action_type || null,
          action_value: input.action_value || null,
          is_active: input.is_active !== undefined ? input.is_active : true,
          show_in_main_menu: input.show_in_main_menu !== undefined ? input.show_in_main_menu : true,
          requires_subscription: input.requires_subscription || false,
          metadata: input.metadata || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Create menu item error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Create menu item exception:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to create menu item",
      };
    }
  },

  /**
   * Update menu item
   */
  async updateMenuItem(
    id: string,
    updates: Partial<MenuItemInput>
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("bot_menu_items")
        .update({
          parent_id: updates.parent_id !== undefined ? updates.parent_id || null : undefined,
          title: updates.title,
          description: updates.description !== undefined ? updates.description || null : undefined,
          position: updates.position,
          icon: updates.icon !== undefined ? updates.icon || null : undefined,
          button_type: updates.button_type,
          action_type: updates.action_type !== undefined ? updates.action_type || null : undefined,
          action_value: updates.action_value !== undefined ? updates.action_value || null : undefined,
          is_active: updates.is_active,
          show_in_main_menu: updates.show_in_main_menu,
          requires_subscription: updates.requires_subscription,
          metadata: updates.metadata !== undefined ? updates.metadata || null : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Update menu item error:", error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Update menu item exception:", error);
      return {
        error: error instanceof Error ? error.message : "Failed to update menu item",
      };
    }
  },

  /**
   * Delete menu item
   */
  async deleteMenuItem(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_menu_items")
      .delete()
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Reorder menu items
   */
  async reorderMenuItems(
    items: Array<{ id: string; position: number }>
  ): Promise<{ error: string | null }> {
    const updates = items.map((item) =>
      supabase
        .from("bot_menu_items")
        .update({ position: item.position })
        .eq("id", item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    return {
      error: errors.length > 0 ? errors.map((e) => e.error?.message).join(", ") : null,
    };
  },

  /**
   * Get all pages
   */
  async getPages(): Promise<{
    data: Tables<"bot_pages">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("bot_pages")
      .select("*")
      .order("created_at", { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Get page by ID
   */
  async getPage(id: string): Promise<{
    data: Tables<"bot_pages"> | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("bot_pages")
      .select("*")
      .eq("id", id)
      .single();

    return {
      data: data || null,
      error: error?.message || null,
    };
  },

  /**
   * Create page
   */
  async createPage(input: PageInput): Promise<{
    data: Tables<"bot_pages"> | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("bot_pages")
        .insert({
          title: input.title,
          content: input.content,
          page_type: input.page_type || "text",
          image_url: input.image_url || null,
          video_url: input.video_url || null,
          file_url: input.file_url || null,
          buttons: input.buttons || null,
          is_active: input.is_active !== undefined ? input.is_active : true,
          show_back_button: input.show_back_button !== undefined ? input.show_back_button : true,
          metadata: input.metadata || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Create page error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Create page exception:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to create page",
      };
    }
  },

  /**
   * Update page
   */
  async updatePage(
    id: string,
    updates: Partial<PageInput>
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("bot_pages")
        .update({
          title: updates.title,
          content: updates.content,
          page_type: updates.page_type,
          image_url: updates.image_url !== undefined ? updates.image_url || null : undefined,
          video_url: updates.video_url !== undefined ? updates.video_url || null : undefined,
          file_url: updates.file_url !== undefined ? updates.file_url || null : undefined,
          buttons: updates.buttons !== undefined ? updates.buttons || null : undefined,
          is_active: updates.is_active,
          show_back_button: updates.show_back_button,
          metadata: updates.metadata !== undefined ? updates.metadata || null : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Update page error:", error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Update page exception:", error);
      return {
        error: error instanceof Error ? error.message : "Failed to update page",
      };
    }
  },

  /**
   * Delete page
   */
  async deletePage(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("bot_pages")
      .delete()
      .eq("id", id);

    return { error: error?.message || null };
  },

  /**
   * Export menu configuration
   */
  async exportMenuConfig(): Promise<{
    data: {
      menu_items: Tables<"bot_menu_items">[];
      pages: Tables<"bot_pages">[];
    } | null;
    error: string | null;
  }> {
    const [menuRes, pagesRes] = await Promise.all([
      this.getMenuItems(),
      this.getPages(),
    ]);

    if (menuRes.error || pagesRes.error) {
      return {
        data: null,
        error: menuRes.error || pagesRes.error,
      };
    }

    return {
      data: {
        menu_items: menuRes.data,
        pages: pagesRes.data,
      },
      error: null,
    };
  },

  /**
   * Import menu configuration
   */
  async importMenuConfig(config: {
    menu_items: any[];
    pages: any[];
  }): Promise<{ error: string | null }> {
    // Clear existing data
    await supabase.from("bot_menu_items").delete().neq("id", "");
    await supabase.from("bot_pages").delete().neq("id", "");

    // Insert new data
    const [menuRes, pagesRes] = await Promise.all([
      supabase.from("bot_menu_items").insert(config.menu_items),
      supabase.from("bot_pages").insert(config.pages),
    ]);

    return {
      error: menuRes.error?.message || pagesRes.error?.message || null,
    };
  },
};