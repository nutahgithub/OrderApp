import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { loginSchema } from "../../features/auth/schemas";
import type { LoginFormValues } from "../../features/auth/schemas";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

export const AdminLoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "admin123456"
    }
  });
  const from =
    typeof location.state === "object" && location.state && "from" in location.state
      ? String(location.state.from)
      : "/admin/dashboard";

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (loginError: unknown) {
      setError(getUserErrorMessage(loginError, MessageKey.RequestFailed, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-[min(420px,100%)] rounded-md border border-border bg-card p-6 text-card-foreground shadow-panel">
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.Admin)}</p>
          <LanguageSwitcher />
        </div>
        <h1 className="m-0 text-[28px] leading-tight">{t(MessageKey.AuthSignInTitle)}</h1>
        <form className="mt-5 grid gap-3.5" onSubmit={form.handleSubmit(handleSubmit)}>
          <Input
            label={t(MessageKey.Email)}
            type="email"
            placeholder="admin@example.com"
            {...form.register("email")}
          />
          {form.formState.errors.email ? <StateMessage title={t(MessageKey.ValidationFailed)} tone="error" /> : null}
          <Input
            label={t(MessageKey.Password)}
            type="password"
            placeholder={t(MessageKey.Password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? <StateMessage title={t(MessageKey.ValidationFailed)} tone="error" /> : null}
          {error ? <StateMessage title={t(MessageKey.AuthLoginFailedTitle)} description={error} tone="error" /> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t(MessageKey.AuthSigningIn) : t(MessageKey.Continue)}
          </Button>
        </form>
      </section>
    </main>
  );
};
