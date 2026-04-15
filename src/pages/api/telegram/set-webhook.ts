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
      .select("bot_token, id")
      .eq("id", botId)
      .single();

    if (dbError || !bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // Construct webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/telegram/webhook?token=${bot.bot_token}`;

    // Set webhook with Telegram
    const telegramUrl = `https://api.telegram.org/bot${bot.bot_token}/setWebhook`;
    
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram setWebhook error:", data);
      return res.status(400).json({ 
        error: data.description || "Failed to set webhook" 
      });
    }

    // Update bot status in database
    await supabase
      .from("bot_tokens")
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", botId);

    return res.status(200).json({ 
      success: true, 
      webhookUrl,
      message: "Webhook set successfully" 
    });
  } catch (error) {
    console.error("Set webhook error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}