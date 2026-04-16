import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { botId } = req.body;

    if (!botId) {
      return res.status(400).json({ error: "Bot ID required" });
    }

    // Get bot token from database
    const { data: bot, error: dbError } = await supabase
      .from("bot_tokens")
      .select("bot_token")
      .eq("id", botId)
      .maybeSingle();

    if (dbError || !bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // Check webhook status with Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${bot.bot_token}/getWebhookInfo`
    );

    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ error: "Failed to get webhook info" });
    }

    const webhookInfo = data.result;

    return res.status(200).json({
      webhook: {
        url: webhookInfo.url || null,
        is_set: !!webhookInfo.url,
        pending_update_count: webhookInfo.pending_update_count || 0,
        last_error_message: webhookInfo.last_error_message || null,
      },
    });
  } catch (error) {
    console.error("Check webhook error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}