import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, ChevronRight, ArrowLeft, User, CheckCircle, Camera } from 'lucide-react';
import { db } from '../utils/db';
import { useAuth } from '../context/AuthContext';

type AuthStep = 'welcome' | 'google_accounts' | 'phone_input' | 'phone_verify' | 'apple_accounts' | 'jshir_input' | 'face_scan' | 'complete';

const MOCK_GOOGLE_ACCOUNTS = [
  { id: '1', name: 'Abdulloh Tursunov', email: 'abdulloh@gmail.com', avatar: 'A' },
  { id: '2', name: 'Sardor Nazarov', email: 'sardor.n@gmail.com', avatar: 'S' },
  { id: '3', name: 'Malika Yusupova', email: 'malika.y@gmail.com', avatar: 'M' },
];

const MOCK_APPLE_ACCOUNTS = [
  { id: '1', name: 'Abdulloh Tursunov', email: 'abdulloh@icloud.com', avatar: 'A' },
  { id: '2', name: 'Sardor Nazarov', email: 'sardor@icloud.com', avatar: 'S' },
];

const MOCK_PASSPORT_DB: Record<string, { name: string; dob: string; photo: string }> = {
  'AA1234567': { name: 'Abdulloh Tursunov', dob: '1990-05-15', photo: 'A' },
  'AB7654321': { name: 'Sardor Nazarov', dob: '1988-11-22', photo: 'S' },
  '12345678901234': { name: 'Malika Yusupova', dob: '1995-03-08', photo: 'M' },
  '98765432109876': { name: 'Jasur Rahimov', dob: '1992-07-19', photo: 'J' },
};

