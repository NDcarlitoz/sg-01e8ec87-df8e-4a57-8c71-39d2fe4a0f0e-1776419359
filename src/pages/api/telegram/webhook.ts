import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { moderationService } from "@/services/moderationService";

interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
}

interface TelegramFrom {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  title?: string;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramFrom;
  chat: TelegramChat;
  date: number;
  text?: string;
  contact?: TelegramContact;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendMessage(
  botToken: string,
  chatId: number,
  text: string,
  replyMarkup?: any
) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

To get the best experience, please share your phone number using the button below.`;

  const isPrivateChat = message.chat.type === "private";

  const replyMarkup = isPrivateChat
    ? {
        keyboard: [
          [
            {
              text: "📱 Share phone number",
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    : undefined;

  await sendMessage(botToken, message.chat.id, welcomeText, replyMarkup);
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

    const nowIso = new Date().toISOString();

    if (existingUser) {
      await supabase
        .from("bot_users")
        .update({
          last_interaction: nowIso,
          last_seen: nowIso,
          total_messages: 1,
          updated_at: nowIso,
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
          last_interaction: nowIso,
          last_seen: nowIso,
          total_messages: 1,
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

async function handleContactShare(botToken: string, message: TelegramMessage) {
  const contact = message.contact;
  if (!contact) {
    return;
  }

  try {
    const { data: botData } = await supabase
      .from("bot_tokens")
      .select("user_id")
      .eq("bot_token", botToken)
      .single();

    const owner_id = botData?.user_id;

    if (!owner_id) {
      console.error("Bot owner not found for this token (contact share)");
      return;
    }

    const telegramUserId = contact.user_id || message.from.id;
    const fullName = `${contact.first_name} ${contact.last_name || ""}`.trim();
    const nowIso = new Date().toISOString();

    const { data: existingUser, error: existingError } = await supabase
      .from("bot_users")
      .select("id")
      .eq("user_id", telegramUserId)
      .eq("owner_id", owner_id)
      .single();

    if (!existingError && existingUser) {
      await supabase
        .from("bot_users")
        .update({
          phone_number: contact.phone_number,
          full_name:
            fullName ||
            `${message.from.first_name} ${message.from.last_name || ""}`.trim() ||
            null,
          username: message.from.username || null,
          last_interaction: nowIso,
          last_seen: nowIso,
          updated_at: nowIso,
        })
        .eq("id", existingUser.id);
    } else {
      await supabase.from("bot_users").insert({
        owner_id,
        user_id: telegramUserId,
        username: message.from.username || null,
        first_name: contact.first_name || message.from.first_name,
        last_name: contact.last_name || message.from.last_name || null,
        full_name:
          fullName ||
          `${message.from.first_name} ${message.from.last_name || ""}`.trim() ||
          null,
        language_code: message.from.language_code || "en",
        is_bot: false,
        is_active: true,
        phone_number: contact.phone_number,
        last_interaction: nowIso,
        last_seen: nowIso,
        total_messages: 1,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    await sendMessage(
      botToken,
      message.chat.id,
      "✅ Thank you! Your phone number has been recorded.\n\nYou can update it anytime by sharing your contact again."
    );
  } catch (error) {
    console.error("Error handling contact share:", error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Webhook endpoint called:", req.method, req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update: TelegramUpdate = req.body;

    if (!update.message) {
      return res.status(200).json({ ok: true });
    }

    const message = update.message;

    const botToken =
      (req.query.token as string) || (req.headers["x-telegram-bot-token"] as string);

    if (!botToken) {
      console.error("No bot token provided");
      return res.status(400).json({ error: "Bot token required" });
    }

    // Always ensure we track user & interactions
    await saveUserToDatabase(message, botToken);

    // If this update contains a shared contact, handle phone capture first
    if (message.contact) {
      await handleContactShare(botToken, message);
      return res.status(200).json({ ok: true });
    }

    // Apply moderation only for group text messages
    const wasModerated = await handleModeration(message);
    if (wasModerated) {
      return res.status(200).json({ ok: true });
    }

    const text = message.text?.toLowerCase().trim() || "";

    if (!text) {
      // Non-text message (and not a contact) — nothing else to do
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