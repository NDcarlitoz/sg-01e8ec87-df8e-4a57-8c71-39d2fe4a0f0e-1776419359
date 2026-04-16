import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { botId } = req.body;

    if (!botId) {
      return res.status(400).json({ error: "Bot ID is required" });
    }

    // Get bot token
    const { data: botData, error: botError } = await supabase
      .from("bot_tokens")
      .select("bot_token")
      .eq("id", botId)
      .single();

    if (botError || !botData) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // Check webhook status with Telegram
    const telegramUrl = `https://api.telegram.org/bot${botData.bot_token}/getWebhookInfo`;
    
    const response = await fetch(telegramUrl);
    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ 
        error: "Failed to get webhook info",
        details: data.description 
      });
    }

    const webhookInfo = data.result;

    return res.status(200).json({
      success: true,
      webhook: {
        url: webhookInfo.url || null,
        has_custom_certificate: webhookInfo.has_custom_certificate || false,
        pending_update_count: webhookInfo.pending_update_count || 0,
        last_error_date: webhookInfo.last_error_date || null,
        last_error_message: webhookInfo.last_error_message || null,
        max_connections: webhookInfo.max_connections || 40,
        allowed_updates: webhookInfo.allowed_updates || [],
        is_set: !!webhookInfo.url,
      }
    });
  } catch (error) {
    console.error("Check webhook error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}