import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPage from '../pages/AuthPage';
import Dashboard from '../pages/Dashboard';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import VehiclesPage from '../pages/VehiclesPage';
import MonitorPage from '../pages/MonitorPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Yuklanmoqda...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      <Route path="/vehicles" element={
        <ProtectedRoute>
          <VehiclesPage />
        </ProtectedRoute>
      } />

      <Route path="/monitor" element={
        <ProtectedRoute>
          <MonitorPage />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;