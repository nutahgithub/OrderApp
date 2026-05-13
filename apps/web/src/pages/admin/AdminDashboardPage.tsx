import { useEffect, useState } from "react";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { HealthResponse } from "../../lib/api/types";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export const AdminDashboardPage = () => {
  const { admin, token, logout } = useAuth();
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
          const message = error instanceof Error ? error.message : "Unable to reach API";
          setHealth({ status: "error", message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setSessionCheck({ status: "error", message: "Missing token" });
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
          const message = error instanceof Error ? error.message : "Unable to validate session";
          setSessionCheck({ status: "error", message });
          logout();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [logout, token]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Dashboard</h1>
          {admin ? <p className="page-subtitle">Signed in as {admin.email}</p> : null}
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>API Status</h2>
          {health.status === "loading" ? <StateMessage title="Checking API" /> : null}
          {health.status === "error" ? (
            <StateMessage title="API unavailable" description={health.message} tone="error" />
          ) : null}
          {health.status === "success" ? (
            <StateMessage
              title="API connected"
              description={`${health.data.service} is ${health.data.status}`}
              tone="success"
            />
          ) : null}
        </section>

        <section className="panel">
          <h2>Session</h2>
          {sessionCheck.status === "loading" ? <StateMessage title="Checking session" /> : null}
          {sessionCheck.status === "error" ? (
            <StateMessage title="Session invalid" description={sessionCheck.message} tone="error" />
          ) : null}
          {sessionCheck.status === "success" ? (
            <StateMessage title="Admin session active" description={sessionCheck.data.service} tone="success" />
          ) : null}
        </section>
      </div>
    </section>
  );
};
