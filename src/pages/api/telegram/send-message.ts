import type { NextApiRequest, NextApiResponse } from "next";
import { telegramService } from "@/services/telegramService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chatId, text, botToken, parseMode } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({ error: "Missing required fields: chatId, text" });
    }

    // Use provided token or get active token from database
    let token = botToken;
    if (!token) {
      const { token: activeToken, error } = await telegramService.getActiveBotToken();
      if (error || !activeToken) {
        return res.status(400).json({ error: "No active bot token found" });
      }
      token = activeToken;
    }

    const { data, error } = await telegramService.sendMessage(token, chatId, text, {
      parse_mode: parseMode,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}