import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Plus, MapPin, Edit3, Trash2, Save, X, Navigation, Camera, Wifi, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, Vehicle } from '../utils/db';

const BRANDS = ['Chevrolet', 'Nexia', 'Spark', 'Matiz', 'Toyota', 'BMW', 'Mercedes', 'Hyundai', 'Kia', 'Honda', 'Lacetti', 'Cobalt', 'Malibu', 'Tracker'];
const COLORS = ['Oq', 'Qora', 'Kulrang', 'Kumush', 'Qizil', 'Ko\'k', 'Yashil', 'Sariq'];

const TOSHKENT_LOCATIONS = [
  { lat: 41.2995, lng: 69.2401, address: 'Toshkent, Yunusobod tumani, Buyuk ipak yo\'li' },
  { lat: 41.3111, lng: 69.2797, address: 'Toshkent, Shayxontohur, Navoiy ko\'chasi' },
  { lat: 41.2800, lng: 69.2200, address: 'Toshkent, Sergeli tumani, Yangi hayot' },
  { lat: 41.3200, lng: 69.2500, address: 'Toshkent, Mirzo Ulug\'bek, Yunusobod' },
  { lat: 41.2900, lng: 69.2600, address: 'Toshkent, Olmazor tumani, Farxod bozori' },
];

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => user ? db.getVehiclesByUserId(user.id) : []);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState<string | null>(null);
  const [form, setForm] = useState({ brand: '', model: '', year: new Date().getFullYear().toString(), plateNumber: '', color: 'Oq', vinNumber: '' });

  if (!user) return null;

  const refresh = () => setVehicles(db.getVehiclesByUserId(user.id));

  const randomLocation = () => TOSHKENT_LOCATIONS[Math.floor(Math.random() * TOSHKENT_LOCATIONS.length)];

  const handleAdd = () => {
    if (!form.brand || !form.model || !form.plateNumber) return;
    db.createVehicle({
      userId: user.id,
      brand: form.brand,
      model: form.model,
      year: parseInt(form.year),
      plateNumber: form.plateNumber.toUpperCase(),
      color: form.color,
      vinNumber: form.vinNumber || `VIN${Date.now()}`,
      status: 'parked',
      lastLocation: { ...randomLocation(), timestamp: new Date().toISOString() },
    });
    setForm({ brand: '', model: '', year: new Date().getFullYear().toString(), plateNumber: '', color: 'Oq', vinNumber: '' });
    setShowAdd(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Mashina o\'chirilsinmi?')) {
      db.deleteVehicle(id);
      refresh();
    }
  };

  const toggleStatus = (v: Vehicle) => {
    db.updateVehicle(v.id, { status: v.status === 'parked' ? 'active' : 'parked' });
    refresh();
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: '🟢 Faol', color: 'text-green-400', bg: 'bg-green-900/40' },
    parked: { label: '🅿️ Parkovka', color: 'text-blue-400', bg: 'bg-blue-900/40' },
    stolen: { label: '🚨 Oʻgʻirlangan', color: 'text-red-400', bg: 'bg-red-900/40' },
    alert: { label: '⚠️ Ogohlantirish', color: 'text-orange-400', bg: 'bg-orange-900/40' },
  };

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-xl font-bold">Mashinalarim</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all">
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? 'Yopish' : 'Qo\'shish'}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 rounded-2xl p-5 mb-5 overflow-hidden">
            <h3 className="text-white font-semibold mb-4">Yangi mashina qo'shish</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Marka</label>
                <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 text-sm">
                  <option value="">Tanlang...</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Model</label>
                <input value={form.model} onChange={e => setForm({...form, model: e.target.value})}
                  placeholder="Nexia 3, Spark, ..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Yil</label>
                  <input value={form.year} onChange={e => setForm({...form, year: e.target.value})} type="number" min="1990" max="2025"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Rang</label>
                  <select value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 text-sm">
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Davlat raqami</label>
                <input value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value.toUpperCase()})}
                  placeholder="01A 123 BC" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-blue-500 text-sm font-mono" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">VIN raqami (ixtiyoriy)</label>
                <input value={form.vinNumber} onChange={e => setForm({...form, vinNumber: e.target.value.toUpperCase()})}
                  placeholder="VIN..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-blue-500 text-sm font-mono" />
              </div>
              <button onClick={handleAdd}
                className={`w-full py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${form.brand && form.model && form.plateNumber ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                <Save size={16} /> Saqlash
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vehicles List */}
      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <Car size={60} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium mb-2">Hech qanday mashina yo'q</p>
          <p className="text-gray-600 text-sm">Birinchi mashinangizni qo'shing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map(v => {
            const st = statusConfig[v.status] || statusConfig.parked;
            const isEditing = editingId === v.id;
            return (
              <motion.div key={v.id} layout className="bg-gray-900 rounded-2xl overflow-hidden">
                {/* Vehicle Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        v.status === 'active' ? 'bg-blue-600' :
                        v.status === 'stolen' ? 'bg-red-600' :
                        v.status === 'alert' ? 'bg-orange-600' : 'bg-gray-700'
                      }`}>
                        <Car size={24} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{v.brand} {v.model}</h4>
                        <p className="text-gray-400 text-sm font-mono">{v.plateNumber} • {v.year}</p>
                        <p className="text-gray-500 text-xs">{v.color}</p>
                      </div>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</div>
                  </div>

                  {/* Device Status */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-800 rounded-xl p-2 text-center">
                      <Camera size={14} className="text-blue-400 mx-auto mb-1" />
                      <span className="text-gray-400 text-xs">Kamera</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mx-auto mt-1 animate-pulse"></div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-2 text-center">
                      <Navigation size={14} className="text-green-400 mx-auto mb-1" />
                      <span className="text-gray-400 text-xs">GPS</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mx-auto mt-1 animate-pulse"></div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-2 text-center">
                      <Wifi size={14} className="text-purple-400 mx-auto mb-1" />
                      <span className="text-gray-400 text-xs">Ulanish</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mx-auto mt-1 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Location */}
                  {v.lastLocation && (
                    <div className="bg-gray-800 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-gray-400 text-xs">So'nggi manzil</p>
                          <p className="text-white text-sm font-medium">{v.lastLocation.address}</p>
                          <p className="text-gray-500 text-xs">{new Date(v.lastLocation.timestamp).toLocaleString('uz-UZ')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        v.status === 'active' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}>
                      {v.status === 'active' ? <><Lock size={14} /> To'xtatish</> : <><Navigation size={14} /> Faollashtirish</>}
                    </button>
                    <button onClick={() => setShowLocation(showLocation === v.id ? null : v.id)}
                      className="px-3 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl transition-all">
                      <MapPin size={18} />
                    </button>
                    <button onClick={() => setEditingId(isEditing ? null : v.id)}
                      className="px-3 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDelete(v.id)}
                      className="px-3 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Location Map Simulation */}
                <AnimatePresence>
                  {showLocation === v.id && v.lastLocation && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="border-t border-gray-800 overflow-hidden">
                      <div className="p-4">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <MapPin size={14} className="text-blue-400" /> Mashina turgan joy
                        </h4>
                        {/* Fake Map */}
                        <div className="relative bg-gray-800 rounded-xl overflow-hidden h-40 mb-3">
                          <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20">
                            {Array.from({length: 48}).map((_, i) => (
                              <div key={i} className="border border-gray-600"></div>
                            ))}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                              <div className="absolute -top-1 -left-1 w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/70 rounded-lg px-2 py-1">
                            <p className="text-white text-xs font-mono">{v.lastLocation.lat.toFixed(4)}, {v.lastLocation.lng.toFixed(4)}</p>
                          </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-3">
                          <p className="text-gray-400 text-xs mb-1">To'liq manzil:</p>
                          <p className="text-white text-sm font-medium">{v.lastLocation.address}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
