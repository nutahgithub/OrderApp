import { useEffect, useState } from "react";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { HealthResponse } from "../../lib/api/types";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export const AdminDashboardPage = () => {
  const { admin, token, logout } = useAuth();
  const { t } = useI18n();
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [sessionCheck, setSessionCheck] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    apiClient
      .health()
      .then((data) => {
        if (isMounted) {
          setHealth({ status: "success", data });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : t(MessageKey.DashboardUnableToReachApi);
          setHealth({ status: "error", message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setSessionCheck({ status: "error", message: t(MessageKey.DashboardMissingToken) });
      return () => {
        isMounted = false;
      };
    }

    apiClient
      .getCurrentAdmin(token)
      .then((response) => {
        if (isMounted) {
          setSessionCheck({
            status: "success",
            data: {
              status: "ok",
              service: `${response.admin.email} @ ${response.admin.tenant.name}`
            }
          });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : t(MessageKey.DashboardUnableToValidateSession);
          setSessionCheck({ status: "error", message });
          logout();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [logout, t, token]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t(MessageKey.DashboardEyebrow)}</p>
          <h1>{t(MessageKey.DashboardTitle)}</h1>
          {admin ? <p className="page-subtitle">{t(MessageKey.DashboardSignedInAs, { email: admin.email })}</p> : null}
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>{t(MessageKey.DashboardApiStatus)}</h2>
          {health.status === "loading" ? <StateMessage title={t(MessageKey.DashboardCheckingApi)} /> : null}
          {health.status === "error" ? (
            <StateMessage title={t(MessageKey.DashboardApiUnavailable)} description={health.message} tone="error" />
          ) : null}
          {health.status === "success" ? (
            <StateMessage
              title={t(MessageKey.DashboardApiConnected)}
              description={t(MessageKey.DashboardApiConnectedDescription, {
                service: health.data.service,
                status: health.data.status
              })}
              tone="success"
            />
          ) : null}
        </section>

        <section className="panel">
          <h2>{t(MessageKey.DashboardSession)}</h2>
          {sessionCheck.status === "loading" ? <StateMessage title={t(MessageKey.DashboardCheckingSession)} /> : null}
          {sessionCheck.status === "error" ? (
            <StateMessage title={t(MessageKey.DashboardSessionInvalid)} description={sessionCheck.message} tone="error" />
          ) : null}
          {sessionCheck.status === "success" ? (
            <StateMessage
              title={t(MessageKey.DashboardSessionActive)}
              description={sessionCheck.data.service}
              tone="success"
            />
          ) : null}
        </section>
      </div>
    </section>
  );
};
