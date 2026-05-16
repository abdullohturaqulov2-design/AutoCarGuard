import { useAuth } from '../context/AuthContext';
import { Car, Shield, Bell, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const stats = [
    { label: "Holat", value: "Himoyalangan", color: "text-green-500" },
    { label: "Oxirgi faollik", value: "2 daqiqa oldin" },
    { label: "Mashina", value: user?.carModel || "Toyota Camry" },
    { label: "Raqam", value: user?.carPlate || "01 A 777 AA" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AutoCarGuard</h1>
              <p className="text-xs text-gray-500 -mt-1">Mashina himoyasi</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-2xl">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="p-3 hover:bg-gray-800 rounded-2xl transition-colors"
            >
              <Settings size={22} />
            </button>

            <button
              onClick={handleLogout}
              className="p-3 hover:bg-red-500/10 text-red-500 rounded-2xl transition-colors"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-4xl font-bold">Xush kelibsiz, {user?.name?.split(" ")[0]}!</h2>
          <p className="text-gray-400 mt-2">Sizning mashinangiz xavfsiz himoyada</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all"
            >
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className={`text-2xl font-semibold mt-2 ${stat.color || ''}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/monitor')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 cursor-pointer hover:scale-105 transition-transform"
          >
            <Shield className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold">Monitor</h3>
            <p className="text-blue-200 mt-2">Mashinangizni real vaqtda kuzatish</p>
          </div>

          <div
            onClick={() => navigate('/vehicles')}
            className="bg-gray-900 border border-gray-700 rounded-3xl p-8 cursor-pointer hover:border-white/30 transition-all"
          >
            <Car className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold">Mashinalarim</h3>
            <p className="text-gray-400 mt-2">Barcha transport vositalarini boshqarish</p>
          </div>

          <div
            onClick={() => navigate('/profile')}
            className="bg-gray-900 border border-gray-700 rounded-3xl p-8 cursor-pointer hover:border-white/30 transition-all"
          >
            <User className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold">Profil</h3>
            <p className="text-gray-400 mt-2">Shaxsiy ma'lumotlar va sozlamalar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;