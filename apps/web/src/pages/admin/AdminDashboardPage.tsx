import { useEffect, useState } from "react";
import { StateMessage } from "../../components/ui/StateMessage";
import { apiClient } from "../../lib/api/client";
import type { HealthResponse } from "../../lib/api/types";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export const AdminDashboardPage = () => {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

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

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Dashboard</h1>
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
          <h2>Next Slice</h2>
          <p>Step 02 will add admin authentication and a working login flow.</p>
        </section>
      </div>
    </section>
  );
};

