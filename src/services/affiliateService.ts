import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Currency symbols and formatting
export const CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar", decimals: 2 },
  EUR: { symbol: "€", name: "Euro", decimals: 2 },
  GBP: { symbol: "£", name: "British Pound", decimals: 2 },
  JPY: { symbol: "¥", name: "Japanese Yen", decimals: 0 },
  CNY: { symbol: "¥", name: "Chinese Yuan", decimals: 2 },
  AUD: { symbol: "A$", name: "Australian Dollar", decimals: 2 },
  CAD: { symbol: "C$", name: "Canadian Dollar", decimals: 2 },
  CHF: { symbol: "Fr", name: "Swiss Franc", decimals: 2 },
  HKD: { symbol: "HK$", name: "Hong Kong Dollar", decimals: 2 },
  SGD: { symbol: "S$", name: "Singapore Dollar", decimals: 2 },
  MYR: { symbol: "RM", name: "Malaysian Ringgit", decimals: 2 },
  IDR: { symbol: "Rp", name: "Indonesian Rupiah", decimals: 0 },
  THB: { symbol: "฿", name: "Thai Baht", decimals: 2 },
  VND: { symbol: "₫", name: "Vietnamese Dong", decimals: 0 },
  PHP: { symbol: "₱", name: "Philippine Peso", decimals: 2 },
  INR: { symbol: "₹", name: "Indian Rupee", decimals: 2 },
  KRW: { symbol: "₩", name: "South Korean Won", decimals: 0 },
  BRL: { symbol: "R$", name: "Brazilian Real", decimals: 2 },
  MXN: { symbol: "Mex$", name: "Mexican Peso", decimals: 2 },
  AED: { symbol: "د.إ", name: "UAE Dirham", decimals: 2 },
  SAR: { symbol: "﷼", name: "Saudi Riyal", decimals: 2 },
  ZAR: { symbol: "R", name: "South African Rand", decimals: 2 },
  RUB: { symbol: "₽", name: "Russian Ruble", decimals: 2 },
  TRY: { symbol: "₺", name: "Turkish Lira", decimals: 2 },
  PLN: { symbol: "zł", name: "Polish Zloty", decimals: 2 },
  SEK: { symbol: "kr", name: "Swedish Krona", decimals: 2 },
  NOK: { symbol: "kr", name: "Norwegian Krone", decimals: 2 },
  DKK: { symbol: "kr", name: "Danish Krone", decimals: 2 },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar", decimals: 2 },
  TWD: { symbol: "NT$", name: "Taiwan Dollar", decimals: 2 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const affiliateService = {
  /**
   * Get affiliate system settings
   */
  async getSystemSettings(): Promise<{
    data: Tables<"affiliate_system_settings"> | null;
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("affiliate_system_settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return { data: null, error: error.message };
    }

    return { data: data || null, error: null };
  },

  /**
   * Update affiliate system settings
   */
  async updateSystemSettings(settings: {
    enabled?: boolean;
    auto_approve_referrals?: boolean;
    auto_approve_payouts?: boolean;
    minimum_payout_amount?: number;
    default_currency?: string;
    terms_and_conditions?: string;
  }): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("affiliate_system_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (await this.getSystemSettings()).data?.id || "");

    return { error: error?.message || null };
  },

  /**
   * Check if affiliate system is enabled
   */
  async isEnabled(): Promise<boolean> {
    const { data } = await this.getSystemSettings();
    return data?.enabled || false;
  },

  /**
   * Format amount with currency
   */
  formatCurrency(amount: number, currency: string = "USD"): string {
    const currencyInfo = CURRENCIES[currency as CurrencyCode] || CURRENCIES.USD;
    const decimals = currencyInfo.decimals;
    const formatted = amount.toFixed(decimals);
    return `${currencyInfo.symbol}${formatted}`;
  },

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: string = "USD"): string {
    return CURRENCIES[currency as CurrencyCode]?.symbol || "$";
  },

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return Object.entries(CURRENCIES).map(([code, info]) => ({
      code,
      name: info.name,
      symbol: info.symbol,
    }));
  },

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ convertedAmount: number; rate: number; error: string | null }> {
    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, rate: 1, error: null };
    }

    const { data, error } = await supabase
      .from("currency_exchange_rates")
      .select("rate")
      .eq("from_currency", fromCurrency)
      .eq("to_currency", toCurrency)
      .single();

    if (error || !data) {
      return {
        convertedAmount: amount,
        rate: 1,
        error: "Exchange rate not found",
      };
    }

    return {
      convertedAmount: amount * data.rate,
      rate: data.rate,
      error: null,
    };
  },

  /**
   * Get all affiliate programs
   */
  async getPrograms(): Promise<{
    data: Tables<"affiliate_programs">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("affiliate_programs")
      .select("*")
      .order("created_at", { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Create affiliate program
   */
  async createProgram(program: {
    name: string;
    description?: string;
    commission_type: "percentage" | "fixed";
    commission_value: number;
    currency?: string;
    is_active?: boolean;
  }): Promise<{ data: Tables<"affiliate_programs"> | null; error: string | null }> {
    const { data, error } = await supabase
      .from("affiliate_programs")
      .insert({
        name: program.name,
        description: program.description,
        commission_type: program.commission_type,
        commission_value: program.commission_value,
        currency: program.currency || "USD",
        is_active: program.is_active !== false,
      })
      .select()
      .single();

    return {
      data: data || null,
      error: error?.message || null,
    };
  },

  /**
   * Update affiliate program
   */
  async updateProgram(
    programId: string,
    updates: {
      name?: string;
      description?: string;
      commission_type?: "percentage" | "fixed";
      commission_value?: number;
      currency?: string;
      is_active?: boolean;
    }
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("affiliate_programs")
      .update(updates)
      .eq("id", programId);

    return { error: error?.message || null };
  },

  /**
   * Delete affiliate program
   */
  async deleteProgram(programId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("affiliate_programs")
      .delete()
      .eq("id", programId);

    return { error: error?.message || null };
  },

  /**
   * Get all affiliates with stats
   */
  async getAffiliates(): Promise<{
    data: (Tables<"affiliates"> & { profile?: Tables<"profiles"> })[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("affiliates")
      .select(`
        *,
        profile:profiles(*)
      `)
      .order("total_earnings", { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Create new affiliate with preferred currency
   */
  async createAffiliate(data: {
    user_id: string;
    program_id: string;
    referral_code: string;
    preferred_currency?: string;
  }): Promise<{ error: string | null }> {
    const { error } = await supabase.from("affiliates").insert({
      user_id: data.user_id,
      program_id: data.program_id,
      referral_code: data.referral_code,
      preferred_currency: data.preferred_currency || "USD",
    });

    return { error: error?.message || null };
  },

  /**
   * Get affiliate by referral code
   */
  async getAffiliateByCode(
    code: string
  ): Promise<{ data: Tables<"affiliates"> | null; error: string | null }> {
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .eq("referral_code", code)
      .single();

    if (error && error.code !== "PGRST116") {
      return { data: null, error: error.message };
    }

    return { data: data || null, error: null };
  },

  /**
   * Track new referral
   */
  async trackReferral(data: {
    affiliate_id: string;
    referred_user_id: number;
    referred_username?: string;
    referral_code: string;
    source?: string;
  }): Promise<{ error: string | null }> {
    const { error } = await supabase.from("affiliate_referrals").insert({
      affiliate_id: data.affiliate_id,
      referred_user_id: data.referred_user_id,
      referred_username: data.referred_username,
      referral_code: data.referral_code,
      source: data.source || "telegram",
    });

    if (!error) {
      // Update affiliate stats safely
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("total_referrals")
        .eq("id", data.affiliate_id)
        .single();

      if (affiliate) {
        await supabase
          .from("affiliates")
          .update({
            total_referrals: (affiliate.total_referrals || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.affiliate_id);
      }
    }

    return { error: error?.message || null };
  },

  /**
   * Confirm referral and create commission
   */
  async confirmReferral(
    referralId: string,
    programId: string
  ): Promise<{ error: string | null }> {
    // Get program details
    const { data: program } = await supabase
      .from("affiliate_programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (!program) {
      return { error: "Program not found" };
    }

    // Update referral status
    const { data: referral, error: updateError } = await supabase
      .from("affiliate_referrals")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", referralId)
      .select()
      .single();

    if (updateError || !referral) {
      return { error: updateError?.message || "Referral not found" };
    }

    // Calculate commission
    let commissionAmount = 0;
    if (program.commission_type === "percentage") {
      // For percentage, you'd need actual transaction value
      // For now, using a base value or fixed amount
      commissionAmount = program.commission_value;
    } else {
      commissionAmount = program.commission_value;
    }

    // Create commission record
    const { error: commError } = await supabase
      .from("affiliate_commissions")
      .insert({
        affiliate_id: referral.affiliate_id,
        referral_id: referralId,
        amount: commissionAmount,
        currency: program.currency,
        status: "approved",
        description: `Commission for referral: ${referral.referred_username || referral.referred_user_id}`,
        approved_at: new Date().toISOString(),
      });

    if (commError) {
      return { error: commError.message };
    }

    // Update affiliate earnings
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("*")
      .eq("id", referral.affiliate_id)
      .single();

    if (affiliate) {
      await supabase
        .from("affiliates")
        .update({
          total_earnings: (affiliate.total_earnings || 0) + commissionAmount,
          pending_payout: (affiliate.pending_payout || 0) + commissionAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referral.affiliate_id);
    }

    return { error: null };
  },

  /**
   * Get affiliate referrals
   */
  async getReferrals(
    affiliateId: string
  ): Promise<{
    data: Tables<"affiliate_referrals">[];
    error: string | null;
  }> {
    const { data, error } = await supabase
      .from("affiliate_referrals")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Get affiliate commissions
   */
  async getCommissions(
    affiliateId?: string
  ): Promise<{
    data: (Tables<"affiliate_commissions"> & {
      affiliate?: Tables<"affiliates">;
    })[];
    error: string | null;
  }> {
    let query = supabase.from("affiliate_commissions").select(`
        *,
        affiliate:affiliates(*)
      `);

    if (affiliateId) {
      query = query.eq("affiliate_id", affiliateId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Request payout
   */
  async requestPayout(data: {
    affiliate_id: string;
    amount: number;
    payment_method: string;
    payment_details: any;
  }): Promise<{ error: string | null }> {
    const { error } = await supabase.from("affiliate_payouts").insert({
      affiliate_id: data.affiliate_id,
      amount: data.amount,
      payment_method: data.payment_method,
      payment_details: data.payment_details,
      status: "pending",
    });

    return { error: error?.message || null };
  },

  /**
   * Get payouts
   */
  async getPayouts(
    affiliateId?: string
  ): Promise<{
    data: (Tables<"affiliate_payouts"> & { affiliate?: Tables<"affiliates"> })[];
    error: string | null;
  }> {
    let query = supabase.from("affiliate_payouts").select(`
        *,
        affiliate:affiliates(*)
      `);

    if (affiliateId) {
      query = query.eq("affiliate_id", affiliateId);
    }

    const { data, error } = await query.order("requested_at", {
      ascending: false,
    });

    return {
      data: data || [],
      error: error?.message || null,
    };
  },

  /**
   * Process payout (admin)
   */
  async processPayout(
    payoutId: string,
    status: "processing" | "completed" | "cancelled",
    adminNote?: string
  ): Promise<{ error: string | null }> {
    const updates: any = {
      status,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updates.completed_at = new Date().toISOString();

      // Get payout details
      const { data: payout } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .eq("id", payoutId)
        .single();

      if (payout) {
        // Update affiliate balance
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("*")
          .eq("id", payout.affiliate_id)
          .single();

        if (affiliate) {
          await supabase
            .from("affiliates")
            .update({
              pending_payout: (affiliate.pending_payout || 0) - payout.amount,
              lifetime_payouts: (affiliate.lifetime_payouts || 0) + payout.amount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payout.affiliate_id);
        }
      }
    }

    const { error } = await supabase
      .from("affiliate_payouts")
      .update(updates)
      .eq("id", payoutId);

    return { error: error?.message || null };
  },

  /**
   * Generate unique referral code
   */
  generateReferralCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Get affiliate stats
   */
  async getAffiliateStats(): Promise<{
    data: {
      total_affiliates: number;
      total_referrals: number;
      total_commissions: number;
      pending_payouts: number;
    } | null;
    error: string | null;
  }> {
    const { data: affiliates } = await this.getAffiliates();
    const { data: commissions } = await this.getCommissions();
    const { data: payouts } = await this.getPayouts();

    const totalReferrals = affiliates.reduce(
      (sum, a) => sum + (a.total_referrals || 0),
      0
    );
    const totalCommissions = commissions.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );
    const pendingPayouts = payouts
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      data: {
        total_affiliates: affiliates.length,
        total_referrals: totalReferrals,
        total_commissions: totalCommissions,
        pending_payouts: pendingPayouts,
      },
      error: null,
    };
  },
};