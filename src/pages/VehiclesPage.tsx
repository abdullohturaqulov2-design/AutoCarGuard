import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Plus, Trash2, ArrowLeft, X, Save, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import db, { Vehicle } from '../utils/db';

const statusConfig = {
  active:  { label: 'Aktiv',        color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/30',  icon: CheckCircle },
  parked:  { label: 'Parkovkada',   color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/30',   icon: Car },
  stolen:  { label: 'O\'g\'irlangan', color: 'text-red-400',  bg: 'bg-red-500/20',    border: 'border-red-500/30',    icon: AlertTriangle },
  alert:   { label: 'Ogohlantirish', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: AlertTriangle },
};

interface VehicleForm {
  brand: string;
  model: string;
  year: string;
  plateNumber: string;
  color: string;
  vinNumber: string;
}

const emptyForm: VehicleForm = {
  brand: '',
  model: '',
  year: new Date().getFullYear().toString(),
  plateNumber: '',
  color: '',
  vinNumber: '',
};

const VehiclesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // DB dan mashinalarni yuklash
  const loadVehicles = () => {
    if (user) setVehicles(db.getVehiclesByUserId(user.id));
  };

  useEffect(() => {
    loadVehicles();
  }, [user]);

  // ── Yangi mashina qo'shish ─────────────────────────────────
  const handleAdd = () => {
    setFormError('');
    if (!form.brand.trim()) { setFormError("Brend kiritilmadi"); return; }
    if (!form.model.trim()) { setFormError("Model kiritilmadi"); return; }
    if (!form.plateNumber.trim()) { setFormError("Davlat raqami kiritilmadi"); return; }

    const year = parseInt(form.year);
    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      setFormError("Yil noto'g'ri");
      return;
    }

    db.createVehicle({
      userId: user!.id,
      brand: form.brand.trim(),
      model: form.model.trim(),
      year,
      plateNumber: form.plateNumber.trim().toUpperCase(),
      color: form.color.trim() || 'Nomalum',
      vinNumber: form.vinNumber.trim(),
      status: 'active',
    });

    setForm(emptyForm);
    setShowModal(false);
    loadVehicles();
  };

  // ── O'chirish ──────────────────────────────────────────────
  const handleDelete = (id: string) => {
    db.deleteVehicle(id);
    setDeleteId(null);
    loadVehicles();
  };

  // ── Status o'zgartirish ────────────────────────────────────
  const cycleStatus = (vehicle: Vehicle) => {
    const statuses: Vehicle['status'][] = ['active', 'parked', 'alert'];
    const idx = statuses.indexOf(vehicle.status);
    const next = statuses[(idx + 1) % statuses.length];
    db.updateVehicle(vehicle.id, { status: next });
    loadVehicles();
  };

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-3 hover:bg-gray-900 rounded-2xl transition-colors">
              <ArrowLeft size={26} />
            </button>
            <div>
              <h1 className="text-4xl font-bold">Mashinalarim</h1>
              <p className="text-gray-500 text-sm mt-1">{vehicles.length} ta mashina ro'yxatda</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowModal(true); setFormError(''); setForm(emptyForm); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl transition-all font-medium"
          >
            <Plus size={20} />
            Yangi mashina
          </motion.button>
        </div>

        {/* ── Mashinalar ro'yxati ─────────────────────────── */}
        <div className="space-y-4">
          <AnimatePresence>
            {vehicles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-gray-600"
              >
                <Car size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl font-medium">Hali mashina qo'shilmagan</p>
                <p className="text-sm mt-2">Yuqoridagi tugmani bosing</p>
              </motion.div>
            ) : (
              vehicles.map((vehicle, i) => {
                const status = statusConfig[vehicle.status];
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-700 transition-all"
                  >
                    {/* Icon + Info */}
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shrink-0">
                        <Car size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{vehicle.brand} {vehicle.model}</h3>
                        <p className="text-gray-400 tracking-widest text-sm">{vehicle.plateNumber}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span>{vehicle.year}</span>
                          {vehicle.color && <><span>·</span><span>{vehicle.color}</span></>}
                          {vehicle.lastLocation && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <MapPin size={10} />
                              GPS bor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-3">
                      {/* Status badge — bosib o'zgartiriladi */}
                      <button
                        onClick={() => cycleStatus(vehicle)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium border transition-all ${status.bg} ${status.color} ${status.border} hover:opacity-80`}
                        title="Statusni o'zgartirish"
                      >
                        <StatusIcon size={14} />
                        {status.label}
                      </button>

                      {/* Monitor */}
                      <button
                        onClick={() => navigate('/monitor')}
                        className="p-2.5 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"
                        title="Monitoring"
                      >
                        <MapPin size={18} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteId(vehicle.id)}
                        className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Yangi mashina modal ──────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Yangi mashina</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Brend *</label>
                    <input type="text" className={inputClass} placeholder="Toyota" value={form.brand}
                      onChange={e => { setForm(p => ({ ...p, brand: e.target.value })); setFormError(''); }} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Model *</label>
                    <input type="text" className={inputClass} placeholder="Camry" value={form.model}
                      onChange={e => { setForm(p => ({ ...p, model: e.target.value })); setFormError(''); }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Yil</label>
                    <input type="number" className={inputClass} placeholder="2024" value={form.year}
                      onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Rang</label>
                    <input type="text" className={inputClass} placeholder="Oq" value={form.color}
                      onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Davlat raqami *</label>
                  <input type="text" className={inputClass} placeholder="01 A 777 AA" value={form.plateNumber}
                    onChange={e => { setForm(p => ({ ...p, plateNumber: e.target.value.toUpperCase() })); setFormError(''); }} />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">VIN raqam (ixtiyoriy)</label>
                  <input type="text" className={inputClass} placeholder="JTDBT923X71234567" value={form.vinNumber}
                    onChange={e => setForm(p => ({ ...p, vinNumber: e.target.value.toUpperCase() }))} />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {formError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2"
                    >
                      ⚠️ {formError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAdd}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-3 rounded-2xl font-semibold transition-all"
                  >
                    <Save size={18} /> Saqlash
                  </motion.button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl text-gray-300 transition-all"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── O'chirish tasdiqlash modal ───────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 border border-red-500/30 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
            >
              <Trash2 size={40} className="text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">O'chirishni tasdiqlang</h3>
              <p className="text-gray-400 text-sm mb-6">Bu mashina va uning barcha ma'lumotlari o'chirilaidi. Bu amalni qaytarib bo'lmaydi.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-2xl font-semibold transition-all"
                >
                  Ha, o'chirish
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-2xl transition-all text-gray-300"
                >
                  Bekor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VehiclesPage;
