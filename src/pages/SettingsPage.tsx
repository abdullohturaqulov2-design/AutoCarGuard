import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Shield, Camera, Mic, MapPin, ArrowLeft, Video, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import db, { Settings } from '../utils/db';

const Toggle = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <motion.div
    onClick={() => onChange(!value)}
    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${
      value ? 'bg-blue-600' : 'bg-gray-700'
    }`}
  >
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow ${
        value ? 'right-0.5' : 'left-0.5'
      }`}
    />
  </motion.div>
);

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const defaultSettings: Settings = {
    userId: user?.id || '',
    cameraQuality: '1080p',
    gpsEnabled: true,
    microphoneEnabled: true,
    videoSaveEnabled: false,
    notificationsEnabled: true,
    autoCallPolice: false,
    locationUpdateInterval: 10,
  };

  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // DB dan sozlamalarni yuklash
  useEffect(() => {
    if (!user) return;
    const saved = db.getSettingsByUserId(user.id);
    if (saved) {
      setSettings(saved);
    } else {
      const def = db.getDefaultSettings(user.id);
      setSettings(def);
      db.saveSettings(def);
    }
  }, [user]);

  const update = (key: keyof Settings, value: Settings[keyof Settings]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    db.saveSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 hover:bg-gray-900 rounded-2xl transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl font-bold">Sozlamalar</h1>
          </div>

          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-green-400 text-sm bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-2xl"
              >
                ✓ Saqlandi
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          {/* ── Bildirishnomalar ──────────────────── */}
          <Section title="Xabarnomalar">
            <Row
              icon={<Bell className="w-5 h-5 text-blue-400" />}
              label="Bildirishnomalar"
              desc="Mashina harakati haqida xabar olish"
            >
              <Toggle
                value={settings.notificationsEnabled}
                onChange={v => update('notificationsEnabled', v)}
              />
            </Row>
          </Section>

          {/* ── Qurilma sozlamalari ──────────────── */}
          <Section title="Qurilma">
            <Row
              icon={<MapPin className="w-5 h-5 text-green-400" />}
              label="GPS kuzatuvi"
              desc="Real vaqtda joylashuvni kuzatish"
            >
              <Toggle
                value={settings.gpsEnabled}
                onChange={v => update('gpsEnabled', v)}
              />
            </Row>

            <Row
              icon={<Camera className="w-5 h-5 text-purple-400" />}
              label="Kamera"
              desc="Video monitoring yoqish"
            >
              <select
                value={settings.cameraQuality}
                onChange={e => update('cameraQuality', e.target.value as '720p' | '1080p' | '4K')}
                className="bg-gray-800 border border-gray-700 text-white text-sm px-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </Row>

            <Row
              icon={<Mic className="w-5 h-5 text-yellow-400" />}
              label="Mikrofon"
              desc="Ovozni yozib olish"
            >
              <Toggle
                value={settings.microphoneEnabled}
                onChange={v => update('microphoneEnabled', v)}
              />
            </Row>

            <Row
              icon={<Video className="w-5 h-5 text-red-400" />}
              label="Video saqlash"
              desc="Sayohat videolarini saqlash"
            >
              <Toggle
                value={settings.videoSaveEnabled}
                onChange={v => update('videoSaveEnabled', v)}
              />
            </Row>
          </Section>

          {/* ── Xavfsizlik ────────────────────────── */}
          <Section title="Xavfsizlik">
            <Row
              icon={<Shield className="w-5 h-5 text-blue-400" />}
              label="Avtomatik politsiyaga qo'ng'iroq"
              desc="Xavfli holat aniqlanganda avtomatik chaqirish"
            >
              <Toggle
                value={settings.autoCallPolice}
                onChange={v => update('autoCallPolice', v)}
              />
            </Row>

            <Row
              icon={<Phone className="w-5 h-5 text-cyan-400" />}
              label="GPS yangilanish vaqti"
              desc="Joylashuv qanchalik tez-tez yangilansin (soniya)"
            >
              <select
                value={settings.locationUpdateInterval}
                onChange={e => update('locationUpdateInterval', Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 text-white text-sm px-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value={5}>5 soniya</option>
                <option value={10}>10 soniya</option>
                <option value={30}>30 soniya</option>
                <option value={60}>1 daqiqa</option>
              </select>
            </Row>
          </Section>

          {/* ── Profil ────────────────────────────── */}
          <Section title="Hisob">
            <Row
              icon={<div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{user?.name?.charAt(0)}</div>}
              label={user?.name || '—'}
              desc={user?.email || ''}
            >
              <button
                onClick={() => navigate('/profile')}
                className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
              >
                Tahrirlash →
              </button>
            </Row>
          </Section>

          {/* ── Chiqish ───────────────────────────── */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-3xl p-6 flex items-center gap-4 cursor-pointer transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <div>
              <p className="font-semibold">Tizimdan chiqish</p>
              <p className="text-sm text-red-400/70">Hisobingizdan chiqish</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ── Helper components ──────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 pt-5 pb-2">
      {title}
    </p>
    <div className="divide-y divide-gray-800">{children}</div>
  </div>
);

const Row = ({
  icon,
  label,
  desc,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-6 py-4">
    <div className="flex items-center gap-4">
      {icon}
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

export default SettingsPage;
