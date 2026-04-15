 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_commissions: {
        Row: {
          affiliate_id: string | null
          amount: number
          approved_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          paid_at: string | null
          referral_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          amount: number
          approved_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          approved_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          admin_note: string | null
          affiliate_id: string | null
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          payment_details: Json | null
          payment_method: string
          requested_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          affiliate_id?: string | null
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_details?: Json | null
          payment_method: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          affiliate_id?: string | null
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_programs: {
        Row: {
          commission_type: string
          commission_value: number
          cookie_duration_days: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_payout_amount: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          commission_type: string
          commission_value: number
          cookie_duration_days?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_payout_amount?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          commission_type?: string
          commission_value?: number
          cookie_duration_days?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_payout_amount?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_user_id: number
          referred_username: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_user_id: number
          referred_username?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: number
          referred_username?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          lifetime_payouts: number | null
          pending_payout: number | null
          program_id: string | null
          referral_code: string
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          lifetime_payouts?: number | null
          pending_payout?: number | null
          program_id?: string | null
          referral_code: string
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          lifetime_payouts?: number | null
          pending_payout?: number | null
          program_id?: string | null
          referral_code?: string
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_reply_rules: {
        Row: {
          created_at: string | null
          delay_seconds: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          match_case_sensitive: boolean | null
          match_whole_word: boolean | null
          priority: number | null
          response_buttons: Json | null
          response_caption: string | null
          response_media_url: string | null
          response_message: string | null
          response_type: string
          title: string
          trigger_type: string
          trigger_value: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delay_seconds?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          match_case_sensitive?: boolean | null
          match_whole_word?: boolean | null
          priority?: number | null
          response_buttons?: Json | null
          response_caption?: string | null
          response_media_url?: string | null
          response_message?: string | null
          response_type?: string
          title: string
          trigger_type: string
          trigger_value: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delay_seconds?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          match_case_sensitive?: boolean | null
          match_whole_word?: boolean | null
          priority?: number | null
          response_buttons?: Json | null
          response_caption?: string | null
          response_media_url?: string | null
          response_message?: string | null
          response_type?: string
          title?: string
          trigger_type?: string
          trigger_value?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          action: string
          case_sensitive: boolean | null
          created_at: string | null
          group_id: string
          id: string
          is_regex: boolean | null
          owner_id: string
          word: string
        }
        Insert: {
          action?: string
          case_sensitive?: boolean | null
          created_at?: string | null
          group_id: string
          id?: string
          is_regex?: boolean | null
          owner_id: string
          word: string
        }
        Update: {
          action?: string
          case_sensitive?: boolean | null
          created_at?: string | null
          group_id?: string
          id?: string
          is_regex?: boolean | null
          owner_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "banned_words_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bot_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banned_words_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_groups: {
        Row: {
          chat_id: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          member_count: number | null
          owner_id: string
          title: string
          type: string
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          owner_id: string
          title: string
          type: string
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          owner_id?: string
          title?: string
          type?: string
          username?: string | null
        }
        Relationships: []
      }
      bot_tokens: {
        Row: {
          bot_name: string
          bot_token: string
          bot_username: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bot_name: string
          bot_token: string
          bot_username?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bot_name?: string
          bot_token?: string
          bot_username?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_users: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          is_bot: boolean | null
          language_code: string | null
          last_interaction: string | null
          last_name: string | null
          owner_id: string
          tags: string[] | null
          user_id: number
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_bot?: boolean | null
          language_code?: string | null
          last_interaction?: string | null
          last_name?: string | null
          owner_id: string
          tags?: string[] | null
          user_id: number
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_bot?: boolean | null
          language_code?: string | null
          last_interaction?: string | null
          last_name?: string | null
          owner_id?: string
          tags?: string[] | null
          user_id?: number
          username?: string | null
        }
        Relationships: []
      }
      broadcast_templates: {
        Row: {
          buttons: Json | null
          caption: string | null
          created_at: string | null
          id: string
          media_filename: string | null
          media_type: string
          media_url: string | null
          message: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          buttons?: Json | null
          caption?: string | null
          created_at?: string | null
          id?: string
          media_filename?: string | null
          media_type?: string
          media_url?: string | null
          message: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          buttons?: Json | null
          caption?: string | null
          created_at?: string | null
          id?: string
          media_filename?: string | null
          media_type?: string
          media_url?: string | null
          message?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          buttons: Json | null
          caption: string | null
          created_at: string | null
          failed_count: number | null
          id: string
          media_filename: string | null
          media_type: string | null
          media_url: string | null
          message: string
          pin_message: boolean | null
          pin_status: Json | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          target_ids: string[] | null
          target_type: string
          title: string
          total_recipients: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          buttons?: Json | null
          caption?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          media_filename?: string | null
          media_type?: string | null
          media_url?: string | null
          message: string
          pin_message?: boolean | null
          pin_status?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          target_ids?: string[] | null
          target_type: string
          title: string
          total_recipients?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          buttons?: Json | null
          caption?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          media_filename?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string
          pin_message?: boolean | null
          pin_status?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          target_ids?: string[] | null
          target_type?: string
          title?: string
          total_recipients?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          channel_id: string
          channel_name: string
          channel_username: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          subscriber_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          channel_name: string
          channel_username: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          subscriber_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          channel_name?: string
          channel_username?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          subscriber_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      force_join_channels: {
        Row: {
          channel_id: string
          created_at: string | null
          group_id: string
          id: string
          is_required: boolean | null
          owner_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          group_id: string
          id?: string
          is_required?: boolean | null
          owner_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          group_id?: string
          id?: string
          is_required?: boolean | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "force_join_channels_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "force_join_channels_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bot_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "force_join_channels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_boost_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          group_id: string
          id: string
          required_invites: number | null
          unlock_message: string | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          group_id: string
          id?: string
          required_invites?: number | null
          unlock_message?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          group_id?: string
          id?: string
          required_invites?: number | null
          unlock_message?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_boost_settings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "bot_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_moderation_settings: {
        Row: {
          auto_ban_enabled: boolean | null
          auto_delete_enabled: boolean | null
          auto_kick_enabled: boolean | null
          ban_after_violations: number | null
          created_at: string | null
          delete_join_messages: boolean | null
          delete_spam_messages: boolean | null
          filter_forwards: boolean | null
          filter_links: boolean | null
          filter_media: boolean | null
          filter_mentions: boolean | null
          force_join_enabled: boolean | null
          force_join_message: string | null
          group_id: string
          id: string
          kick_after_violations: number | null
          kick_non_members: boolean | null
          max_messages_per_minute: number | null
          new_member_mute_duration: number | null
          owner_id: string
          restrict_new_members: boolean | null
          updated_at: string | null
          violation_reset_hours: number | null
        }
        Insert: {
          auto_ban_enabled?: boolean | null
          auto_delete_enabled?: boolean | null
          auto_kick_enabled?: boolean | null
          ban_after_violations?: number | null
          created_at?: string | null
          delete_join_messages?: boolean | null
          delete_spam_messages?: boolean | null
          filter_forwards?: boolean | null
          filter_links?: boolean | null
          filter_media?: boolean | null
          filter_mentions?: boolean | null
          force_join_enabled?: boolean | null
          force_join_message?: string | null
          group_id: string
          id?: string
          kick_after_violations?: number | null
          kick_non_members?: boolean | null
          max_messages_per_minute?: number | null
          new_member_mute_duration?: number | null
          owner_id: string
          restrict_new_members?: boolean | null
          updated_at?: string | null
          violation_reset_hours?: number | null
        }
        Update: {
          auto_ban_enabled?: boolean | null
          auto_delete_enabled?: boolean | null
          auto_kick_enabled?: boolean | null
          ban_after_violations?: number | null
          created_at?: string | null
          delete_join_messages?: boolean | null
          delete_spam_messages?: boolean | null
          filter_forwards?: boolean | null
          filter_links?: boolean | null
          filter_media?: boolean | null
          filter_mentions?: boolean | null
          force_join_enabled?: boolean | null
          force_join_message?: string | null
          group_id?: string
          id?: string
          kick_after_violations?: number | null
          kick_non_members?: boolean | null
          max_messages_per_minute?: number | null
          new_member_mute_duration?: number | null
          owner_id?: string
          restrict_new_members?: boolean | null
          updated_at?: string | null
          violation_reset_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_moderation_settings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "bot_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_moderation_settings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_pinned: boolean | null
          lead_id: string | null
          note_type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          lead_id?: string | null
          note_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          lead_id?: string | null
          note_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      lead_stages: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          converted_at: string | null
          created_at: string | null
          currency: string | null
          custom_fields: Json | null
          email: string | null
          estimated_value: number | null
          full_name: string | null
          id: string
          last_contact_at: string | null
          next_followup_at: string | null
          phone: string | null
          priority: string | null
          source_id: string | null
          stage_id: string | null
          status: string | null
          tags: string[] | null
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          converted_at?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          email?: string | null
          estimated_value?: number | null
          full_name?: string | null
          id?: string
          last_contact_at?: string | null
          next_followup_at?: string | null
          phone?: string | null
          priority?: string | null
          source_id?: string | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          converted_at?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          email?: string | null
          estimated_value?: number | null
          full_name?: string | null
          id?: string
          last_contact_at?: string | null
          next_followup_at?: string | null
          phone?: string | null
          priority?: string | null
          source_id?: string | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "lead_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_forwards: {
        Row: {
          created_at: string | null
          failed_count: number | null
          forward_results: Json | null
          forwarded_count: number | null
          id: string
          scheduled_at: string | null
          source_chat_id: string
          source_message_id: number
          status: string
          target_ids: string[]
          target_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_count?: number | null
          forward_results?: Json | null
          forwarded_count?: number | null
          id?: string
          scheduled_at?: string | null
          source_chat_id: string
          source_message_id: number
          status?: string
          target_ids?: string[]
          target_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_count?: number | null
          forward_results?: Json | null
          forwarded_count?: number | null
          id?: string
          scheduled_at?: string | null
          source_chat_id?: string
          source_message_id?: number
          status?: string
          target_ids?: string[]
          target_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          action: string
          group_id: string
          id: string
          message_text: string | null
          performed_at: string | null
          reason: string
          triggered_by: string | null
          user_id: number
          username: string | null
        }
        Insert: {
          action: string
          group_id: string
          id?: string
          message_text?: string | null
          performed_at?: string | null
          reason: string
          triggered_by?: string | null
          user_id: number
          username?: string | null
        }
        Update: {
          action?: string
          group_id?: string
          id?: string
          message_text?: string | null
          performed_at?: string | null
          reason?: string
          triggered_by?: string | null
          user_id?: number
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bot_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_invite_tracking: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          invites_count: number | null
          is_unlocked: boolean | null
          unlocked_at: string | null
          updated_at: string | null
          user_id: number
          username: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          invites_count?: number | null
          is_unlocked?: boolean | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: number
          username?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          invites_count?: number | null
          is_unlocked?: boolean | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: number
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invite_tracking_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bot_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_segments: {
        Row: {
          created_at: string | null
          description: string | null
          filter_conditions: Json
          id: string
          is_active: boolean | null
          last_updated_at: string | null
          member_count: number | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          filter_conditions?: Json
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          member_count?: number | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          filter_conditions?: Json
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          member_count?: number | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_violations: {
        Row: {
          group_id: string
          id: string
          last_violation_at: string | null
          reset_at: string | null
          user_id: number
          violation_count: number | null
        }
        Insert: {
          group_id: string
          id?: string
          last_violation_at?: string | null
          reset_at?: string | null
          user_id: number
          violation_count?: number | null
        }
        Update: {
          group_id?: string
          id?: string
          last_violation_at?: string | null
          reset_at?: string | null
          user_id?: number
          violation_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_violations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bot_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
