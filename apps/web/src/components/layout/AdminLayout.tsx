import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { Button } from "../ui/Button";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Branches", to: "/admin/branches" },
  { label: "Tables", to: "/admin/tables" },
  { label: "Menus", to: "/admin/menus" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Payments", to: "/admin/payments" }
];

export const AdminLayout = () => {
  const { admin, logout } = useAuth();
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
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button type="button" className="button--secondary" onClick={handleLogout}>
          Logout
        </Button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};
