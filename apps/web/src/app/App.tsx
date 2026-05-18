import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { CustomerLayout } from "../components/layout/CustomerLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { AdminBranchesPage } from "../pages/admin/AdminBranchesPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminMenusPage } from "../pages/admin/AdminMenusPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminTablesPage } from "../pages/admin/AdminTablesPage";
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
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/branches" element={<AdminBranchesPage />} />
              <Route path="/admin/tables" element={<AdminTablesPage />} />
              <Route path="/admin/menus" element={<AdminMenusPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
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
