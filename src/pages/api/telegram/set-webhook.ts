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

    console.log("Setting up webhook for botId:", botId);

    if (!botId) {
      return res.status(400).json({ error: "Bot ID required" });
    }

    // Use admin client to bypass RLS
    const { data: bot, error: dbError } = await supabaseAdmin
      .from("bot_tokens")
      .select("bot_token, id, bot_name, bot_username")
      .eq("id", botId)
      .single();

    console.log("Database query result:", { found: !!bot, error: dbError?.message });

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

    console.log("Setting webhook URL:", webhookUrl.replace(bot.bot_token, "***"));

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

    // Update bot status in database using admin client
    const { error: updateError } = await supabaseAdmin
      .from("bot_tokens")
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", botId);

    if (updateError) {
      console.error("Failed to update bot status:", updateError);
      // Don't fail the request, webhook is set even if DB update fails
    }

    console.log("Webhook setup complete!");

    return res.status(200).json({ 
      success: true, 
      webhookUrl: webhookUrl.replace(bot.bot_token, "***"),
      message: "Webhook set successfully" 
    });
  } catch (error) {
    console.error("Set webhook error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}