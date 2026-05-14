import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { CustomerLayout } from "../components/layout/CustomerLayout";
import { AuthProvider } from "../features/auth/AuthContext";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { I18nProvider } from "../lib/i18n/I18nContext";
import { AdminBranchesPage } from "../pages/admin/AdminBranchesPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminMenusPage } from "../pages/admin/AdminMenusPage";
import { AdminTablesPage } from "../pages/admin/AdminTablesPage";
import { CustomerQrEntryPage } from "../pages/customer/CustomerQrEntryPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const App = () => {
  return (
    <I18nProvider>
      <AuthProvider>
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
              </Route>
            </Route>
            <Route element={<CustomerLayout />}>
              <Route path="/qr/:tenantId/:branchId/:tableId" element={<CustomerQrEntryPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
};
