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

  console.log("📤 Sending message to Telegram:", {
    chatId,
    textLength: text.length,
    hasReplyMarkup: !!replyMarkup,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log("📥 Telegram API response:", result);

  return result;
}

async function handleStart(botToken: string, message: TelegramMessage) {
  console.log("▶️ Handling /start command for user:", message.from.id);

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
  console.log("✅ /start command handled successfully");
}

async function handleHelp(botToken: string, message: TelegramMessage) {
  console.log("❓ Handling /help command for user:", message.from.id);

  const helpText = `ℹ️ <b>Help & Support</b>

<b>Available Commands:</b>
• /start - Welcome message
• /help - This help message
• /menu - Main menu

<b>Need assistance?</b>
Contact support through the dashboard.`;

  await sendMessage(botToken, message.chat.id, helpText);
  console.log("✅ /help command handled successfully");
}

async function handleMenu(botToken: string, message: TelegramMessage) {
  console.log("📋 Handling /menu command for user:", message.from.id);

  const menuText = `📱 <b>Main Menu</b>

Choose an option:
• 📊 Dashboard
• ⚙️ Settings
• 💬 Support
• 📖 About

Reply with your choice!`;

  await sendMessage(botToken, message.chat.id, menuText);
  console.log("✅ /menu command handled successfully");
}

async function saveUserToDatabase(message: TelegramMessage, botToken: string) {
  console.log("💾 Saving user to database:", {
    userId: message.from.id,
    username: message.from.username,
    firstName: message.from.first_name,
  });

  try {
    const { data: botData } = await supabase
      .from("bot_tokens")
      .select("user_id")
      .eq("bot_token", botToken)
      .single();

    const owner_id = botData?.user_id;

    if (!owner_id) {
      console.error("❌ Bot owner not found for this token");
      return;
    }

    console.log("👤 Bot owner ID:", owner_id);

    const { data: existingUser } = await supabase
      .from("bot_users")
      .select("id")
      .eq("user_id", message.from.id)
      .eq("owner_id", owner_id)
      .single();

    let botUserId = existingUser?.id;

    const nowIso = new Date().toISOString();

    if (existingUser) {
      console.log("🔄 Updating existing user:", existingUser.id);
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
      console.log("➕ Creating new user");
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
        console.error("❌ Insert user error:", insertError);
      } else {
        console.log("✅ New user created:", newUser?.id);
      }
      botUserId = newUser?.id;
    }

    if (botUserId) {
      console.log("📝 Logging user interaction");
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
      console.log("✅ User interaction logged");
    }
  } catch (error) {
    console.error("❌ Save user error:", error);
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

  console.log("🛡️ Checking moderation for message:", {
    chatId: message.chat.id,
    userId: message.from.id,
    text: message.text.substring(0, 50),
  });

  try {
    const { data: group, error: groupError }: any = await supabase
      .from("bot_groups")
      .select("id, chat_id, title")
      .eq("chat_id", message.chat.id)
      .single();

    if (groupError || !group) {
      if (groupError && groupError.code !== "PGRST116") {
        console.error("❌ Group lookup error:", groupError);
      } else {
        console.log("ℹ️ Group not found in database, skipping moderation");
      }
      return false;
    }

    console.log("🔍 Found group:", group.title);

    const groupId = group.id as string;

    const { data: settings } = await moderationService.getModerationSettings(groupId);
    console.log("⚙️ Moderation settings:", {
      autoDelete: settings?.auto_delete_enabled,
      autoKick: settings?.auto_kick_enabled,
      autoBan: settings?.auto_ban_enabled,
    });

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
      console.log("✅ No banned words detected");
      return false;
    }

    console.log("⚠️ Banned word detected:", matchedWord.word);

    const { violationCount } = await moderationService.recordViolation(
      groupId,
      message.from.id
    );

    console.log("📊 Violation count:", violationCount);

    let performedAction = "warning";

    if (
      autoDelete ||
      matchedWord.action === "delete" ||
      matchedWord.action === "kick" ||
      matchedWord.action === "ban"
    ) {
      console.log("🗑️ Deleting message");
      const deleteResult = await moderationService.executeAction(
        "delete",
        message.chat.id,
        message.from.id,
        message.message_id
      );
      if (deleteResult.success) {
        performedAction = "delete_message";
        console.log("✅ Message deleted");
      } else {
        console.error("❌ Failed to delete message:", deleteResult.error);
      }
    }

    if (autoBan && violationCount >= banAfter) {
      console.log("🚫 Banning user");
      const banResult = await moderationService.executeAction(
        "ban",
        message.chat.id,
        message.from.id
      );
      if (banResult.success) {
        performedAction = "ban";
        console.log("✅ User banned");
      } else {
        console.error("❌ Failed to ban user:", banResult.error);
      }
    } else if (autoKick && violationCount >= kickAfter) {
      console.log("👢 Kicking user");
      const kickResult = await moderationService.executeAction(
        "kick",
        message.chat.id,
        message.from.id
      );
      if (kickResult.success) {
        performedAction = "kick";
        console.log("✅ User kicked");
      } else {
        console.error("❌ Failed to kick user:", kickResult.error);
      }
    }

    console.log("📝 Logging moderation action");
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

    console.log("✅ Moderation action completed:", performedAction);
    return true;
  } catch (error) {
    console.error("❌ Moderation handling error:", error);
    return false;
  }
}

