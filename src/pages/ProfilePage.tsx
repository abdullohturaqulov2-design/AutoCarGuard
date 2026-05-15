import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Shield, Edit3, Save, X, CheckCircle, Camera, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/db';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const knownFaces = db.getKnownFacesByUserId(user.id);
  const vehicles = db.getVehiclesByUserId(user.id);
  const stats = db.getStats(user.id);

  const handleSave = () => {
    updateUser({ name: form.name, phone: form.phone, email: form.email });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const avatarColors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600'];
  const avatarColor = avatarColors[user.name.charCodeAt(0) % avatarColors.length];

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-xl font-bold">Mening profilim</h2>
        <button onClick={() => setEditing(!editing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${editing ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'}`}>
          {editing ? <><X size={14} /> Bekor</>  : <><Edit3 size={14} /> Tahrirlash</>}
        </button>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="bg-green-900/30 border border-green-700/50 rounded-xl p-3 mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-green-400 text-sm">Ma'lumotlar saqlandi!</span>
        </motion.div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className={`w-24 h-24 ${avatarColor} rounded-full flex items-center justify-center text-white text-4xl font-bold mb-3`}>
            {user.name[0]}
          </div>
          <button className="absolute bottom-3 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-gray-950">
            <Camera size={14} className="text-white" />
          </button>
        </div>
        <h3 className="text-white text-xl font-bold">{user.name}</h3>
        <div className={`flex items-center gap-1 mt-1 text-xs px-3 py-1 rounded-full ${user.faceVerified ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
          <Shield size={10} />
          {user.faceVerified ? 'Yuz tasdiqlangan' : 'Yuz tasdiqlanmagan'}
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Shaxsiy ma'lumotlar</h3>
        <div className="space-y-4">
          <div>
            <label className="text-gray-500 text-xs mb-1 block flex items-center gap-1"><User size={11} /> To'liq ism</label>
            {editing ? (
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-gray-800 border border-blue-600 rounded-xl px-3 py-2 text-white outline-none text-sm" />
            ) : (
              <p className="text-white font-medium">{user.name}</p>
            )}
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block flex items-center gap-1"><Phone size={11} /> Telefon raqam</label>
            {editing ? (
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full bg-gray-800 border border-blue-600 rounded-xl px-3 py-2 text-white outline-none text-sm" />
            ) : (
              <p className="text-white font-medium">{user.phone || 'Kiritilmagan'}</p>
            )}
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block flex items-center gap-1"><Mail size={11} /> Email</label>
            {editing ? (
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-gray-800 border border-blue-600 rounded-xl px-3 py-2 text-white outline-none text-sm" />
            ) : (
              <p className="text-white font-medium">{user.email || 'Kiritilmagan'}</p>
            )}
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block flex items-center gap-1"><Shield size={11} /> JSHSHIR / Pasport</label>
            <p className="text-white font-medium font-mono">{user.jshirOrPassport || 'Kiritilmagan'}</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block flex items-center gap-1"><Calendar size={11} /> Ro'yxatdan o'tgan</label>
            <p className="text-white font-medium">{new Date(user.createdAt).toLocaleDateString('uz-UZ')}</p>
          </div>
        </div>

        {editing && (
          <button onClick={handleSave}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2">
            <Save size={16} /> Saqlash
          </button>
        )}
      </div>

      {/* Auth Method */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Kirish usuli</h3>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            user.authMethod === 'google' ? 'bg-white' :
            user.authMethod === 'apple' ? 'bg-gray-900 border border-gray-700' :
            'bg-blue-600'
          }`}>
            {user.authMethod === 'google' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {user.authMethod === 'apple' && (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            )}
            {user.authMethod === 'phone' && <Phone size={18} className="text-white" />}
          </div>
          <div>
            <p className="text-white font-medium capitalize">
              {user.authMethod === 'google' ? 'Google' : user.authMethod === 'apple' ? 'Apple ID' : 'Telefon raqam'}
            </p>
            <p className="text-gray-400 text-xs">{user.email || user.phone || ''}</p>
          </div>
          <div className="ml-auto">
            <CheckCircle size={16} className="text-green-400" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900 rounded-2xl p-3 text-center">
          <div className="text-blue-400 text-2xl font-bold">{vehicles.length}</div>
          <div className="text-gray-500 text-xs">Mashinalar</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-3 text-center">
          <div className="text-purple-400 text-2xl font-bold">{knownFaces.length}</div>
          <div className="text-gray-500 text-xs">Tanish yuzlar</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-3 text-center">
          <div className="text-green-400 text-2xl font-bold">{stats.totalTrips}</div>
          <div className="text-gray-500 text-xs">Sayohatlar</div>
        </div>
      </div>

      {/* Known Faces */}
      {knownFaces.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Tanish yuzlar bazasi</h3>
          <div className="space-y-2">
            {knownFaces.map(face => (
              <div key={face.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold ${
                  face.relation === 'family' ? 'bg-green-600' : face.relation === 'friend' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  {(face.name || 'N')[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{face.name || 'Nomaʼlum'}</p>
                  <p className="text-gray-500 text-xs">{face.relation === 'family' ? 'Qarindosh' : face.relation === 'friend' ? 'Tanish' : 'Begona'} • {face.seenCount}x ko'rilgan</p>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  face.relation === 'family' ? 'bg-green-900/40 text-green-400' :
                  face.relation === 'friend' ? 'bg-blue-900/40 text-blue-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {face.relation === 'family' ? 'Qarindosh' : face.relation === 'friend' ? 'Tanish' : 'Begona'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={logout}
        className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 mb-6">
        <LogOut size={18} /> Chiqish
      </button>
    </div>
  );
}
