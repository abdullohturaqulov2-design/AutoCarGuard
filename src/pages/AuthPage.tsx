import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '../utils/db';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    carModel: '',
    carPlate: '',
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 400)); // UI uchun kichik kutish

    try {
      if (isLogin) {
        // ── Kirish ──────────────────────────────────────────
        const dbUser = db.getUserByEmail(formData.email.trim().toLowerCase());
        if (!dbUser) {
          setError("Bu email bilan foydalanuvchi topilmadi");
          return;
        }
        if (dbUser.password !== formData.password) {
          setError("Parol noto'g'ri");
          return;
        }
        login({
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          avatar: dbUser.avatar,
          carModel: dbUser.carModel,
          carPlate: dbUser.carPlate,
        });
        navigate('/');

      } else {
        // ── Ro'yxatdan o'tish ───────────────────────────────
        if (!formData.name.trim()) { setError("Ism kiritilmadi"); return; }
        if (!formData.email.trim()) { setError("Email kiritilmadi"); return; }
        if (formData.password.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }

        const existing = db.getUserByEmail(formData.email.trim().toLowerCase());
        if (existing) {
          setError("Bu email allaqachon ro'yxatdan o'tgan");
          return;
        }

        const newDbUser = db.createUser({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || '',
          password: formData.password,
          authMethod: 'email',
          faceVerified: false,
          carModel: formData.carModel.trim() || undefined,
          carPlate: formData.carPlate.trim() || undefined,
        });

        login({
          id: newDbUser.id,
          name: newDbUser.name,
          email: newDbUser.email,
          phone: newDbUser.phone,
          carModel: newDbUser.carModel,
          carPlate: newDbUser.carPlate,
        });
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Car className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">AutoCarGuard</h1>
          <p className="text-gray-400 mt-2">Mashinangizni himoya qiling</p>
        </div>

        <motion.div
          layout
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-800"
        >
          {/* Tab */}
          <div className="flex bg-gray-800 rounded-2xl p-1 mb-6">
            {['Kirish', "Ro'yxatdan o'tish"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsLogin(i === 0); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  isLogin === (i === 0)
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="Ism va Familiya *"
                    className={inputClass}
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="Telefon (+998 XX XXX XX XX)"
                    className={inputClass}
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Mashina modeli"
                      className={inputClass}
                      value={formData.carModel}
                      onChange={e => handleChange('carModel', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Davlat raqami"
                      className={inputClass}
                      value={formData.carPlate}
                      onChange={e => handleChange('carPlate', e.target.value.toUpperCase())}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email"
              placeholder="Email manzil *"
              className={inputClass}
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Parol *"
                className={inputClass}
                value={formData.password}
                onChange={e => handleChange('password', e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-4 py-3 text-sm"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all py-3.5 rounded-2xl font-semibold text-lg text-white flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Kirish' : "Ro'yxatdan o'tish"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
