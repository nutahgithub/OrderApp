import { Outlet } from "react-router-dom";

export const CustomerLayout = () => {
  return (
    <main className="customer-shell">
      <Outlet />
    </main>
  );
};

