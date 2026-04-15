import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const leadService = {
  /**
   * Get all leads
   */
  async getLeads(): Promise<{
    data: (Tables<"leads"> & {
      source?: Tables<"lead_sources">;
      stage?: Tables<"lead_stages">;
    })[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("leads")
      .select(`
        *,
        source:lead_sources(*),
        stage:lead_stages(*)
      `)
      .order("created_at", { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Create new lead
   */
  async createLead(data: {
    telegram_user_id?: number;
    telegram_username?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    source_id?: string;
    stage_id?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    estimated_value?: number;
    tags?: string[];
  }): Promise<{ data: Tables<"leads"> | null; error: string | null }> {
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        telegram_user_id: data.telegram_user_id,
        telegram_username: data.telegram_username,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        source_id: data.source_id,
        stage_id: data.stage_id,
        priority: data.priority || "medium",
        estimated_value: data.estimated_value,
        tags: data.tags,
        status: "new",
      })
      .select()
      .single();

    return {
      data: lead || null,
      error: error?.message || null,
    };
  },

  /**
   * Update lead
   */
  async updateLead(
    leadId: string,
    updates: Partial<Tables<"leads">>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("leads")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    return { error: error?.message || null };
  },

  /**
   * Delete lead
   */
  async deleteLead(leadId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("leads").delete().eq("id", leadId);

    return { error: error?.message || null };
  },

  /**
   * Get lead notes
   */
  async getLeadNotes(
    leadId: string
  ): Promise<{
    data: (Tables<"lead_notes"> & { created_by_profile?: Tables<"profiles"> })[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("lead_notes")
      .select(`
        *,
        created_by_profile:profiles(*)
      `)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Add note to lead
   */
  async addLeadNote(data: {
    lead_id: string;
    created_by: string;
    note_type: "note" | "call" | "email" | "meeting" | "task";
    content: string;
  }): Promise<{ error: string | null }> {
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: data.lead_id,
      created_by: data.created_by,
      note_type: data.note_type,
      content: data.content,
    });

    // Update last contact time
    if (!error) {
      await this.updateLead(data.lead_id, {
        last_contact_at: new Date().toISOString(),
      });
    }

    return { error: error?.message || null };
  },

  /**
   * Get lead sources
   */
  async getLeadSources(): Promise<{
    data: Tables<"lead_sources">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("lead_sources")
      .select("*")
      .eq("is_active", true)
      .order("name");

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Get lead stages
   */
  async getLeadStages(): Promise<{
    data: Tables<"lead_stages">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("lead_stages")
      .select("*")
      .eq("is_active", true)
      .order("position");

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Move lead to stage
   */
  async moveLeadToStage(
    leadId: string,
    stageId: string
  ): Promise<{ error: string | null }> {
    return await this.updateLead(leadId, { stage_id: stageId });
  },

  /**
   * Get lead stats
   */
  async getLeadStats(): Promise<{
    data: {
      total_leads: number;
      new_leads: number;
      qualified_leads: number;
      converted_leads: number;
      total_value: number;
    } | null;
    error: string | null;
  }> {
    const { data: leads } = await this.getLeads();

    const totalValue = leads.reduce(
      (sum, l) => sum + (l.estimated_value || 0),
      0
    );

    return {
      data: {
        total_leads: leads.length,
        new_leads: leads.filter((l) => l.status === "new").length,
        qualified_leads: leads.filter((l) => l.status === "qualified").length,
        converted_leads: leads.filter((l) => l.status === "won").length,
        total_value: totalValue,
      },
      error: null,
    };
  },

  /**
   * Search leads
   */
  async searchLeads(
    query: string
  ): Promise<{
    data: Tables<"leads">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company.ilike.%${query}%,telegram_username.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },
};