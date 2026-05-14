import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

export const CustomerLayout = () => {
  return (
    <main className="customer-shell">
      <div className="customer-toolbar">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </main>
  );
};
