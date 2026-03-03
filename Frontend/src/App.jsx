import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminDashboard from './pages/admin/Dashboard';
import UploadDetect from './pages/admin/UploadDetect';
import Violations from './pages/admin/Violations';
import Analytics from './pages/admin/Analytics';

import CitizenPortal from './pages/user/CitizenPortal';
import MyViolations from './pages/user/MyViolations';
import Payments from './pages/user/Payments';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            borderRadius: '8px',
            padding: '12px 16px',
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/upload" element={<UploadDetect />} />
          <Route path="/admin/violations" element={<Violations />} />
          <Route path="/admin/analytics" element={<Analytics />} />
        </Route>

        {/* User / Citizen Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/user/portal" element={<CitizenPortal />} />
          <Route path="/user/my-violations" element={<MyViolations />} />
          <Route path="/user/payments" element={<Payments />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
