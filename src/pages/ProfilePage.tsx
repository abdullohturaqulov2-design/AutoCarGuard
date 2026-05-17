import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Car, Edit3, ArrowLeft, Save, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import db from '../utils/db';

interface EditForm {
  name: string;
  phone: string;
  carModel: string;
  carPlate: string;
}

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: user?.name || '',
    phone: user?.phone || '',
    carModel: user?.carModel || '',
    carPlate: user?.carPlate || '',
  });

  const handleEdit = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      carModel: user?.carModel || '',
      carPlate: user?.carPlate || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    // AuthContext da yangilash (session uchun)
    updateUser({
      name: form.name.trim(),
      phone: form.phone.trim(),
      carModel: form.carModel.trim() || undefined,
      carPlate: form.carPlate.trim() || undefined,
    });

    // db.ts da ham yangilash (doimiy saqlash uchun)
    if (user) {
      db.updateUser(user.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        carModel: form.carModel.trim() || undefined,
        carPlate: form.carPlate.trim() || undefined,
      });
    }

    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm';

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    placeholder = '—',
  }: {
    icon: React.ElementType;
    label: string;
    value?: string;
    placeholder?: string;
  }) => (
    <div>
      <p className="text-gray-400 text-xs flex items-center gap-1.5 mb-1">
        <Icon size={14} />
        {label}
      </p>
      <p className={`font-medium ${value ? 'text-white' : 'text-gray-600'}`}>
        {value || placeholder}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="max-w-4xl mx-auto px-6 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 hover:bg-gray-900 rounded-2xl transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl font-bold">Profil</h1>
          </div>

          {/* Saved badge */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-2xl text-sm"
              >
                <Check size={16} /> Saqlandi!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-6xl font-bold mb-4 shadow-lg shadow-blue-500/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Edit3 size={14} /> Tahrirlash
                </button>
              )}
            </div>

            {/* Info / Edit */}
            <div className="flex-1 w-full">
              {!isEditing ? (
                /* ── Ko'rish rejimi ── */
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Ism va Familiya</p>
                    <p className="text-3xl font-semibold">{user?.name}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoRow icon={User} label="Email" value={user?.email} />
                    <InfoRow icon={Phone} label="Telefon" value={user?.phone} placeholder="+998 XX XXX XX XX" />
                    <InfoRow icon={Car} label="Mashina modeli" value={user?.carModel} placeholder="Kiritilmagan" />
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Davlat raqami</p>
                      <p className={`font-bold text-xl tracking-widest ${user?.carPlate ? 'text-white' : 'text-gray-600'}`}>
                        {user?.carPlate || '—'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-medium transition-all"
                  >
                    <Edit3 size={18} /> Ma'lumotlarni tahrirlash
                  </button>
                </div>
              ) : (
                /* ── Tahrirlash rejimi ── */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Ism va Familiya *</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ism va Familiya"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Telefon</label>
                    <input
                      type="tel"
                      className={inputClass}
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+998901234567"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Mashina modeli</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={form.carModel}
                        onChange={e => setForm(p => ({ ...p, carModel: e.target.value }))}
                        placeholder="Toyota Camry"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Davlat raqami</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={form.carPlate}
                        onChange={e => setForm(p => ({ ...p, carPlate: e.target.value.toUpperCase() }))}
                        placeholder="01 A 777 AA"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={!form.name.trim()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-2xl font-medium transition-all"
                    >
                      <Save size={18} /> Saqlash
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-2xl font-medium transition-all text-gray-300"
                    >
                      <X size={18} /> Bekor qilish
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
