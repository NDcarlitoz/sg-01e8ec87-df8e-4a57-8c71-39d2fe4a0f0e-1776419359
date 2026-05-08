import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("\n========================================");
  console.log("🔧 SET WEBHOOK ENDPOINT CALLED");
  console.log("========================================");
  console.log("Method:", req.method);
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("========================================\n");

  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { botId } = req.body;

    console.log("📋 Bot ID received:", botId);

    if (!botId) {
      console.log("❌ No bot ID provided");
      return res.status(400).json({ error: "Bot ID required" });
    }

    // Get bot token from database (now allowed by RLS policy)
    console.log("🔍 Querying database for bot token...");
    const { data: bot, error: dbError } = await supabase
      .from("bot_tokens")
      .select("bot_token, id, bot_name, bot_username")
      .eq("id", botId)
      .maybeSingle();

    console.log("📊 Database query result:", { 
      found: !!bot, 
      error: dbError,
      botName: bot?.bot_name,
      botUsername: bot?.bot_username
    });

    if (dbError) {
      console.error("❌ Database error:", dbError);
      return res.status(500).json({ error: `Database error: ${dbError.message}` });
    }

    if (!bot) {
      console.error("❌ Bot not found for ID:", botId);
      return res.status(404).json({ error: "Bot not found" });
    }

    console.log("✅ Bot found:", bot.bot_name, bot.bot_username);

    // Construct webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mmautobot.it.com";
    const webhookUrl = `${baseUrl}/api/telegram/webhook?token=${bot.bot_token}`;

    console.log("🌐 Webhook URL:", webhookUrl);
    console.log("🔑 Bot token length:", bot.bot_token?.length);
    console.log("🔑 Bot token preview:", bot.bot_token?.substring(0, 10) + "...");

    // Set webhook with Telegram
    const telegramUrl = `https://api.telegram.org/bot${bot.bot_token}/setWebhook`;
    
    console.log("📞 Calling Telegram API...");
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    });

    const data = await response.json();
    console.log("📥 Telegram API response:", JSON.stringify(data, null, 2));
    console.log("📊 Response status:", response.status);

    if (!data.ok) {
      console.error("❌ Telegram setWebhook error:", data);
      return res.status(400).json({ 
        error: data.description || "Failed to set webhook",
        telegram_error: data,
      });
    }

    console.log("✅ Webhook setup complete!");
    console.log("========================================\n");

    return res.status(200).json({ 
      success: true, 
      webhookUrl,
      message: "Webhook set successfully" 
    });
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ SET WEBHOOK ERROR");
    console.error("========================================");
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("========================================\n");
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}