import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Car, Settings, User, Bell, MapPin, AlertTriangle,
  Camera, Mic, Wifi, Activity, ChevronRight, Lock, Unlock,
  Navigation, Eye, Volume2, Phone, X, CheckCircle, Clock,
  Zap, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, Alert } from '../utils/db';
import ProfilePage from './ProfilePage';
import VehiclesPage from './VehiclesPage';
import SettingsPage from './SettingsPage';
import MonitorPage from './MonitorPage';

type Tab = 'dashboard' | 'profile' | 'vehicles' | 'settings' | 'monitor';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({ totalVehicles: 0, activeVehicles: 0, totalAlerts: 0, unresolvedAlerts: 0, totalTrips: 0, totalDistance: '0' });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlert, setShowAlert] = useState<Alert | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    const s = db.getStats(user.id);
    setStats(s);
    const a = db.getUnresolvedAlerts(user.id);
    setAlerts(a);
    if (a.length > 0 && !showAlert) setShowAlert(a[0]);
  }, [user, activeTab]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user) return null;

  const vehicles = db.getVehiclesByUserId(user.id);
  const settings = db.getSettingsByUserId(user.id);

  const handleAlertAction = (alertId: string, action: 'sos' | 'self_handle') => {
    db.updateAlert(alertId, { resolved: true, userAction: action });
    if (action === 'sos') {
      alert(`🚨 SOS! Yo'q nömresi 102 ga qo'ng'iroq qilinyapti...\n\n📍 Manzil: Toshkent, Yunusobod tumani\n🚗 Mashina: ${vehicles[0]?.plateNumber || 'Noma\'lum'}\n📞 ${user.phone || '+998901234567'}\n\nPolitsiyaga barcha ma'lumotlar yuborildi!`);
    }
    setShowAlert(null);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Alert Modal */}
      <AnimatePresence>
        {showAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-gray-900 border-2 border-red-600 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <AlertTriangle size={32} className="text-white" />
                </div>
                <h3 className="text-red-400 font-bold text-lg">⚠️ OGOHLANTIRISH!</h3>
                <p className="text-white font-semibold mt-1">{showAlert.message}</p>
                <p className="text-gray-400 text-sm mt-1">{new Date(showAlert.timestamp).toLocaleTimeString('uz-UZ')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleAlertAction(showAlert.id, 'sos')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2">
                  <Phone size={18} /> SOS
                </button>
                <button onClick={() => handleAlertAction(showAlert.id, 'self_handle')}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-2xl transition-all text-sm">
                  O'zim hal qilaman
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">AutoGuard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-white text-xs font-medium">{currentTime.toLocaleTimeString('uz-UZ')}</div>
              <div className="text-gray-500 text-xs">{currentTime.toLocaleDateString('uz-UZ')}</div>
            </div>
            {alerts.length > 0 && (
              <button onClick={() => setShowAlert(alerts[0])}
                className="relative w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center">
                <Bell size={16} className="text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {alerts.length}
                </span>
              </button>
            )}
            <button onClick={logout} className="w-8 h-8 bg-gray-700 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user.name[0]}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
              {/* Greeting */}
              <div className="mb-5">
                <h2 className="text-white text-2xl font-bold">Salom, {user.name.split(' ')[0]}! 👋</h2>
                <p className="text-gray-400 text-sm mt-1">Mashinalaringiz holati</p>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Car size={20} className="text-blue-200" />
                    <span className="text-blue-200 text-xs">Jami</span>
                  </div>
                  <div className="text-white text-3xl font-bold">{stats.totalVehicles}</div>
                  <div className="text-blue-200 text-sm">Mashina</div>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity size={20} className="text-green-200" />
                    <span className="text-green-200 text-xs">Faol</span>
                  </div>
                  <div className="text-white text-3xl font-bold">{stats.activeVehicles}</div>
                  <div className="text-green-200 text-sm">Monitoring</div>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle size={20} className="text-orange-200" />
                    <span className="text-orange-200 text-xs">Aktiv</span>
                  </div>
                  <div className="text-white text-3xl font-bold">{stats.unresolvedAlerts}</div>
                  <div className="text-orange-200 text-sm">Ogohlantirish</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Navigation size={20} className="text-purple-200" />
                    <span className="text-purple-200 text-xs">Jami</span>
                  </div>
                  <div className="text-white text-3xl font-bold">{stats.totalTrips}</div>
                  <div className="text-purple-200 text-sm">Sayohat</div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gray-900 rounded-2xl p-4 mb-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" /> Tizim holati
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera size={16} className="text-blue-400" />
                      <span className="text-gray-300 text-sm">Kamera</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${settings?.cameraQuality ? 'text-green-400' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${settings?.cameraQuality ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                      {settings?.cameraQuality || 'Sozlanmagan'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation size={16} className="text-green-400" />
                      <span className="text-gray-300 text-sm">GPS</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${settings?.gpsEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${settings?.gpsEnabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                      {settings?.gpsEnabled ? 'Yoqilgan' : 'O\'chirilgan'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic size={16} className="text-purple-400" />
                      <span className="text-gray-300 text-sm">Mikrofon</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${settings?.microphoneEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${settings?.microphoneEnabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                      {settings?.microphoneEnabled ? 'Yoqilgan' : 'O\'chirilgan'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi size={16} className="text-cyan-400" />
                      <span className="text-gray-300 text-sm">Ulanish</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      Online
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicles Quick View */}
              {vehicles.length > 0 ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">Mashinalarim</h3>
                    <button onClick={() => setActiveTab('vehicles')} className="text-blue-400 text-sm flex items-center gap-1">
                      Barchasi <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {vehicles.slice(0, 2).map(v => (
                      <div key={v.id} className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.status === 'active' ? 'bg-blue-600' : v.status === 'stolen' ? 'bg-red-600' : 'bg-gray-700'}`}>
                            <Car size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{v.brand} {v.model}</p>
                            <p className="text-gray-400 text-xs">{v.plateNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                            v.status === 'active' ? 'bg-blue-900/50 text-blue-400' :
                            v.status === 'parked' ? 'bg-green-900/50 text-green-400' :
                            v.status === 'stolen' ? 'bg-red-900/50 text-red-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {v.status === 'active' ? '🟢 Faol' : v.status === 'parked' ? '🅿️ Parkovka' : v.status === 'stolen' ? '🚨 Oʻgʻirlangan' : 'Noma\'lum'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button onClick={() => setActiveTab('vehicles')}
                  className="w-full bg-gray-900 border-2 border-dashed border-gray-700 rounded-2xl p-6 text-center mb-4 hover:border-blue-600 transition-all">
                  <Car size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 font-medium">Mashina qo'shing</p>
                  <p className="text-gray-600 text-sm">GPS va kamera bilan ulang</p>
                </button>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => setActiveTab('monitor')}
                  className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-4 text-left transition-all border border-gray-800 hover:border-blue-600">
                  <Eye size={24} className="text-blue-400 mb-2" />
                  <p className="text-white font-semibold text-sm">Monitoring</p>
                  <p className="text-gray-500 text-xs">Real vaqt kuzatuv</p>
                </button>
                <button onClick={() => setActiveTab('vehicles')}
                  className="bg-gray-900 hover:bg-gray-800 rounded-2xl p-4 text-left transition-all border border-gray-800 hover:border-green-600">
                  <MapPin size={24} className="text-green-400 mb-2" />
                  <p className="text-white font-semibold text-sm">Mashina manzili</p>
                  <p className="text-gray-500 text-xs">Qayerda turganini bil</p>
                </button>
              </div>

              {/* Security Features */}
              <div className="bg-gray-900 rounded-2xl p-4 mb-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-blue-400" /> Xavfsizlik xususiyatlari
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Camera, label: 'Video yozish', active: true, color: 'blue' },
                    { icon: Navigation, label: 'GPS tracking', active: settings?.gpsEnabled ?? true, color: 'green' },
                    { icon: Eye, label: 'Yuz tanish', active: true, color: 'purple' },
                    { icon: AlertTriangle, label: 'Qurol sensori', active: true, color: 'red' },
                    { icon: Volume2, label: 'Ovoz yozish', active: settings?.microphoneEnabled ?? true, color: 'yellow' },
                    { icon: Lock, label: 'Motor bloklash', active: true, color: 'orange' },
                  ].map((feat, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-xl ${feat.active ? 'bg-gray-800' : 'bg-gray-800/50'}`}>
                      <feat.icon size={14} className={feat.active ? `text-${feat.color}-400` : 'text-gray-600'} />
                      <span className={`text-xs ${feat.active ? 'text-gray-300' : 'text-gray-600'}`}>{feat.label}</span>
                      {feat.active && <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto animate-pulse"></div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Alerts */}
              {alerts.length > 0 && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-4">
                  <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} /> Aktiv ogohlantirishlar
                  </h3>
                  {alerts.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-red-800/30 last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{a.message}</p>
                        <p className="text-gray-500 text-xs">{new Date(a.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <button onClick={() => setShowAlert(a)} className="text-red-400 text-xs hover:text-red-300 ml-2">Ko'rish</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="bg-gray-900 rounded-2xl p-4 mt-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" /> Statistika
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-white text-xl font-bold">{stats.totalTrips}</div>
                    <div className="text-gray-500 text-xs">Sayohatlar</div>
                  </div>
                  <div>
                    <div className="text-white text-xl font-bold">{stats.totalDistance}</div>
                    <div className="text-gray-500 text-xs">km</div>
                  </div>
                  <div>
                    <div className="text-white text-xl font-bold">{db.getKnownFacesByUserId(user.id).length}</div>
                    <div className="text-gray-500 text-xs">Tanish yuzlar</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto">
              <ProfilePage />
            </motion.div>
          )}
          {activeTab === 'vehicles' && (
            <motion.div key="vehicles" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto">
              <VehiclesPage />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto">
              <SettingsPage />
            </motion.div>
          )}
          {activeTab === 'monitor' && (
            <motion.div key="monitor" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="h-full overflow-y-auto">
              <MonitorPage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {([
            { id: 'dashboard', icon: Shield, label: 'Asosiy' },
            { id: 'monitor', icon: Eye, label: 'Monitor' },
            { id: 'vehicles', icon: Car, label: 'Mashinalar' },
            { id: 'profile', icon: User, label: 'Profil' },
            { id: 'settings', icon: Settings, label: 'Sozlamalar' },
          ] as { id: Tab; icon: typeof Shield; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}>
              <tab.icon size={22} className={activeTab === tab.id ? 'text-blue-400' : ''} />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
