import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Use service role for backend operations that bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { botId } = req.body;

    if (!botId) {
      return res.status(400).json({ error: "Bot ID required" });
    }

    // Get bot token from database using admin client
    const { data: bot, error: dbError } = await supabaseAdmin
      .from("bot_tokens")
      .select("bot_token")
      .eq("id", botId)
      .single();

    if (dbError || !bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // Check webhook info from Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${bot.bot_token}/getWebhookInfo`
    );

    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ error: "Failed to get webhook info" });
    }

    return res.status(200).json({
      webhook: {
        url: data.result.url || null,
        is_set: !!data.result.url,
        pending_update_count: data.result.pending_update_count || 0,
        last_error_message: data.result.last_error_message || null,
        last_error_date: data.result.last_error_date || null,
      },
    });
  } catch (error) {
    console.error("Check webhook error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}