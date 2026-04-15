import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

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
    first_name: string;
    last_name?: string;
    username?: string;
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
    // 1. Get bot owner's user_id from bot_tokens table
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

    // 2. Check if user exists
    const { data: existingUser } = await supabase
      .from("bot_users")
      .select("id")
      .eq("user_id", message.from.id)
      .eq("owner_id", owner_id)
      .single();

    let botUserId = existingUser?.id;

    if (existingUser) {
      // Update last interaction
      await supabase
        .from("bot_users")
        .update({
          last_interaction: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .eq("id", existingUser.id);
    } else {
      // Create new user
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
      // Log interaction
      await supabase
        .from("user_interactions")
        .insert({
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Get bot token from query or header
    const botToken = req.query.token as string || req.headers["x-telegram-bot-token"] as string;

    if (!botToken) {
      console.error("No bot token provided");
      return res.status(400).json({ error: "Bot token required" });
    }

    // Save user to database
    await saveUserToDatabase(message, botToken);

    // Handle commands
    if (text === "/start") {
      await handleStart(botToken, message);
    } else if (text === "/help") {
      await handleHelp(botToken, message);
    } else if (text === "/menu") {
      await handleMenu(botToken, message);
    } else {
      // Echo back for unknown commands
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
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}