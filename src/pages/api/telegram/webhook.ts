import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { moderationService } from "@/services/moderationService";

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    title?: string;
    type: string;
  };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendMessage(botToken: string, chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  return response.json();
}

async function handleStart(botToken: string, message: TelegramMessage) {
  const welcomeText = `👋 <b>Welcome to the bot!</b>

I'm your Telegram automation assistant.

<b>Available commands:</b>
/start - Show this welcome message
/help - Get help and support
/menu - Show main menu

Feel free to explore!`;

  await sendMessage(botToken, message.chat.id, welcomeText);
}

async function handleHelp(botToken: string, message: TelegramMessage) {
  const helpText = `ℹ️ <b>Help & Support</b>

<b>Available Commands:</b>
• /start - Welcome message
• /help - This help message
• /menu - Main menu

<b>Need assistance?</b>
Contact support through the dashboard.`;

  await sendMessage(botToken, message.chat.id, helpText);
}

async function handleMenu(botToken: string, message: TelegramMessage) {
  const menuText = `📱 <b>Main Menu</b>

Choose an option:
• 📊 Dashboard
• ⚙️ Settings
• 💬 Support
• 📖 About

Reply with your choice!`;

  await sendMessage(botToken, message.chat.id, menuText);
}

async function saveUserToDatabase(message: TelegramMessage, botToken: string) {
  try {
    const { data: botData } = await supabase
      .from("bot_tokens")
      .select("user_id")
      .eq("bot_token", botToken)
      .single();

    const owner_id = botData?.user_id;

    if (!owner_id) {
      console.error("Bot owner not found for this token");
      return;
    }

    const { data: existingUser } = await supabase
      .from("bot_users")
      .select("id")
      .eq("user_id", message.from.id)
      .eq("owner_id", owner_id)
      .single();

    let botUserId = existingUser?.id;

    if (existingUser) {
      await supabase
        .from("bot_users")
        .update({
          last_interaction: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .eq("id", existingUser.id);
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from("bot_users")
        .insert({
          owner_id,
          user_id: message.from.id,
          username: message.from.username || null,
          first_name: message.from.first_name,
          last_name: message.from.last_name || null,
          full_name: `${message.from.first_name} ${message.from.last_name || ""}`.trim(),
          language_code: message.from.language_code || "en",
          is_bot: message.from.is_bot,
          is_active: true,
          last_interaction: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert user error:", insertError);
      }
      botUserId = newUser?.id;
    }

    if (botUserId) {
      await supabase.from("user_interactions").insert({
        bot_user_id: botUserId,
        interaction_type: "message",
        content: message.text || "",
        metadata: {
          message_id: message.message_id,
          chat_id: message.chat.id,
          date: message.date,
        },
      });
    }
  } catch (error) {
    console.error("Save user error:", error);
  }
}

async function handleModeration(message: TelegramMessage): Promise<boolean> {
  if (!message.text) {
    return false;
  }

  if (message.chat.type !== "group" && message.chat.type !== "supergroup") {
    return false;
  }

  if (!message.from || message.from.is_bot) {
    return false;
  }

  try {
    const { data: group, error: groupError }: any = await supabase
      .from("bot_groups")
      .select("id, chat_id, title")
      .eq("chat_id", message.chat.id)
      .single();

    if (groupError || !group) {
      if (groupError && groupError.code !== "PGRST116") {
        console.error("Group lookup error:", groupError);
      }
      return false;
    }

    const groupId = group.id as string;

    const { data: settings } = await moderationService.getModerationSettings(groupId);
    const autoDelete = settings?.auto_delete_enabled ?? false;
    const autoKick = settings?.auto_kick_enabled ?? false;
    const autoBan = settings?.auto_ban_enabled ?? false;
    const kickAfter = settings?.kick_after_violations ?? 3;
    const banAfter = settings?.ban_after_violations ?? 5;

    const { hasBannedWord, matchedWord } = await moderationService.checkBannedWords(
      groupId,
      message.text
    );

    if (!hasBannedWord || !matchedWord) {
      return false;
    }

    const { violationCount } = await moderationService.recordViolation(
      groupId,
      message.from.id
    );

    let performedAction = "warning";

    if (
      autoDelete ||
      matchedWord.action === "delete" ||
      matchedWord.action === "kick" ||
      matchedWord.action === "ban"
    ) {
      const deleteResult = await moderationService.executeAction(
        "delete",
        message.chat.id,
        message.from.id,
        message.message_id
      );
      if (deleteResult.success) {
        performedAction = "delete_message";
      }
    }

    if (autoBan && violationCount >= banAfter) {
      const banResult = await moderationService.executeAction(
        "ban",
        message.chat.id,
        message.from.id
      );
      if (banResult.success) {
        performedAction = "ban";
      }
    } else if (autoKick && violationCount >= kickAfter) {
      const kickResult = await moderationService.executeAction(
        "kick",
        message.chat.id,
        message.from.id
      );
      if (kickResult.success) {
        performedAction = "kick";
      }
    }

    await moderationService.logAction(
      groupId,
      message.from.id,
      performedAction,
      `Banned word "${matchedWord.word}" detected. Violation #${violationCount}.`,
      {
        username: message.from.username,
        triggeredBy: "auto_moderation",
        messageText: message.text,
      }
    );

    return true;
  } catch (error) {
    console.error("Moderation handling error:", error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Webhook endpoint called:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update: TelegramUpdate = req.body;

    if (!update.message || !update.message.text) {
      return res.status(200).json({ ok: true });
    }

    const message = update.message;
    const text = message.text.toLowerCase().trim();

    const botToken =
      (req.query.token as string) || (req.headers["x-telegram-bot-token"] as string);

    if (!botToken) {
      console.error("No bot token provided");
      return res.status(400).json({ error: "Bot token required" });
    }

    await saveUserToDatabase(message, botToken);

    const wasModerated = await handleModeration(message);
    if (wasModerated) {
      return res.status(200).json({ ok: true });
    }

    if (text === "/start") {
      await handleStart(botToken, message);
    } else if (text === "/help") {
      await handleHelp(botToken, message);
    } else if (text === "/menu") {
      await handleMenu(botToken, message);
    } else {
      const echoText = `You said: ${message.text}

Try these commands:
/start - Get started
/help - Get help
/menu - Show menu`;

      await sendMessage(botToken, message.chat.id, echoText);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}