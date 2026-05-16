import { useAuth } from '../context/AuthContext';
import { LogOut, Moon, Bell, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-10">Sozlamalar</h1>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">Bildirishnomalar</p>
                  <p className="text-sm text-gray-400">Mashina harakati haqida xabar olish</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium">Xavfsizlik</p>
                  <p className="text-sm text-gray-400">Ikki faktorli autentifikatsiya</p>
                </div>
              </div>
              <button className="text-blue-500 text-sm font-medium">Yoqish →</button>
            </div>
          </div>

          <div
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-3xl p-6 flex items-center gap-4 cursor-pointer transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <div>
              <p className="font-medium">Tizimdan chiqish</p>
              <p className="text-sm">Hisobingizdan chiqish</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;