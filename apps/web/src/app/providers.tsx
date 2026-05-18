import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthProvider } from "../features/auth/AuthContext";
import { I18nProvider } from "../lib/i18n/I18nContext";
import { queryClient } from "../lib/query/query-client";
import { ThemeProvider } from "../lib/theme/ThemeContext";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};
