import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPage from '../pages/AuthPage';
import Dashboard from '../pages/Dashboard';
import MonitorPage from '../pages/MonitorPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import VehiclesPage from '../pages/VehiclesPage';

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/" element={<Protected><Dashboard /></Protected>} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="/monitor" element={<Protected><MonitorPage /></Protected>} />
    <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
    <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
    <Route path="/vehicles" element={<Protected><VehiclesPage /></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
