import { supabase } from "@/integrations/supabase/client";

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  userAgent: string;
}

interface ErrorReportData {
  errorMessage: string;
  errorStack?: string;
  errorType: "react" | "javascript" | "promise_rejection" | "network" | "api" | "custom";
  severity?: "warning" | "error" | "fatal";
  componentStack?: string;
  additionalData?: Record<string, any>;
}

/**
 * Client-side error reporting service
 * Logs frontend errors to Supabase for monitoring and debugging
 */
class ErrorReportingService {
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    // Generate a unique session ID for this browser session
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a unique session ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem("error_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem("error_session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Detect browser information
   */
  private getBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent;
    let browserName = "Unknown";
    let browserVersion = "Unknown";
    let os = "Unknown";

    // Detect browser
    if (ua.indexOf("Firefox") > -1) {
      browserName = "Firefox";
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Edg") > -1) {
      browserName = "Edge";
      browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Chrome") > -1) {
      browserName = "Chrome";
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Safari") > -1) {
      browserName = "Safari";
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "Unknown";
    }

    // Detect OS
    if (ua.indexOf("Win") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) os = "MacOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("iOS") > -1) os = "iOS";

    return {
      name: browserName,
      version: browserVersion,
      os,
      userAgent: ua,
    };
  }

  /**
   * Get current user ID if authenticated
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Report an error to the database
   */
  async reportError(data: ErrorReportData): Promise<void> {
    if (!this.isEnabled) {
      console.warn("Error reporting is disabled");
      return;
    }

    try {
      const userId = await this.getCurrentUserId();
      const browserInfo = this.getBrowserInfo();

      const errorData = {
        user_id: userId,
        session_id: this.sessionId,
        error_message: data.errorMessage,
        error_stack: data.errorStack || null,
        error_type: data.errorType,
        severity: data.severity || "error",
        page_url: window.location.href,
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
        browser_info: browserInfo as any,
        component_stack: data.componentStack || null,
        additional_data: data.additionalData as any || null,
      };

      // Check for recent duplicate errors (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentErrors } = await supabase
        .from("client_errors")
        .select("id, occurrence_count")
        .eq("error_message", data.errorMessage)
        .eq("page_path", window.location.pathname)
        .eq("error_type", data.errorType)
        .gte("created_at", fiveMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentErrors && recentErrors.length > 0) {
        // Update existing error with incremented count
        const existingError = recentErrors[0];
        await supabase
          .from("client_errors")
          .update({
            occurrence_count: existingError.occurrence_count + 1,
            last_occurred_at: new Date().toISOString(),
          })
          .eq("id", existingError.id);
      } else {
        // Insert new error
        const { error } = await supabase
          .from("client_errors")
          .insert([errorData]);

        if (error) {
          console.error("Failed to report error to database:", error);
        }
      }
    } catch (err) {
      // Avoid infinite loop - don't report errors about error reporting
      console.error("Error reporting service failed:", err);
    }
  }

  /**
   * Enable error reporting
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable error reporting (useful for development)
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Check if error reporting is enabled
   */
  isActive(): boolean {
    return this.isEnabled;
  }
}

// Singleton instance
export const errorReporting = new ErrorReportingService();