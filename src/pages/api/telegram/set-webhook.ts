import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { botId } = req.body;

    console.log("Setting up webhook for botId:", botId);

    if (!botId) {
      return res.status(400).json({ error: "Bot ID required" });
    }

    // Get bot token from database (now allowed by RLS policy)
    const { data: bot, error: dbError } = await supabase
      .from("bot_tokens")
      .select("bot_token, id, bot_name, bot_username")
      .eq("id", botId)
      .maybeSingle();

    console.log("Database query result:", { bot, dbError });

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: `Database error: ${dbError.message}` });
    }

    if (!bot) {
      console.error("Bot not found for ID:", botId);
      return res.status(404).json({ error: "Bot not found" });
    }

    console.log("Bot found:", bot.bot_name, bot.bot_username);

    // Construct webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://mmautobot.it.com"}/api/telegram/webhook?token=${bot.bot_token}`;

    console.log("Setting webhook URL:", webhookUrl);

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
    console.log("Telegram API response:", data);

    if (!data.ok) {
      console.error("Telegram setWebhook error:", data);
      return res.status(400).json({ 
        error: data.description || "Failed to set webhook" 
      });
    }

    console.log("Webhook setup complete!");

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