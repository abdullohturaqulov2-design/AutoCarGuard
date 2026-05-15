import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Navigation, Mic, Save, CheckCircle, Video, Bell, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, Settings } from '../utils/db';

type QualityOption = '720p' | '1080p' | '4K';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const defaultSettings: Settings = {
    userId: user?.id || '',
    cameraQuality: '1080p',
    gpsEnabled: true,
    microphoneEnabled: true,
    videoSaveEnabled: true,
    notificationsEnabled: true,
    autoCallPolice: false,
    locationUpdateInterval: 5000,
  };

  const [settings, setSettings] = useState<Settings>(() =>
    user ? (db.getSettingsByUserId(user.id) || defaultSettings) : defaultSettings
  );

  const [activeSection, setActiveSection] = useState<'camera' | 'gps' | 'microphone' | 'general'>('camera');

  if (!user) return null;

  const handleSave = () => {
    db.saveSettings({ ...settings, userId: user.id });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const qualities: QualityOption[] = ['720p', '1080p', '4K'];

  const qualityInfo: Record<QualityOption, { label: string; desc: string; size: string }> = {
    '720p': { label: '720p HD', desc: "Oddiy sifat, kam joy egallaydi", size: '1.2 GB/soat' },
    '1080p': { label: '1080p Full HD', desc: "Yuqori sifat, tavsiya etiladi", size: '3.4 GB/soat' },
    '4K': { label: '4K Ultra HD', desc: "Eng yuqori sifat", size: '14 GB/soat' },
  };

  const intervals = [
    { value: 5000, label: '5 soniya' },
    { value: 10000, label: '10 soniya' },
    { value: 30000, label: '30 soniya' },
    { value: 60000, label: '1 daqiqa' },
    { value: 300000, label: '5 daqiqa' },
  ];

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-xl font-bold">Sozlamalar</h2>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all">
          <Save size={14} /> Saqlash
        </button>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-900/30 border border-green-700/50 rounded-xl p-3 mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-green-400 text-sm">Sozlamalar saqlandi!</span>
        </motion.div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {([
          { id: 'camera', icon: Camera, label: 'Kamera' },
          { id: 'gps', icon: Navigation, label: 'GPS' },
          { id: 'microphone', icon: Mic, label: 'Mikrofon' },
          { id: 'general', icon: Shield, label: 'Umumiy' },
        ] as { id: typeof activeSection; icon: typeof Camera; label: string }[]).map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Camera Settings */}
      {activeSection === 'camera' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Kamera sifati</h3>
                <p className="text-gray-400 text-xs">Video yozish sifatini tanlang</p>
              </div>
            </div>

            <div className="space-y-3">
              {qualities.map(q => (
                <button key={q} onClick={() => setSettings({...settings, cameraQuality: q})}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    settings.cameraQuality === q ? 'border-blue-600 bg-blue-600/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}>
                  <div className="text-left">
                    <p className={`font-semibold ${settings.cameraQuality === q ? 'text-blue-400' : 'text-white'}`}>
                      {qualityInfo[q].label}
                    </p>
                    <p className="text-gray-400 text-xs">{qualityInfo[q].desc}</p>
                    <p className="text-gray-500 text-xs">Saqlash: {qualityInfo[q].size}</p>
                  </div>
                  {settings.cameraQuality === q && (
                    <CheckCircle size={20} className="text-blue-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Video size={18} className="text-blue-400" />
                <div>
                  <p className="text-white font-medium">Video saqlash</p>
                  <p className="text-gray-400 text-xs">MicroSD kartaga video yozish</p>
                </div>
              </div>
              <button onClick={() => setSettings({...settings, videoSaveEnabled: !settings.videoSaveEnabled})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.videoSaveEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.videoSaveEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-400 text-xs">📌 Video va rasmlar MicroSD kartaga kunlik saqlanadi. Ovoz yozish mikrofon sozlamalarida boshqariladi.</p>
            </div>
          </div>

          {/* Camera Preview */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Camera size={14} className="text-blue-400" /> Kamera ko'rinishi
            </h4>
            <div className="bg-gray-800 rounded-xl h-32 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 opacity-10">
                {Array.from({length:6}).map((_,i)=><div key={i} className="border border-gray-400"></div>)}
              </div>
              <div className="text-center">
                <Camera size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Kamera tasviri</p>
                <p className="text-gray-600 text-xs">{settings.cameraQuality}</p>
              </div>
              <div className="absolute top-2 left-2 bg-red-600 rounded-full w-3 h-3 animate-pulse"></div>
              <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-0.5">
                <span className="text-white text-xs">● REC</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* GPS Settings */}
      {activeSection === 'gps' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Navigation size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">GPS Sozlamalari</h3>
                <p className="text-gray-400 text-xs">Joylashuv kuzatuvini boshqaring</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-2xl mb-4">
              <div>
                <p className="text-white font-semibold">GPS yoqish/o'chirish</p>
                <p className="text-gray-400 text-sm">Joylashuv kuzatuvini boshqarish</p>
              </div>
              <button onClick={() => setSettings({...settings, gpsEnabled: !settings.gpsEnabled})}
                className={`w-14 h-7 rounded-full transition-all relative ${settings.gpsEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.gpsEnabled ? 'left-8' : 'left-1'}`}></div>
              </button>
            </div>

            {settings.gpsEnabled && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div>
                  <p className="text-white font-medium mb-2">Yangilanish oralig'i</p>
                  <div className="space-y-2">
                    {intervals.map(interval => (
                      <button key={interval.value}
                        onClick={() => setSettings({...settings, locationUpdateInterval: interval.value})}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          settings.locationUpdateInterval === interval.value ? 'border-green-600 bg-green-600/10 text-green-400' : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                        }`}>
                        <span className="text-sm">{interval.label}</span>
                        {settings.locationUpdateInterval === interval.value && <CheckCircle size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GPS Status */}
                <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-medium text-sm">GPS Faol</span>
                  </div>
                  <p className="text-gray-400 text-xs">Toshkent, O'zbekiston</p>
                  <p className="text-gray-500 text-xs">So'nggi yangilanish: {new Date().toLocaleTimeString('uz-UZ')}</p>
                </div>
              </motion.div>
            )}

            {!settings.gpsEnabled && (
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <Navigation size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">GPS o'chirilgan</p>
                <p className="text-gray-600 text-xs">Joylashuvni kuzatish mumkin emas</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Microphone Settings */}
      {activeSection === 'microphone' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Mic size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Mikrofon Sozlamalari</h3>
                <p className="text-gray-400 text-xs">Ovoz yozishni boshqaring</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-2xl mb-4">
              <div>
                <p className="text-white font-semibold">Ovoz yozish</p>
                <p className="text-gray-400 text-sm">Video davomida ovoz yozilsin</p>
              </div>
              <button onClick={() => setSettings({...settings, microphoneEnabled: !settings.microphoneEnabled})}
                className={`w-14 h-7 rounded-full transition-all relative ${settings.microphoneEnabled ? 'bg-purple-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.microphoneEnabled ? 'left-8' : 'left-1'}`}></div>
              </button>
            </div>

            {settings.microphoneEnabled && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-purple-900/20 border border-purple-800/50 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-purple-400 font-medium text-sm">Mikrofon faol</span>
                  </div>
                  {/* Sound Wave Animation */}
                  <div className="flex items-center justify-center gap-1 h-10">
                    {Array.from({length: 12}).map((_, i) => (
                      <motion.div key={i}
                        className="w-1.5 bg-purple-500 rounded-full"
                        animate={{ height: [8, Math.random() * 30 + 10, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">✅ Ovoz video bilan birga yoziladi va MicroSD kartaga saqlanadi.</p>
                </div>
              </motion.div>
            )}

            {!settings.microphoneEnabled && (
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <Mic size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Mikrofon o'chirilgan</p>
                <p className="text-gray-600 text-xs">Video ovozi yozilmaydi</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* General Settings */}
      {activeSection === 'general' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Xavfsizlik sozlamalari</h3>
                <p className="text-gray-400 text-xs">Asosiy himoya parametrlari</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-yellow-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Bildirishnomalar</p>
                    <p className="text-gray-400 text-xs">Push xabarlar olish</p>
                  </div>
                </div>
                <button onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.notificationsEnabled ? 'bg-yellow-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notificationsEnabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Zap size={16} className="text-red-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Avto politsiya chaqirish</p>
                    <p className="text-gray-400 text-xs">O'g'irlik aniqlananda 102 ga qo'ng'iroq</p>
                  </div>
                </div>
                <button onClick={() => setSettings({...settings, autoCallPolice: !settings.autoCallPolice})}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.autoCallPolice ? 'bg-red-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoCallPolice ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">Ilova haqida</h3>
            <div className="space-y-2">
              {[
                { label: 'Versiya', value: '1.0.0' },
                { label: "Ma'lumotlar bazasi", value: 'autoguard.db' },
                { label: 'Til', value: "O'zbek" },
                { label: 'Ishlab chiqaruvchi', value: 'AutoGuard Team' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className="text-white text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
