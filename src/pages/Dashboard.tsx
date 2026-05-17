import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Shield, Bell, User, LogOut, Settings, AlertTriangle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import db from '../utils/db';

interface Stats {
  totalVehicles: number;
  activeVehicles: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  totalTrips: number;
  totalDistance: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    activeVehicles: 0,
    totalAlerts: 0,
    unresolvedAlerts: 0,
    totalTrips: 0,
    totalDistance: '0',
  });
  const [unresolved, setUnresolved] = useState(0);

  useEffect(() => {
    if (!user) return;
    const s = db.getStats(user.id);
    setStats(s);
    setUnresolved(db.getUnresolvedAlerts(user.id).length);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const statCards = [
    {
      label: 'Holat',
      value: unresolved > 0 ? `${unresolved} ogohlantirish` : 'Himoyalangan',
      color: unresolved > 0 ? 'text-red-400' : 'text-green-500',
      icon: unresolved > 0 ? AlertTriangle : Shield,
    },
    {
      label: 'Mashinalar',
      value: `${stats.activeVehicles} / ${stats.totalVehicles} aktiv`,
      color: 'text-blue-400',
      icon: Car,
    },
    {
      label: 'Jami sayohatlar',
      value: stats.totalTrips.toString(),
      color: 'text-purple-400',
      icon: Activity,
    },
    {
      label: 'Jami masofa',
      value: `${stats.totalDistance} km`,
      color: 'text-yellow-400',
      icon: Activity,
    },
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

          <div className="flex items-center gap-3">
            {unresolved > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-2xl text-sm">
                <Bell size={14} />
                {unresolved} ogohlantirish
              </div>
            )}

            <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-2xl">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="p-3 hover:bg-gray-800 rounded-2xl transition-colors"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={handleLogout}
              className="p-3 hover:bg-red-500/10 text-red-500 rounded-2xl transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-4xl font-bold">
            Xush kelibsiz, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-400 mt-2">
            {unresolved > 0
              ? `${unresolved} ta hal qilinmagan ogohlantirish mavjud`
              : 'Sizning mashinangiz xavfsiz himoyada'}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-gray-900 border border-gray-800 rounded-3xl p-5 hover:border-gray-700 transition-all"
              >
                <Icon size={20} className={`mb-3 ${stat.color}`} />
                <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/monitor')}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Shield className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold">Monitor</h3>
            <p className="text-blue-200 mt-2">GPS va kamera orqali real vaqt kuzatuv</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/vehicles')}
            className="bg-gray-900 border border-gray-700 rounded-3xl p-8 cursor-pointer hover:border-gray-500 transition-all"
          >
            <Car className="w-12 h-12 mb-4 text-cyan-400" />
            <h3 className="text-2xl font-bold">Mashinalarim</h3>
            <p className="text-gray-400 mt-2">
              {stats.totalVehicles > 0
                ? `${stats.totalVehicles} ta mashina ro'yxatda`
                : "Mashina qo'shish uchun bosing"}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/profile')}
            className="bg-gray-900 border border-gray-700 rounded-3xl p-8 cursor-pointer hover:border-gray-500 transition-all"
          >
            <User className="w-12 h-12 mb-4 text-purple-400" />
            <h3 className="text-2xl font-bold">Profil</h3>
            <p className="text-gray-400 mt-2">
              {user?.carModel
                ? `${user.carModel} • ${user.carPlate}`
                : 'Shaxsiy ma\'lumotlar va sozlamalar'}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
