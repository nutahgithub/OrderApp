import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { CustomerLayout } from "../components/layout/CustomerLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { managerRoles, staffOperationRoles } from "../features/auth/rbac";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminBranchesPage } from "../pages/admin/AdminBranchesPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminMenusPage } from "../pages/admin/AdminMenusPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminTableSalesPage } from "../pages/admin/AdminTableSalesPage";
import { AdminTablesPage } from "../pages/admin/AdminTablesPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { CustomerQrEntryPage } from "../pages/customer/CustomerQrEntryPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AppProviders } from "./providers";

export const App = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route element={<ProtectedRoute allowedRoles={managerRoles} />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/branches" element={<AdminBranchesPage />} />
                <Route path="/admin/tables" element={<AdminTablesPage />} />
                <Route path="/admin/menus" element={<AdminMenusPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={staffOperationRoles} />}>
                <Route path="/admin/table-sales" element={<AdminTableSalesPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
              </Route>
            </Route>
          </Route>
          <Route element={<CustomerLayout />}>
            <Route path="/qr/:tenantId/:branchId/:tableId" element={<CustomerQrEntryPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
};
