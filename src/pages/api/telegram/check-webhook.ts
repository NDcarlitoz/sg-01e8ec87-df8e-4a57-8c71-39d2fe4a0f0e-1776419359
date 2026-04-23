import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("\n========================================");
  console.log("🔍 CHECK WEBHOOK ENDPOINT CALLED");
  console.log("========================================");
  console.log("Method:", req.method);
  console.log("Query:", req.query);
  console.log("========================================\n");

  try {
    // Get bot token from query parameter or all tokens
    const tokenQuery = req.query.token as string | undefined;

    let botTokens: { bot_token: string; bot_username?: string }[] = [];

    if (tokenQuery) {
      // Check specific token
      console.log("🔑 Checking specific token...");
      const { data, error } = await supabase
        .from("bot_tokens")
        .select("bot_token, bot_username")
        .eq("bot_token", tokenQuery)
        .limit(1);

      if (error) {
        console.error("❌ Database error:", error);
        return res.status(500).json({
          success: false,
          error: "Database error",
          details: error.message,
        });
      }

      if (!data || data.length === 0) {
        console.log("⚠️ Token not found in database");
        return res.status(404).json({
          success: false,
          error: "Bot token not found in database",
        });
      }

      botTokens = data;
    } else {
      // Check all tokens
      console.log("🔍 Fetching all bot tokens...");
      const { data, error } = await supabase
        .from("bot_tokens")
        .select("bot_token, bot_username")
        .eq("is_active", true);

      if (error) {
        console.error("❌ Database error:", error);
        return res.status(500).json({
          success: false,
          error: "Database error",
          details: error.message,
        });
      }

      if (!data || data.length === 0) {
        console.log("⚠️ No active bot tokens found");
        return res.status(404).json({
          success: false,
          error: "No active bot tokens found in database",
          hint: "Add a bot token in the dashboard first",
        });
      }

      botTokens = data;
    }

    console.log(`✅ Found ${botTokens.length} bot token(s) to check`);

    // Check each bot
    const results = await Promise.all(
      botTokens.map(async ({ bot_token, bot_username }) => {
        console.log(`\n🤖 Checking bot: @${bot_username || "unknown"}`);

        try {
          // Test 1: Get bot info
          console.log("📞 Calling getMe...");
          const getMeUrl = `https://api.telegram.org/bot${bot_token}/getMe`;
          const getMeResponse = await fetch(getMeUrl);
          const getMeData = await getMeResponse.json();

          if (!getMeData.ok) {
            console.error("❌ getMe failed:", getMeData);
            return {
              bot_username: bot_username || "unknown",
              status: "error",
              error: "Invalid bot token or Telegram API error",
              telegram_error: getMeData.description || "Unknown error",
            };
          }

          console.log("✅ Bot info retrieved:", getMeData.result);

          // Test 2: Get webhook info
          console.log("📞 Calling getWebhookInfo...");
          const webhookUrl = `https://api.telegram.org/bot${bot_token}/getWebhookInfo`;
          const webhookResponse = await fetch(webhookUrl);
          const webhookData = await webhookResponse.json();

          if (!webhookData.ok) {
            console.error("❌ getWebhookInfo failed:", webhookData);
            return {
              bot_username: getMeData.result.username,
              bot_id: getMeData.result.id,
              bot_name: getMeData.result.first_name,
              status: "error",
              error: "Failed to get webhook info",
              telegram_error: webhookData.description || "Unknown error",
            };
          }

          const webhookInfo: TelegramWebhookInfo = webhookData.result;
          console.log("✅ Webhook info retrieved:", webhookInfo);

          const isWebhookSet = webhookInfo.url && webhookInfo.url.length > 0;
          const hasErrors = webhookInfo.last_error_message !== undefined;

          let webhookStatus: "not_set" | "active" | "error" = "not_set";
          if (isWebhookSet && !hasErrors) {
            webhookStatus = "active";
          } else if (isWebhookSet && hasErrors) {
            webhookStatus = "error";
          }

          return {
            bot_username: getMeData.result.username,
            bot_id: getMeData.result.id,
            bot_name: getMeData.result.first_name,
            status: webhookStatus,
            webhook: {
              url: webhookInfo.url || null,
              pending_updates: webhookInfo.pending_update_count,
              last_error: webhookInfo.last_error_message
                ? {
                    date: webhookInfo.last_error_date
                      ? new Date(webhookInfo.last_error_date * 1000).toISOString()
                      : null,
                    message: webhookInfo.last_error_message,
                  }
                : null,
              max_connections: webhookInfo.max_connections,
              allowed_updates: webhookInfo.allowed_updates,
            },
          };
        } catch (error) {
          console.error(`❌ Error checking bot @${bot_username}:`, error);
          return {
            bot_username: bot_username || "unknown",
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    console.log("\n✅ Check complete");
    console.log("========================================\n");

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      bots_checked: results.length,
      results,
    });
  } catch (error) {
    console.error("\n❌ CHECK WEBHOOK ERROR:");
    console.error(error);
    console.error("========================================\n");

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}