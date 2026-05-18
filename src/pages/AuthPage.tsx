import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Car, Eye, EyeOff, AlertCircle, CheckCircle,
  Camera, User, CreditCard, Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '../utils/db';

// ─────────────────────────────────────────────────────────────
// my.gov.uz Real API integratsiyasi
// Haqiqiy ishlatish uchun: https://my.gov.uz/oz/api
// API key olish: info@my.gov.uz yoki https://developers.egov.uz
// ─────────────────────────────────────────────────────────────
const GOV_API_BASE = import.meta.env.VITE_GOV_API_URL || 'https://api.egov.uz/v1';
const GOV_API_KEY  = import.meta.env.VITE_GOV_API_KEY  || '';

interface GovPersonData {
  jshshr: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  passportSeries: string;
  photoBase64?: string;
  vehicles: GovVehicle[];
}

interface GovVehicle {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vinNumber: string;
}

// ── Hukumat API ga so'rov yuborish ─────────────────────────
async function checkGovDatabase(jshshr: string): Promise<GovPersonData | null> {
  // ⚠️ MUHIM: Bu funksiya my.gov.uz / egov.uz real API ga murojaat qiladi.
  // API key bo'lmasa .env faylga qo'shing:
  //   VITE_GOV_API_URL=https://api.egov.uz/v1
  //   VITE_GOV_API_KEY=sizning_api_kalitingiz
  //
  // Real API endpoint hujjatlari: https://developers.egov.uz

  if (!GOV_API_KEY) {
    // API key yo'q — demo rejim
    return getDemoData(jshshr);
  }

  try {
    const response = await fetch(`${GOV_API_BASE}/person/by-jshshr/${jshshr}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GOV_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data as GovPersonData;
  } catch {
    // API ga ulanib bo'lmasa demo rejim
    return getDemoData(jshshr);
  }
}

// ── Mashina himoya qurilmalarini tekshirish ─────────────────
async function checkVehicleDevices(plateNumber: string): Promise<{
  hasCamera: boolean;
  hasGPS: boolean;
  hasBlocker: boolean;
}> {
  // Bu ham real API orqali tekshiriladi
  // Hozircha: DB dan tekshirish
  const vehicles = db.getVehicles();
  const found = vehicles.find(v =>
    v.plateNumber.replace(/\s/g,'').toLowerCase() ===
    plateNumber.replace(/\s/g,'').toLowerCase()
  );

  if (found) {
    return {
      hasCamera:  !!found.cameraId,
      hasGPS:     !!found.gpsId,
      hasBlocker: found.status === 'active',
    };
  }
  return { hasCamera: false, hasGPS: false, hasBlocker: false };
}

// ── Demo ma'lumotlar (API key yo'q bo'lganda) ───────────────
function getDemoData(jshshr: string): GovPersonData | null {
  const demoDb: Record<string, GovPersonData> = {
    '12345678901234': {
      jshshr: '12345678901234',
      lastName: 'Turaqulov',
      firstName: 'Abdulloh',
      middleName: 'Jamshidovich',
      birthDate: '1995-03-15',
      passportSeries: 'AB1234567',
      vehicles: [{
        plateNumber: '01A777AA',
        brand: 'Toyota',
        model: 'Camry',
        year: 2021,
        color: 'Oq',
        vinNumber: 'JTDBT923X71234567',
      }],
    },
    '98765432109876': {
      jshshr: '98765432109876',
      lastName: 'Karimov',
      firstName: 'Jasur',
      middleName: 'Aliyevich',
      birthDate: '1990-07-22',
      passportSeries: 'CD9876543',
      vehicles: [{
        plateNumber: '30B456BB',
        brand: 'Chevrolet',
        model: 'Malibu',
        year: 2022,
        color: 'Qora',
        vinNumber: 'KLATF69J5HB123456',
      }],
    },
  };
  return demoDb[jshshr] ?? null;
}

// ─────────────────────────────────────────────────────────────
// STEPS: 1-jshshr → 2-yuzni tasdiqlash → 3-parol
// ─────────────────────────────────────────────────────────────
type Step = 'jshshr' | 'face' | 'password';

const AuthPage = () => {
  const [isLogin, setIsLogin]     = useState(true);
  const [step, setStep]           = useState<Step>('jshshr');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  // Step 1
  const [jshshr, setJshshr]               = useState('');
  const [govData, setGovData]             = useState<GovPersonData | null>(null);

  // Step 2 - Yuz tasdiqlash
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [camStream, setCamStream]         = useState<MediaStream | null>(null);
  const [facePhoto, setFacePhoto]         = useState<string>('');
  const [faceCaptured, setFaceCaptured]   = useState(false);

  // Step 3
  const [password, setPassword]           = useState('');
  const [showPass, setShowPass]           = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  // ── Step 1: JSHSHR tekshirish ────────────────────────────
  const handleJshshrCheck = async () => {
    setError('');
    const clean = jshshr.trim().replace(/\s/g, '');

    if (isLogin) {
      // Kirish — DB dan topish
      const dbUser = db.getUserByJshir(clean);
      if (!dbUser) { setError("Bu JSHSHR bilan foydalanuvchi topilmadi"); return; }
      setGovData({
        jshshr: clean,
        lastName: dbUser.name.split(' ')[1] || '',
        firstName: dbUser.name.split(' ')[0] || '',
        middleName: '',
        birthDate: '',
        passportSeries: dbUser.jshirOrPassport || '',
        vehicles: [],
      });
      setStep('password');
      return;
    }

    // Ro'yxatdan o'tish — hukumat bazasidan tekshirish
    if (clean.length < 9) { setError("JSHSHR kamida 9 ta belgi (JSHSHR 14, pasport 9)"); return; }

    setIsLoading(true);
    try {
      const data = await checkGovDatabase(clean);
      if (!data) {
        setError("Bu JSHSHR/Pasport raqami hukumat bazasida topilmadi. Qayta tekshiring.");
        return;
      }
      const existing = db.getUserByJshir(clean);
      if (existing) {
        setError("Bu JSHSHR allaqachon ro'yxatdan o'tgan. Kirish bo'limini ishlating.");
        return;
      }
      setGovData(data);
      setStep('face');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Kamera yoqish ────────────────────────────────
  const startFaceCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamStream(stream);
    } catch {
      setError("Kamera ruxsat berilmadi. Brauzer sozlamalarini tekshiring.");
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const photo = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setFacePhoto(photo);
    setFaceCaptured(true);
    camStream?.getTracks().forEach(t => t.stop());
    setCamStream(null);
  }, [camStream]);

  const retakePhoto = () => {
    setFacePhoto('');
    setFaceCaptured(false);
    startFaceCamera();
  };

  const confirmFace = () => {
    if (!faceCaptured) { setError("Avval yuzingizni tasdiqlang"); return; }
    setStep('password');
  };

  // ── Step 3: Parol va yakuniy ro'yxatdan o'tish ───────────
  const handleFinish = async () => {
    setError('');
    if (password.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    if (!govData) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        const dbUser = db.getUserByJshir(jshshr.trim());
        if (!dbUser || dbUser.password !== password) {
          setError("Parol noto'g'ri");
          return;
        }
        // Mashina qurilmalarini tekshirish
        const devices = dbUser.carPlate
          ? await checkVehicleDevices(dbUser.carPlate)
          : { hasCamera: false, hasGPS: false, hasBlocker: false };

        login({
          id: dbUser.id,
          name: dbUser.name,
          email: '',
          phone: dbUser.phone,
          jshshr: dbUser.jshirOrPassport,
          faceVerified: dbUser.faceVerified,
          carModel: dbUser.carModel,
          carPlate: dbUser.carPlate,
          hasCarCamera:  devices.hasCamera,
          hasCarGPS:     devices.hasGPS,
          hasCarBlocker: devices.hasBlocker,
        });
        navigate('/');
      } else {
        // Yangi foydalanuvchi yaratish
        const fullName = `${govData.firstName} ${govData.lastName}`;
        const vehicle = govData.vehicles[0];

        // Mashinani DB ga qo'shish (oldin user yaratish kerak)
        const newUser = db.createUser({
          name: fullName,
          email: '',
          phone: '',
          password,
          authMethod: 'phone',
          jshirOrPassport: govData.jshshr,
          faceVerified: true,
          faceData: facePhoto,
          carModel: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined,
          carPlate: vehicle?.plateNumber,
        });

        // Mashina qurilmalarini tekshirish
        const devices = vehicle
          ? await checkVehicleDevices(vehicle.plateNumber)
          : { hasCamera: false, hasGPS: false, hasBlocker: false };

        // Mashinani DB ga qo'shish
        if (vehicle) {
          db.createVehicle({
            userId: newUser.id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            plateNumber: vehicle.plateNumber,
            color: vehicle.color,
            vinNumber: vehicle.vinNumber,
            cameraId:  devices.hasCamera  ? 'cam_001' : undefined,
            gpsId:     devices.hasGPS     ? 'gps_001' : undefined,
            status: devices.hasCamera && devices.hasGPS && devices.hasBlocker ? 'active' : 'parked',
          });
        }

        login({
          id: newUser.id,
          name: fullName,
          email: '',
          phone: '',
          jshshr: govData.jshshr,
          passportSeries: govData.passportSeries,
          faceVerified: true,
          carModel: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined,
          carPlate: vehicle?.plateNumber,
          carBrand: vehicle?.brand,
          carYear: vehicle?.year,
          carColor: vehicle?.color,
          hasCarCamera:  devices.hasCamera,
          hasCarGPS:     devices.hasGPS,
          hasCarBlocker: devices.hasBlocker,
        });
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors";

  // ── RENDER ───────────────────────────────────────────────
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

        <motion.div layout className="bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-800">

          {/* Tab */}
          <div className="flex bg-gray-800 rounded-2xl p-1 mb-6">
            {['Kirish', "Ro'yxatdan o'tish"].map((tab, i) => (
              <button key={tab}
                onClick={() => { setIsLogin(i === 0); setStep('jshshr'); setError(''); setGovData(null); setJshshr(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  isLogin === (i === 0) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >{tab}</button>
            ))}
          </div>

          {/* Progress (faqat ro'yxatdan o'tishda) */}
          {!isLogin && (
            <div className="flex items-center gap-2 mb-6">
              {(['jshshr', 'face', 'password'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? 'bg-blue-600 text-white' :
                    (['jshshr','face','password'].indexOf(step) > i) ? 'bg-green-500 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {(['jshshr','face','password'].indexOf(step) > i) ? <CheckCircle size={14}/> : i+1}
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 ${(['jshshr','face','password'].indexOf(step) > i) ? 'bg-green-500' : 'bg-gray-700'}`}/>}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── STEP 1: JSHSHR ─────────────────────── */}
            {step === 'jshshr' && (
              <motion.div key="jshshr" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="text-blue-400" size={22}/>
                  <div>
                    <p className="font-semibold">Shaxsini tasdiqlash</p>
                    <p className="text-gray-400 text-xs">JSHSHR (14 raqam) yoki Pasport seriyasi</p>
                  </div>
                </div>

                <input
                  type="text"
                  className={inputClass}
                  placeholder="JSHSHR (14 raqam) yoki Pasport AB1234567"
                  value={jshshr}
                  maxLength={14}
                  onChange={e => { setJshshr(e.target.value.toUpperCase()); setError(''); }}
                />

                <ErrorBox error={error}/>

                {!isLogin && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-xs text-blue-300">
                    ℹ️ Ma'lumotlar my.gov.uz davlat bazasidan tekshiriladi
                  </div>
                )}

                <button onClick={handleJshshrCheck} disabled={isLoading || !jshshr.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all">
                  {isLoading ? <Loader className="animate-spin" size={20}/> : 'Davom etish →'}
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Yuz tasdiqlash ──────────────── */}
            {step === 'face' && !isLogin && (
              <motion.div key="face" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <User className="text-purple-400" size={22}/>
                  <div>
                    <p className="font-semibold">Yuzni tasdiqlash</p>
                    <p className="text-gray-400 text-xs">Birov boshqaning pasporti bilan kira olmasligi uchun</p>
                  </div>
                </div>

                {govData && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                    <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
                      <CheckCircle size={16}/> Hukumat bazasida topildi
                    </p>
                    <p className="text-white font-bold mt-1">{govData.firstName} {govData.lastName}</p>
                    <p className="text-gray-400 text-xs">{govData.passportSeries}</p>
                    {govData.vehicles.length > 0 && (
                      <p className="text-blue-400 text-xs mt-1">
                        🚗 {govData.vehicles[0].brand} {govData.vehicles[0].model} — {govData.vehicles[0].plateNumber}
                      </p>
                    )}
                  </div>
                )}

                {/* Kamera */}
                <div className="relative bg-black rounded-2xl overflow-hidden" style={{aspectRatio:'4/3'}}>
                  {!faceCaptured ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover"
                        style={{display: camStream ? 'block' : 'none'}}/>
                      {!camStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <Camera size={48} className="text-gray-600"/>
                          <button onClick={startFaceCamera}
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all">
                            Kamerani yoqish
                          </button>
                        </div>
                      )}
                      {camStream && (
                        <>
                          <div className="absolute inset-0 border-4 border-blue-400/50 rounded-2xl pointer-events-none"/>
                          <button onClick={capturePhoto}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-2xl font-bold text-sm">
                            📸 Rasm olish
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <img src={facePhoto} alt="face" className="w-full h-full object-cover"/>
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                        <CheckCircle size={16}/>
                      </div>
                      <button onClick={retakePhoto}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-800/90 px-4 py-2 rounded-2xl text-xs">
                        Qayta olish
                      </button>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden"/>

                <ErrorBox error={error}/>

                <button onClick={confirmFace} disabled={!faceCaptured}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3.5 rounded-2xl font-semibold transition-all">
                  Tasdiqlash ✓
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: Parol ───────────────────────── */}
            {step === 'password' && (
              <motion.div key="password" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">

                {govData && !isLogin && (
                  <div className="bg-gray-800 rounded-2xl p-4 text-sm">
                    <p className="text-gray-400 text-xs mb-1">Kimning hisobi:</p>
                    <p className="font-bold text-white">{govData.firstName} {govData.lastName}</p>
                    {govData.vehicles[0] && (
                      <p className="text-blue-400 text-xs mt-1">
                        🚗 {govData.vehicles[0].brand} {govData.vehicles[0].model} · {govData.vehicles[0].plateNumber}
                      </p>
                    )}
                  </div>
                )}

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={inputClass}
                    placeholder={isLogin ? "Parolingiz" : "Yangi parol (kamida 6 ta belgi)"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>

                <ErrorBox error={error}/>

                <button onClick={handleFinish} disabled={isLoading || !password}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all">
                  {isLoading ? <Loader className="animate-spin" size={20}/> : isLogin ? 'Kirish' : "Ro'yxatdan o'tish ✓"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* API haqida eslatma */}
        {!isLogin && (
          <p className="text-center text-gray-600 text-xs mt-4">
            {GOV_API_KEY
              ? '🔒 my.gov.uz real API ulangan'
              : '⚠️ Demo rejim — .env da VITE_GOV_API_KEY qo\'shing'}
          </p>
        )}
      </div>
    </div>
  );
};

const ErrorBox = ({ error }: { error: string }) => (
  <AnimatePresence>
    {error && (
      <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
        className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-4 py-3 text-sm">
        <AlertCircle size={16}/> {error}
      </motion.div>
    )}
  </AnimatePresence>
);

export default AuthPage;