export default function AuthPage() {
  const { login } = useAuth();
  const [step, setStep] = useState<AuthStep>('welcome');
  const [authMethod, setAuthMethod] = useState<'google' | 'apple' | 'phone'>('google');
  const [selectedAccount, setSelectedAccount] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [generatedCode] = useState('123456');
  const [jshir, setJshir] = useState('');
  const [jshirFound, setJshirFound] = useState<{ name: string; dob: string; photo: string } | null>(null);
  const [jshirError, setJshirError] = useState('');
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [faceMatched, setFaceMatched] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ name: string; email: string; phone: string; method: 'google' | 'apple' | 'phone' } | null>(null);

  const handleGoogleSelect = (account: typeof MOCK_GOOGLE_ACCOUNTS[0]) => {
    setSelectedAccount(account);
    setPendingUser({ name: account.name, email: account.email, phone: '', method: 'google' });
    setStep('jshir_input');
  };

  const handleAppleSelect = (account: typeof MOCK_APPLE_ACCOUNTS[0]) => {
    setSelectedAccount(account);
    setPendingUser({ name: account.name, email: account.email, phone: '', method: 'apple' });
    setStep('jshir_input');
  };

  const handlePhoneVerify = () => {
    if (verifyCode === generatedCode) {
      setPendingUser({ name: 'Foydalanuvchi', email: '', phone, method: 'phone' });
      setStep('jshir_input');
    }
  };

  const handleJshirSearch = () => {
    setJshirError('');
    const found = MOCK_PASSPORT_DB[jshir.toUpperCase()] || MOCK_PASSPORT_DB[jshir];
    if (found) {
      setJshirFound(found);
      if (pendingUser) {
        setPendingUser({ ...pendingUser, name: found.name });
      }
    } else {
      setJshirError('Maʼlumot topilmadi. JSHSHIR yoki pasport seriyasini tekshiring.');
    }
  };

  const handleFaceScan = () => {
    setFaceScanning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setFaceScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setFaceMatched(true);
        setFaceScanning(false);
        setTimeout(() => setStep('complete'), 1500);
        // Save user to db
        if (pendingUser && jshirFound) {
          const existing = pendingUser.email ? db.getUserByEmail(pendingUser.email) : db.getUserByPhone(pendingUser.phone);
          let user;
          if (existing) {
            user = existing;
            db.updateUser(existing.id, { faceVerified: true, jshirOrPassport: jshir });
          } else {
            user = db.createUser({
              name: pendingUser.name,
              email: pendingUser.email,
              phone: pendingUser.phone,
              authMethod: pendingUser.method,
              jshirOrPassport: jshir,
              faceVerified: true,
              faceData: `face_${Date.now()}`,
            });
          }
          // Save default settings
          db.saveSettings({
            userId: user.id,
            cameraQuality: '1080p',
            gpsEnabled: true,
            microphoneEnabled: true,
            videoSaveEnabled: true,
            notificationsEnabled: true,
            autoCallPolice: false,
            locationUpdateInterval: 5000,
          });
          setTimeout(() => login(user), 2000);
        }
      }
    }, 60);
  };

  const avatarColors: Record<string, string> = {
    A: 'bg-green-600', S: 'bg-blue-600', M: 'bg-pink-600', J: 'bg-purple-600'
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <span className="text-white text-2xl font-bold">AutoGuard</span>
          </div>
          <p className="text-gray-400 text-sm">Mashinangizni himoya qiling</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* WELCOME */}
          {step === 'welcome' && (
            <motion.div key="welcome"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 rounded-3xl p-6 shadow-2xl"
            >
              <h2 className="text-white text-xl font-bold text-center mb-1">Kirish usulini tanlang</h2>
              <p className="text-gray-400 text-sm text-center mb-6">AutoGuard dan foydalanish uchun</p>

              <button onClick={() => { setAuthMethod('google'); setStep('google_accounts'); }}
                className="w-full flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-2xl mb-3 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google bilan kirish
              </button>

              <button onClick={() => { setAuthMethod('apple'); setStep('apple_accounts'); }}
                className="w-full flex items-center gap-3 bg-gray-900 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 px-4 rounded-2xl mb-3 transition-all">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple bilan kirish
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                <div className="relative flex justify-center"><span className="bg-gray-800 px-3 text-gray-500 text-sm">yoki</span></div>
              </div>

              <button onClick={() => { setAuthMethod('phone'); setStep('phone_input'); }}
                className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-all">
                <Phone size={20} />
                Telefon raqam bilan
              </button>
            </motion.div>
          )}

          {/* GOOGLE ACCOUNTS */}
          {step === 'google_accounts' && (
            <motion.div key="google"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="bg-gray-800 rounded-3xl p-6 shadow-2xl"
            >
              <button onClick={() => setStep('welcome')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1">
                <ArrowLeft size={16} /> Orqaga
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Hisobni tanlang</h3>
                  <p className="text-gray-400 text-xs">AutoGuard uchun</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {MOCK_GOOGLE_ACCOUNTS.map(acc => (
                  <button key={acc.id} onClick={() => handleGoogleSelect(acc)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-700 transition-all text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${avatarColors[acc.avatar] || 'bg-gray-600'}`}>
                      {acc.avatar}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{acc.name}</div>
                      <div className="text-gray-400 text-xs">{acc.email}</div>
                    </div>
                  </button>
                ))}
                <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-700 transition-all">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Boshqa hisob kiritish</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* APPLE ACCOUNTS */}
          {step === 'apple_accounts' && (
            <motion.div key="apple"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="bg-gray-800 rounded-3xl p-6 shadow-2xl"
            >
              <button onClick={() => setStep('welcome')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1">
                <ArrowLeft size={16} /> Orqaga
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-700">
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">Apple ID tanlang</h3>
                  <p className="text-gray-400 text-xs">AutoGuard uchun</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {MOCK_APPLE_ACCOUNTS.map(acc => (
                  <button key={acc.id} onClick={() => handleAppleSelect(acc)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-700 transition-all text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${avatarColors[acc.avatar] || 'bg-gray-600'}`}>
                      {acc.avatar}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{acc.name}</div>
                      <div className="text-gray-400 text-xs">{acc.email}</div>
                    </div>
                  </button>
                ))}
                <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-700 transition-all">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Boshqa Apple ID</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* PHONE INPUT */}
          {step === 'phone_input' && (
            <motion.div key="phone"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="bg-gray-800 rounded-3xl p-6 shadow-2xl"
            >
              <button onClick={() => setStep('welcome')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1">
                <ArrowLeft size={16} /> Orqaga
              </button>
              <h3 className="text-white text-xl font-bold mb-1">Telefon raqam</h3>
              <p className="text-gray-400 text-sm mb-6">SMS kod yuboriladi</p>
              <div className="flex gap-2 mb-4">
                <div className="bg-gray-700 border border-gray-600 rounded-xl px-3 py-3 text-white font-medium w-20 text-center">+998</div>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="90 123 45 67"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => phone.length === 9 && setStep('phone_verify')}
                className={`w-full py-3 rounded-2xl font-semibold transition-all ${phone.length === 9 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                Kod yuborish
              </button>
            </motion.div>
          )}

          {/* PHONE VERIFY */}
          {step === 'phone_verify' && (
            <motion.div key="verify"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="bg-gray-800 rounded-3xl p-6 shadow-2xl"
            >
              <button onClick={() => setStep('phone_input')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1">
                <ArrowLeft size={16} /> Orqaga
              </button>
              <h3 className="text-white text-xl font-bold mb-1">SMS Kodni kiriting</h3>
              <p className="text-gray-400 text-sm mb-2">+998 {phone} ga kod yuborildi</p>
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-3 mb-5">
                <p className="text-blue-300 text-xs">Demo: Kod = <span className="font-bold">123456</span></p>
              </div>
              <input
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-gray-600 outline-none focus:border-blue-500 mb-4"
              />
              <button
                onClick={handlePhoneVerify}
                className={`w-full py-3 rounded-2xl font-semibold transition-all ${verifyCode.length === 6 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                Tasdiqlash
              </button>
            </motion.div>
          )}

          {/* JSHIR INPUT */}
          {step === 'jshir_input' && (
            <motion.div key="jshir"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="bg-gray-800 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-white text-xl font-bold mb-1">Shaxsingizni tasdiqlang</h3>
              <p className="text-gray-400 text-sm mb-5">JSHSHIR yoki pasport seriya raqamini kiriting</p>
              
              <div className="bg-gray-700/50 rounded-2xl p-4 mb-4">
                <p className="text-gray-400 text-xs mb-1">Demo raqamlar:</p>
                <p className="text-gray-300 text-xs">Pasport: <span className="text-blue-400 font-mono">AA1234567</span> yoki <span className="text-blue-400 font-mono">AB7654321</span></p>
                <p className="text-gray-300 text-xs">JSHSHIR: <span className="text-blue-400 font-mono">12345678901234</span></p>
              </div>

              <input
                value={jshir}
                onChange={e => { setJshir(e.target.value.toUpperCase()); setJshirError(''); setJshirFound(null); }}
                placeholder="AA1234567 yoki JSHSHIR"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 mb-3 font-mono"
              />
              {jshirError && <p className="text-red-400 text-sm mb-3">{jshirError}</p>}

              {jshirFound && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${avatarColors[jshirFound.photo] || 'bg-gray-600'}`}>
                      {jshirFound.photo}
                    </div>
                    <div>
                      <p className="text-green-400 text-xs font-medium">✓ Ma'lumot topildi</p>
                      <p className="text-white font-semibold">{jshirFound.name}</p>
                      <p className="text-gray-400 text-xs">Tug'ilgan: {jshirFound.dob}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!jshirFound ? (
                <button onClick={handleJshirSearch}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2">
                  Qidirish <ChevronRight size={18} />
                </button>
              ) : (
                <button onClick={() => setStep('face_scan')}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2">
                  Yuz skaniga o'tish <ChevronRight size={18} />
                </button>
              )}
            </motion.div>
          )}

          {/* FACE SCAN */}
          {step === 'face_scan' && (
            <motion.div key="face"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="bg-gray-800 rounded-3xl p-6 shadow-2xl text-center"
            >
              <h3 className="text-white text-xl font-bold mb-1">Yuz tekshiruvi</h3>
              <p className="text-gray-400 text-sm mb-6">Pasport ma'lumotlari bilan solishtirish</p>

              <div className="relative mx-auto mb-6 w-48 h-48">
                <div className="w-48 h-48 rounded-full bg-gray-700 border-4 border-blue-600 flex items-center justify-center overflow-hidden relative">
                  <Camera size={50} className="text-gray-500" />
                  {faceScanning && (
                    <motion.div
                      className="absolute inset-0 bg-blue-500/20"
                      animate={{ opacity: [0.2, 0.6, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                  {faceMatched && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                      <CheckCircle size={60} className="text-green-400" />
                    </div>
                  )}
                </div>
                {faceScanning && (
                  <svg className="absolute inset-0 w-48 h-48" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#3b82f6" strokeWidth="3"
                      strokeDasharray={`${faceScanProgress * 2.89} 289`}
                      strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                )}
              </div>

              {faceMatched ? (
                <div className="text-green-400 font-semibold text-lg">✓ Yuz muvaffaqiyatli tasdiqlandi!</div>
              ) : faceScanning ? (
                <div>
                  <p className="text-blue-400 mb-2">Skanerlash: {faceScanProgress}%</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${faceScanProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <button onClick={handleFaceScan}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all">
                  Yuz skanini boshlash
                </button>
              )}
            </motion.div>
          )}

          {/* COMPLETE */}
          {step === 'complete' && (
            <motion.div key="complete"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="bg-gray-800 rounded-3xl p-8 shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle size={40} className="text-white" />
              </motion.div>
              <h3 className="text-white text-2xl font-bold mb-2">Xush kelibsiz!</h3>
              <p className="text-gray-400">Ma'lumotlar bazaga saqlandi. AutoGuard ga kirilmoqda...</p>
              <div className="mt-4 flex justify-center">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
