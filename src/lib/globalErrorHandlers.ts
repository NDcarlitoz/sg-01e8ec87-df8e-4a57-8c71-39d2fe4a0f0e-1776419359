import { errorReporting } from "@/services/errorReportingService";

/**
 * Initialize global error handlers
 * Should be called once when the application starts
 */
export function initializeGlobalErrorHandlers(): void {
  // Handle uncaught JavaScript errors
  window.addEventListener("error", (event: ErrorEvent) => {
    console.error("Global error caught:", event.error);

    errorReporting.reportError({
      errorMessage: event.message,
      errorStack: event.error?.stack,
      errorType: "javascript",
      severity: "error",
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    console.error("Unhandled promise rejection:", event.reason);

    const errorMessage = event.reason?.message || String(event.reason) || "Unhandled Promise Rejection";
    const errorStack = event.reason?.stack || undefined;

    errorReporting.reportError({
      errorMessage,
      errorStack,
      errorType: "promise_rejection",
      severity: "error",
      additionalData: {
        reason: String(event.reason),
      },
    });
  });

  // Network error tracking (optional - for fetch/XHR failures)
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Report 5xx server errors
      if (response.status >= 500) {
        errorReporting.reportError({
          errorMessage: `Network Error: ${response.status} ${response.statusText}`,
          errorType: "network",
          severity: "error",
          additionalData: {
            url: args[0] instanceof Request ? args[0].url : String(args[0]),
            status: response.status,
            statusText: response.statusText,
          },
        });
      }
      
      return response;
    } catch (error) {
      // Report network failures
      errorReporting.reportError({
        errorMessage: error instanceof Error ? error.message : "Network request failed",
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: "network",
        severity: "error",
        additionalData: {
          url: args[0] instanceof Request ? args[0].url : String(args[0]),
          errorType: error instanceof Error ? error.name : "Unknown",
        },
      });
      throw error;
    }
  };

  console.log("Global error handlers initialized");
}