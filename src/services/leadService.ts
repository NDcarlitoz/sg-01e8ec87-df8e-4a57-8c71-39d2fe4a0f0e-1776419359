import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const leadService = {
  /**
   * Get all leads with related data
   */
  async getLeads(filters?: {
    status?: string;
    priority?: string;
    source_id?: string;
    stage_id?: string;
    assigned_to?: string;
    tags?: string[];
  }): Promise<{
    data: (Tables<"leads"> & {
      source?: Tables<"lead_sources">;
      stage?: Tables<"lead_stages">;
      assigned_to_profile?: Tables<"profiles">;
    })[];
    error: string | null;
  }> {
    let query = supabase
      .from("leads")
      .select(`
        *,
        source:lead_sources(*),
        stage:lead_stages(*),
        assigned_to_profile:profiles!leads_assigned_to_fkey(*)
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters?.source_id) {
      query = query.eq("source_id", filters.source_id);
    }
    if (filters?.stage_id) {
      query = query.eq("stage_id", filters.stage_id);
    }
    if (filters?.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains("tags", filters.tags);
    }

    const { data, error } = await query;

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Get single lead with full details
   */
  async getLead(leadId: string): Promise<{
    data: (Tables<"leads"> & {
      source?: Tables<"lead_sources">;
      stage?: Tables<"lead_stages">;
      assigned_to_profile?: Tables<"profiles">;
    }) | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("leads")
      .select(`
        *,
        source:lead_sources(*),
        stage:lead_stages(*),
        assigned_to_profile:profiles!leads_assigned_to_fkey(*)
      `)
      .eq("id", leadId)
      .single();

    return {
      data: data || null,
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
    assigned_to?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    metadata?: any;
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
        assigned_to: data.assigned_to,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        metadata: data.metadata,
        status: "new",
      })
      .select()
      .single();

    // Create activity
    if (lead) {
      await this.addActivity(lead.id, {
        activity_type: "created",
        title: "Lead created",
        description: `New lead added: ${data.full_name || data.telegram_username || "Unknown"}`,
      });
    }

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
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    status: string,
    userId?: string
  ): Promise<{ error: string | null }> {
    const { error } = await this.updateLead(leadId, { status: status as any });

    if (!error) {
      await this.addActivity(leadId, {
        activity_type: "status_changed",
        title: `Status changed to ${status}`,
        description: `Lead status updated to ${status}`,
        created_by: userId,
      });
    }

    return { error };
  },

  /**
   * Assign lead to user
   */
  async assignLead(
    leadId: string,
    assignedTo: string,
    userId?: string
  ): Promise<{ error: string | null }> {
    const { error } = await this.updateLead(leadId, { assigned_to: assignedTo });

    if (!error) {
      await this.addActivity(leadId, {
        activity_type: "assigned",
        title: "Lead assigned",
        description: `Lead assigned to team member`,
        created_by: userId,
        metadata: { assigned_to: assignedTo },
      });
    }

    return { error };
  },

  /**
   * Delete lead
   */
  async deleteLead(leadId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("leads").delete().eq("id", leadId);

    return { error: error?.message || null };
  },

  /**
   * Get lead activities/timeline
   */
  async getLeadActivities(
    leadId: string
  ): Promise<{
    data: (Tables<"lead_activities"> & { created_by_profile?: Tables<"profiles"> })[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("lead_activities")
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
   * Add activity to lead
   */
  async addActivity(
    leadId: string,
    data: {
      activity_type: string;
      title: string;
      description?: string;
      created_by?: string;
      metadata?: any;
    }
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: data.activity_type,
      title: data.title,
      description: data.description,
      created_by: data.created_by,
      metadata: data.metadata,
    });

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

    // Add activity
    if (!error) {
      await this.addActivity(data.lead_id, {
        activity_type: "note_added",
        title: `${data.note_type} note added`,
        description: data.content.substring(0, 100),
        created_by: data.created_by,
      });

      // Update last contact
      await this.updateLead(data.lead_id, {
        last_contact_at: new Date().toISOString(),
      });
    }

    return { error: error?.message || null };
  },

  /**
   * Get lead tasks
   */
  async getLeadTasks(
    leadId: string
  ): Promise<{
    data: (Tables<"lead_tasks"> & {
      created_by_profile?: Tables<"profiles">;
      assigned_to_profile?: Tables<"profiles">;
    })[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("lead_tasks")
      .select(`
        *,
        created_by_profile:profiles!lead_tasks_created_by_fkey(*),
        assigned_to_profile:profiles!lead_tasks_assigned_to_fkey(*)
      `)
      .eq("lead_id", leadId)
      .order("due_date", { ascending: true, nullsFirst: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Create task for lead
   */
  async createLeadTask(data: {
    lead_id: string;
    created_by: string;
    assigned_to?: string;
    title: string;
    description?: string;
    due_date?: string;
    priority?: "low" | "medium" | "high" | "urgent";
  }): Promise<{ error: string | null }> {
    const { error } = await supabase.from("lead_tasks").insert({
      lead_id: data.lead_id,
      created_by: data.created_by,
      assigned_to: data.assigned_to,
      title: data.title,
      description: data.description,
      due_date: data.due_date,
      priority: data.priority || "medium",
      status: "pending",
    });

    // Add activity
    if (!error) {
      await this.addActivity(data.lead_id, {
        activity_type: "task_created",
        title: "Task created",
        description: data.title,
        created_by: data.created_by,
      });
    }

    return { error: error?.message || null };
  },

  /**
   * Complete task
   */
  async completeTask(taskId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("lead_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

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
    stageId: string,
    userId?: string
  ): Promise<{ error: string | null }> {
    const { error } = await this.updateLead(leadId, { stage_id: stageId });

    if (!error) {
      await this.addActivity(leadId, {
        activity_type: "stage_changed",
        title: "Stage changed",
        description: `Lead moved to new stage`,
        created_by: userId,
        metadata: { stage_id: stageId },
      });
    }

    return { error };
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
      by_status: { [key: string]: number };
      by_source: { source: string; count: number }[];
      by_priority: { [key: string]: number };
    } | null;
    error: string | null;
  }> {
    const { data: leads, error } = await this.getLeads();

    if (error || !leads) {
      return { data: null, error };
    }

    const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

    const byStatus = leads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const byPriority = leads.reduce((acc, l) => {
      acc[l.priority || "medium"] = (acc[l.priority || "medium"] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const sourceGroups = leads.reduce((acc, l) => {
      const source = l.source?.name || "Unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const bySource = Object.entries(sourceGroups).map(([source, count]) => ({
      source,
      count: count as number,
    }));

    return {
      data: {
        total_leads: leads.length,
        new_leads: byStatus.new || 0,
        qualified_leads: byStatus.qualified || 0,
        converted_leads: byStatus.won || 0,
        total_value: totalValue,
        by_status: byStatus,
        by_source: bySource,
        by_priority: byPriority,
      },
      error: null,
    };
  },

  /**
   * Search leads
   */
  async searchLeads(query: string): Promise<{
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

  /**
   * Add tags to lead
   */
  async addTags(
    leadId: string,
    tags: string[],
    userId?: string
  ): Promise<{ error: string | null }> {
    const { data: lead } = await this.getLead(leadId);
    if (!lead) return { error: "Lead not found" };

    const currentTags = lead.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];

    const { error } = await this.updateLead(leadId, { tags: newTags });

    if (!error) {
      for (const tag of tags) {
        await this.addActivity(leadId, {
          activity_type: "tag_added",
          title: "Tag added",
          description: `Tag "${tag}" added`,
          created_by: userId,
        });
      }
    }

    return { error };
  },

  /**
   * Remove tag from lead
   */
  async removeTag(
    leadId: string,
    tag: string,
    userId?: string
  ): Promise<{ error: string | null }> {
    const { data: lead } = await this.getLead(leadId);
    if (!lead) return { error: "Lead not found" };

    const currentTags = lead.tags || [];
    const newTags = currentTags.filter((t) => t !== tag);

    const { error } = await this.updateLead(leadId, { tags: newTags });

    if (!error) {
      await this.addActivity(leadId, {
        activity_type: "tag_removed",
        title: "Tag removed",
        description: `Tag "${tag}" removed`,
        created_by: userId,
      });
    }

    return { error };
  },

  /**
   * Bulk update leads
   */
  async bulkUpdateLeads(
    leadIds: string[],
    updates: {
      status?: string;
      stage_id?: string;
      assigned_to?: string;
      tags?: string[];
    }
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("leads")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", leadIds);

    return { error: error?.message || null };
  },
};