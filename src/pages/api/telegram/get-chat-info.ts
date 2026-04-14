import type { NextApiRequest, NextApiResponse } from "next";
import { telegramService } from "@/services/telegramService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chatId, botToken } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required" });
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

    const { data, error } = await telegramService.getChat(token, chatId);

    if (error) {
      return res.status(400).json({ error });
    }

    // Get members count for groups/channels
    let membersCount = null;
    if (data && (data.type === "group" || data.type === "supergroup" || data.type === "channel")) {
      const { data: count } = await telegramService.getChatMembersCount(token, chatId);
      membersCount = count;
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        ...data,
        members_count: membersCount,
      }
    });
  } catch (error) {
    console.error("Get chat info error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}