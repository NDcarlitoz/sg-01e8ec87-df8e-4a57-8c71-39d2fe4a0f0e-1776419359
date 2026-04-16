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

    if (!botId) {
      return res.status(400).json({ error: "Bot ID required" });
    }

    // Use admin client to bypass RLS
    const { data: bot, error } = await supabaseAdmin
      .from("bot_tokens")
      .select("id, bot_token, bot_name, bot_username")
      .eq("id", botId)
      .single();

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    return res.status(200).json({ bot });
  } catch (error) {
    console.error("Get bot token error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}