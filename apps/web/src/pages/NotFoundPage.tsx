import { Link } from "react-router-dom";
import { StateMessage } from "../components/ui/StateMessage";

export const NotFoundPage = () => {
  return (
    <main className="center-page">
      <StateMessage title="Page not found" description="The route does not exist yet." />
      <Link to="/admin/dashboard">Go to dashboard</Link>
    </main>
  );
};

