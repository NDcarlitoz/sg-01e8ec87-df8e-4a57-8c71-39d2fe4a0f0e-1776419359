import { supabase } from "@/integrations/supabase/client";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

interface TelegramResponse<T = any> {
  ok: boolean;
  result?: T;
  description?: string;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
  date: number;
}

export const telegramService = {
  /**
   * Get bot info to verify token
   */
  async getBotInfo(botToken: string): Promise<{ data: TelegramUser | null; error: string | null }> {
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/getMe`);
      const data: TelegramResponse<TelegramUser> = await response.json();
      
      if (!data.ok) {
        return { data: null, error: data.description || "Failed to get bot info" };
      }
      
      return { data: data.result || null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Send text message to a chat
   */
  async sendMessage(
    botToken: string,
    chatId: string | number,
    text: string,
    options?: {
      parse_mode?: "Markdown" | "HTML";
      disable_notification?: boolean;
    }
  ): Promise<{ data: TelegramMessage | null; error: string | null }> {
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          ...options,
        }),
      });
      
      const data: TelegramResponse<TelegramMessage> = await response.json();
      
      if (!data.ok) {
        return { data: null, error: data.description || "Failed to send message" };
      }
      
      return { data: data.result || null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Send photo to chat
   */
  async sendPhoto(
    botToken: string,
    chatId: string | number,
    photoUrl: string,
    caption?: string
  ): Promise<{ data: any; error: string | null }> {
    try {
      const response = await fetch(
        `${TELEGRAM_API_BASE}${botToken}/sendPhoto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: photoUrl,
            caption: caption || "",
            parse_mode: "HTML",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return {
          data: null,
          error: data.description || "Failed to send photo",
        };
      }

      return { data: data.result, error: null };
    } catch (error) {
      console.error("Send photo error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Send document to chat
   */
  async sendDocument(
    botToken: string,
    chatId: string | number,
    documentUrl: string,
    caption?: string,
    filename?: string
  ): Promise<{ data: any; error: string | null }> {
    try {
      const response = await fetch(
        `${TELEGRAM_API_BASE}${botToken}/sendDocument`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            document: documentUrl,
            caption: caption || "",
            parse_mode: "HTML",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return {
          data: null,
          error: data.description || "Failed to send document",
        };
      }

      return { data: data.result, error: null };
    } catch (error) {
      console.error("Send document error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get chat info
   */
  async getChat(
    botToken: string,
    chatId: string | number
  ): Promise<{ data: TelegramChat | null; error: string | null }> {
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/getChat?chat_id=${chatId}`);
      const data: TelegramResponse<TelegramChat> = await response.json();
      
      if (!data.ok) {
        return { data: null, error: data.description || "Failed to get chat info" };
      }
      
      return { data: data.result || null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Get chat members count
   */
  async getChatMembersCount(
    botToken: string,
    chatId: string | number
  ): Promise<{ data: number | null; error: string | null }> {
    try {
      const response = await fetch(
        `${TELEGRAM_API_BASE}${botToken}/getChatMemberCount?chat_id=${chatId}`
      );
      const data: TelegramResponse<number> = await response.json();
      
      if (!data.ok) {
        return { data: null, error: data.description || "Failed to get members count" };
      }
      
      return { data: data.result || null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Set webhook for bot updates
   */
  async setWebhook(
    botToken: string,
    webhookUrl: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      
      const data: TelegramResponse = await response.json();
      
      if (!data.ok) {
        return { success: false, error: data.description || "Failed to set webhook" };
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Delete webhook
   */
  async deleteWebhook(botToken: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/deleteWebhook`);
      const data: TelegramResponse = await response.json();
      
      if (!data.ok) {
        return { success: false, error: data.description || "Failed to delete webhook" };
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  /**
   * Get active bot token from database
   */
  async getActiveBotToken(): Promise<{ token: string | null; error: string | null }> {
    const { data, error } = await supabase
      .from("bot_tokens")
      .select("bot_token")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error) {
      return { token: null, error: error.message };
    }

    return { token: data?.bot_token || null, error: null };
  },
};