async function handleContactShare(botToken: string, message: TelegramMessage) {
  const contact = message.contact;
  if (!contact) {
    return;
  }

  console.log("📱 Handling contact share:", {
    phoneNumber: contact.phone_number,
    firstName: contact.first_name,
    userId: contact.user_id,
  });

  try {
    const { data: botData } = await supabase
      .from("bot_tokens")
      .select("user_id")
      .eq("bot_token", botToken)
      .single();

    const owner_id = botData?.user_id;

    if (!owner_id) {
      console.error("❌ Bot owner not found for this token (contact share)");
      return;
    }

    const telegramUserId = contact.user_id || message.from.id;
    const fullName = `${contact.first_name} ${contact.last_name || ""}`.trim();
    const nowIso = new Date().toISOString();

    console.log("🔍 Looking for existing user:", telegramUserId);

    const { data: existingUser, error: existingError } = await supabase
      .from("bot_users")
      .select("id")
      .eq("user_id", telegramUserId)
      .eq("owner_id", owner_id)
      .single();

    if (!existingError && existingUser) {
      console.log("🔄 Updating existing user with phone number");
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
      console.log("✅ User updated with phone number");
    } else {
      console.log("➕ Creating new user with phone number");
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
      console.log("✅ New user created with phone number");
    }

    await sendMessage(
      botToken,
      message.chat.id,
      "✅ Thank you! Your phone number has been recorded.\n\nYou can update it anytime by sharing your contact again."
    );
  } catch (error) {
    console.error("❌ Error handling contact share:", error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("\n========================================");
  console.log("🔔 WEBHOOK ENDPOINT CALLED");
  console.log("========================================");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Query params:", req.query);
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("========================================\n");

  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update: TelegramUpdate = req.body;

    console.log("📦 Received update:", {
      updateId: update.update_id,
      hasMessage: !!update.message,
    });

    if (!update.message) {
      console.log("ℹ️ No message in update, skipping");
      return res.status(200).json({ ok: true });
    }

    const message = update.message;
    console.log("💬 Message details:", {
      messageId: message.message_id,
      from: {
        id: message.from.id,
        username: message.from.username,
        firstName: message.from.first_name,
      },
      chat: {
        id: message.chat.id,
        type: message.chat.type,
        title: message.chat.title,
      },
      text: message.text,
      hasContact: !!message.contact,
    });

    const botToken =
      (req.query.token as string) || (req.headers["x-telegram-bot-token"] as string);

    console.log("🔑 Bot token validation:", {
      fromQuery: !!req.query.token,
      fromHeader: !!req.headers["x-telegram-bot-token"],
      tokenPresent: !!botToken,
      tokenLength: botToken?.length,
    });

    if (!botToken) {
      console.error("❌ No bot token provided");
      return res.status(400).json({ error: "Bot token required" });
    }

    console.log("👤 Saving user to database...");
    await saveUserToDatabase(message, botToken);

    if (message.contact) {
      console.log("📱 Contact shared, processing...");
      await handleContactShare(botToken, message);
      console.log("✅ Webhook processing complete (contact share)");
      return res.status(200).json({ ok: true });
    }

    console.log("🛡️ Checking moderation...");
    const wasModerated = await handleModeration(message);
    if (wasModerated) {
      console.log("✅ Webhook processing complete (moderation applied)");
      return res.status(200).json({ ok: true });
    }

    const text = message.text?.toLowerCase().trim() || "";

    if (!text) {
      console.log("ℹ️ Non-text message, no further processing");
      return res.status(200).json({ ok: true });
    }

    console.log("🔤 Processing text command:", text);

    if (text === "/start") {
      await handleStart(botToken, message);
    } else if (text === "/help") {
      await handleHelp(botToken, message);
    } else if (text === "/menu") {
      await handleMenu(botToken, message);
    } else {
      console.log("💬 Echo mode - responding to user");
      const echoText = `You said: ${message.text}

Try these commands:
/start - Get started
/help - Get help
/menu - Show menu`;

      await sendMessage(botToken, message.chat.id, echoText);
    }

    console.log("✅ Webhook processing complete");
    console.log("========================================\n");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ WEBHOOK ERROR");
    console.error("========================================");
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("========================================\n");
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}