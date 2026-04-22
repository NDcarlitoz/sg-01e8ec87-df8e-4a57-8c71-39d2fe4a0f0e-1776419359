import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initializeGlobalErrorHandlers } from "@/lib/globalErrorHandlers";
import { useEffect } from "react";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize global error handlers on app start
    initializeGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <I18nProvider>
            <Component {...pageProps} />
          </I18nProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}