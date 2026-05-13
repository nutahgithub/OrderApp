import { useParams } from "react-router-dom";
import { StateMessage } from "../../components/ui/StateMessage";

type QrRouteParams = {
  tenantId: string;
  branchId: string;
  tableId: string;
};

export const CustomerQrEntryPage = () => {
  const { tenantId, branchId, tableId } = useParams<QrRouteParams>();

  if (!tenantId || !branchId || !tableId) {
    return <StateMessage title="Invalid QR" description="This table link is missing required data." tone="error" />;
  }

  return (
    <section className="customer-card">
      <p className="eyebrow">Table order</p>
      <h1>Welcome</h1>
      <dl className="qr-context">
        <div>
          <dt>Tenant</dt>
          <dd>{tenantId}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{branchId}</dd>
        </div>
        <div>
          <dt>Table</dt>
          <dd>{tableId}</dd>
        </div>
      </dl>
      <StateMessage title="Menu coming next" description="Step 05 will connect this page to active menu items." />
    </section>
  );
};

