import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Shield, Bell, User, LogOut, Settings, AlertTriangle, Activity, MapPin, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import db from '../utils/db';

// Ustaxona manzili — keyinroq o'zgartirasiz
const WORKSHOP = {
  name: "AutoGuard O'rnatish Markazi",
  address: "Toshkent, Yunusobod tumani, Amir Temur ko'chasi 15",
  phone: "+998 71 123 45 67",
  workingHours: "Du-Sha: 9:00 - 18:00",
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unresolved, setUnresolved] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);

  const isFullyProtected = !!(user?.hasCarCamera && user?.hasCarGPS && user?.hasCarBlocker);
  const missingDevices = [
    !user?.hasCarCamera  && 'Kamera',
    !user?.hasCarGPS     && 'GPS',
    !user?.hasCarBlocker && 'Motor bloklash',
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (!user) return;
    setUnresolved(db.getUnresolvedAlerts(user.id).length);
    setTotalVehicles(db.getVehiclesByUserId(user.id).length);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Car className="w-6 h-6"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AutoCarGuard</h1>
              <p className="text-xs text-gray-500 -mt-1">Mashina himoyasi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unresolved > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-2xl text-sm">
                <Bell size={14}/> {unresolved}
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-2xl">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={() => navigate('/settings')} className="p-2.5 hover:bg-gray-800 rounded-2xl transition-colors">
              <Settings size={20}/>
            </button>
            <button onClick={() => { logout(); navigate('/auth'); }} className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-2xl transition-colors">
              <LogOut size={20}/>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Xush kelibsiz */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h2 className="text-3xl font-bold">Xush kelibsiz, {user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-gray-400 mt-1 text-sm">
            {user?.jshshr ? `JSHSHR: ${user.jshshr}` : ''}
            {user?.carPlate ? ` · ${user.carPlate}` : ''}
          </p>
        </motion.div>

        {/* ── HIMOYA HOLATI BANNER ───────────────── */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
          {isFullyProtected ? (
            /* TO'LIQ HIMOYADA */
            <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-400"/>
                </div>
                <div>
                  <p className="text-green-400 font-bold text-xl">✅ Mashinangiz to'liq himoyada!</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Kamera · GPS · Motor bloklash — hammasi ulangan
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  {icon:'📷', label:'Kamera', ok: user?.hasCarCamera},
                  {icon:'📡', label:'GPS',    ok: user?.hasCarGPS},
                  {icon:'🔒', label:'Bloklash',ok: user?.hasCarBlocker},
                ].map(item => (
                  <div key={item.label} className="bg-green-500/10 rounded-2xl p-3 text-center">
                    <p className="text-2xl">{item.icon}</p>
                    <p className="text-xs text-green-400 mt-1 font-medium">{item.label} ✓</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* HIMOYADA EMAS */
            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <WifiOff className="w-8 h-8 text-red-400"/>
                </div>
                <div>
                  <p className="text-red-400 font-bold text-xl">⚠️ Mashinangiz himoyada emas!</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Quyidagi qurilmalar yo'q: <span className="text-red-400">{missingDevices.join(', ')}</span>
                  </p>
                </div>
              </div>

              {/* Qurilmalar holati */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  {icon:'📷', label:'Kamera',   ok: user?.hasCarCamera},
                  {icon:'📡', label:'GPS',       ok: user?.hasCarGPS},
                  {icon:'🔒', label:'Bloklash',  ok: user?.hasCarBlocker},
                ].map(item => (
                  <div key={item.label} className={`rounded-2xl p-3 text-center border ${
                    item.ok ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <p className="text-2xl">{item.icon}</p>
                    <p className={`text-xs mt-1 font-medium ${item.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {item.label} {item.ok ? '✓' : '✗'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Hozircha telefon ishlaydi */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-4 text-sm text-blue-300">
                📱 Hozircha <strong>telefon kamerasi va GPS</strong> orqali ishlayapti
              </div>

              {/* Ustaxona manzili */}
              <div className="bg-gray-800/80 rounded-2xl p-4">
                <p className="text-yellow-400 font-semibold text-sm mb-2">🔧 Qurilma o'rnatish uchun:</p>
                <p className="text-white font-bold">{WORKSHOP.name}</p>
                <p className="text-gray-400 text-sm mt-1">📍 {WORKSHOP.address}</p>
                <p className="text-gray-400 text-sm">📞 {WORKSHOP.phone}</p>
                <p className="text-gray-500 text-xs mt-1">🕐 {WORKSHOP.workingHours}</p>
                <p className="text-green-400 text-sm mt-2 font-medium">
                  "Shu joyga borsangiz, qurilmalarni o'rnatib berishadi"
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Mashina ma'lumoti */}
        {user?.carPlate && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <Car className="w-8 h-8"/>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{user.carModel}</p>
                <p className="text-gray-400 tracking-widest text-lg">{user.carPlate}</p>
                {user.carColor && <p className="text-gray-500 text-sm">{user.carColor} · {user.carYear}</p>}
              </div>
              <div className={`px-4 py-2 rounded-2xl text-sm font-medium ${
                isFullyProtected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isFullyProtected ? '🛡️ Himoyada' : '⚠️ Himoyasiz'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tezkor harakatlar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div whileHover={{scale:1.02}} onClick={() => navigate('/monitor')}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-7 cursor-pointer shadow-lg shadow-blue-500/20">
            <Shield className="w-10 h-10 mb-3"/>
            <h3 className="text-xl font-bold">Monitor</h3>
            <p className="text-blue-200 text-sm mt-1">
              {isFullyProtected ? 'Mashina kamerasi va GPS' : 'Telefon kamerasi va GPS'}
            </p>
          </motion.div>

          <motion.div whileHover={{scale:1.02}} onClick={() => navigate('/vehicles')}
            className="bg-gray-900 border border-gray-700 rounded-3xl p-7 cursor-pointer hover:border-gray-500 transition-all">
            <Activity className="w-10 h-10 mb-3 text-cyan-400"/>
            <h3 className="text-xl font-bold">Mashinalarim</h3>
            <p className="text-gray-400 text-sm mt-1">
              {totalVehicles > 0 ? `${totalVehicles} ta mashina` : "Mashina qo'shish"}
            </p>
          </motion.div>

          <motion.div whileHover={{scale:1.02}} onClick={() => navigate('/profile')}
            className="bg-gray-900 border border-gray-700 rounded-3xl p-7 cursor-pointer hover:border-gray-500 transition-all">
            <User className="w-10 h-10 mb-3 text-purple-400"/>
            <h3 className="text-xl font-bold">Profil</h3>
            <p className="text-gray-400 text-sm mt-1">Shaxsiy ma'lumotlar</p>
          </motion.div>
        </div>

        {/* Agar ogohlantirish bo'lsa */}
        {unresolved > 0 && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 flex items-center gap-4">
            <AlertTriangle className="text-red-400 w-8 h-8 shrink-0"/>
            <div>
              <p className="font-bold text-red-400">{unresolved} ta hal qilinmagan ogohlantirish</p>
              <p className="text-gray-400 text-sm">Monitor sahifasida ko'ring</p>
            </div>
            <button onClick={() => navigate('/monitor')}
              className="ml-auto bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-2xl text-red-400 text-sm transition-all">
              Ko'rish →
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
