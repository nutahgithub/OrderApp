import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

export const AdminLoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123456");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from =
    typeof location.state === "object" && location.state && "from" in location.state
      ? String(location.state.from)
      : "/admin/dashboard";

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        email,
        password
      });
      navigate(from, { replace: true });
    } catch (loginError: unknown) {
      setError(getUserErrorMessage(loginError, MessageKey.RequestFailed, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-panel-top">
          <p className="eyebrow">{t(MessageKey.Admin)}</p>
          <LanguageSwitcher />
        </div>
        <h1>{t(MessageKey.AuthSignInTitle)}</h1>
        <form className="form-stack" onSubmit={handleSubmit}>
          <Input
            label={t(MessageKey.Email)}
            name="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label={t(MessageKey.Password)}
            name="password"
            type="password"
            placeholder={t(MessageKey.Password)}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <StateMessage title={t(MessageKey.AuthLoginFailedTitle)} description={error} tone="error" /> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t(MessageKey.AuthSigningIn) : t(MessageKey.Continue)}
          </Button>
        </form>
      </section>
    </main>
  );
};
