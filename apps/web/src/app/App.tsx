import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { CustomerLayout } from "../components/layout/CustomerLayout";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { CustomerQrEntryPage } from "../pages/customer/CustomerQrEntryPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
        <Route element={<CustomerLayout />}>
          <Route path="/qr/:tenantId/:branchId/:tableId" element={<CustomerQrEntryPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

