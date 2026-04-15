import type { NextApiRequest, NextApiResponse } from "next";
import { telegramService } from "@/services/telegramService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { botToken } = req.body;

    if (!botToken) {
      return res.status(400).json({ error: "Bot token is required" });
    }

    console.log("API: Verifying bot token...");
    const { data, error } = await telegramService.getBotInfo(botToken);

    if (error) {
      console.error("API: Telegram verification failed:", error);
      return res.status(400).json({ error });
    }

    console.log("API: Bot verified successfully");
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("API: Get bot info error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}