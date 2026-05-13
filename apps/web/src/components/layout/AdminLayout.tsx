import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Branches", to: "/admin/branches" },
  { label: "Tables", to: "/admin/tables" },
  { label: "Menus", to: "/admin/menus" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Payments", to: "/admin/payments" }
];

export const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">Smart Restaurant OS</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

