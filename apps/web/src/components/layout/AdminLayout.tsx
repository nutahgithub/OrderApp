import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { Button } from "../ui/Button";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

const navItems = [
  { labelKey: MessageKey.NavDashboard, to: "/admin/dashboard" },
  { labelKey: MessageKey.NavBranches, to: "/admin/branches" },
  { labelKey: MessageKey.NavTables, to: "/admin/tables" },
  { labelKey: MessageKey.NavMenus, to: "/admin/menus" },
  { labelKey: MessageKey.NavOrders, to: "/admin/orders" },
  { labelKey: MessageKey.NavPayments, to: "/admin/payments" }
];

export const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand">Smart Restaurant OS</div>
          {admin ? (
            <div className="admin-profile">
              <strong>{admin.name}</strong>
              <span>{admin.tenant.name}</span>
            </div>
          ) : null}
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <LanguageSwitcher />
        <Button type="button" className="button--secondary" onClick={handleLogout}>
          {t(MessageKey.AuthLogout)}
        </Button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};
