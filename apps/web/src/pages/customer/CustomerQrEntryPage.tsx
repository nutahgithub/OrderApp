import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StateMessage } from "../../components/ui/StateMessage";
import { apiClient } from "../../lib/api/client";
import type { QrEntry } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";

type QrRouteParams = {
  tenantId: string;
  branchId: string;
  tableId: string;
};

export const CustomerQrEntryPage = () => {
  const { tenantId, branchId, tableId } = useParams<QrRouteParams>();
  const [qrEntryState, setQrEntryState] = useState<
    | { status: "loading" }
    | { status: "success"; qrEntry: QrEntry }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (!tenantId || !branchId || !tableId) {
      setQrEntryState({
        status: "error",
        message: "This table link is missing required data."
      });
      return;
    }

    let isMounted = true;

    const loadQrEntry = async () => {
      setQrEntryState({ status: "loading" });

      try {
        const response = await apiClient.getQrEntry(tenantId, branchId, tableId);

        if (isMounted) {
          setQrEntryState({ status: "success", qrEntry: response.qrEntry });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setQrEntryState({ status: "error", message: getUserErrorMessage(error) });
        }
      }
    };

    void loadQrEntry();

    return () => {
      isMounted = false;
    };
  }, [branchId, tableId, tenantId]);

  if (!tenantId || !branchId || !tableId) {
    return <StateMessage title="Invalid QR" description="This table link is missing required data." tone="error" />;
  }

  if (qrEntryState.status === "loading") {
    return <StateMessage title="Checking table" description="Please wait while we verify this QR link." />;
  }

  if (qrEntryState.status === "error") {
    return <StateMessage title="Invalid QR" description={qrEntryState.message} tone="error" />;
  }

  const { qrEntry } = qrEntryState;
  const isDisabled = qrEntry.table.status === "DISABLED";

  return (
    <section className="customer-card">
      <p className="eyebrow">Table order</p>
      <h1>{qrEntry.table.name}</h1>
      <dl className="qr-context">
        <div>
          <dt>Branch</dt>
          <dd>{qrEntry.branch.name}</dd>
        </div>
        <div>
          <dt>Table status</dt>
          <dd>{qrEntry.table.status}</dd>
        </div>
        <div>
          <dt>Tenant</dt>
          <dd>{qrEntry.tenantId}</dd>
        </div>
      </dl>
      {isDisabled ? (
        <StateMessage
          title="This table is unavailable"
          description="Please ask staff for a new QR link."
          tone="error"
        />
      ) : (
        <StateMessage title="Menu coming next" description="Step 05 will connect this page to active menu items." />
      )}
    </section>
  );
};
