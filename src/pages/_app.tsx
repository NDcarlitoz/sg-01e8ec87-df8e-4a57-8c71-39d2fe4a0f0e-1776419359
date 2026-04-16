import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/contexts/I18nContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <Component {...pageProps} />
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}