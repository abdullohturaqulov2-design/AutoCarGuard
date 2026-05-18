import { useAuth } from '../context/AuthContext';
import { Shield, MapPin, Activity, ArrowLeft, Camera, CameraOff, Mic, MicOff, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import db from '../utils/db';

// Ustaxona manzili
const WORKSHOP = {
  address: "Toshkent, Yunusobod, Amir Temur 15",
  phone: "+998 71 123 45 67",
};

const MonitorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Qurilma rejimi: 'phone' = telefon, 'car' = mashina qurilmalari
  const isFullyProtected = !!(user?.hasCarCamera && user?.hasCarGPS && user?.hasCarBlocker);
  const [deviceMode] = useState<'phone'|'car'>(isFullyProtected ? 'car' : 'phone');

  // Kamera
  const [cameraActive, setCameraActive]   = useState(false);
  const [cameraError,  setCameraError]    = useState('');
  const [stream,       setStream]         = useState<MediaStream | null>(null);
  const [micActive,    setMicActive]      = useState(false);

  // GPS
  const [location,     setLocation]       = useState('Aniqlanmoqda...');
  const [coords,       setCoords]         = useState<{lat:number;lng:number}|null>(null);
  const [speed,        setSpeed]          = useState(0);
  const [gpsError,     setGpsError]       = useState('');
  const [gpsConnected, setGpsConnected]   = useState(false);

  // Boshqaruv
  const [isBlocked,    setIsBlocked]      = useState(false);
  const [signalActive, setSignalActive]   = useState(false);

  // ── GPS ─────────────────────────────────────────────────
  useEffect(() => {
    if (deviceMode === 'car') {
      // Mashina GPS dan — DB dagi oxirgi joylashuv
      if (user) {
        const vehicles = db.getVehiclesByUserId(user.id);
        const loc = vehicles[0]?.lastLocation;
        if (loc) {
          setCoords({ lat: loc.lat, lng: loc.lng });
          setLocation(`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
          setGpsConnected(true);
        }
      }
      // Haqiqiy integratsiyada: WebSocket orqali mashina GPS dan olish
      return;
    }

    // Telefon GPS
    if (!navigator.geolocation) { setGpsError("GPS qo'llab-quvvatlanmaydi"); return; }

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, speed: spd } = pos.coords;
        setCoords({ lat, lng });
        setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setSpeed(Math.round((spd || 0) * 3.6));
        setGpsConnected(true);
        setGpsError('');
        if (user) {
          const vehicles = db.getVehiclesByUserId(user.id);
          if (vehicles[0]) {
            db.updateVehicle(vehicles[0].id, {
              lastLocation: { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, timestamp: new Date().toISOString() }
            });
          }
        }
      },
      () => { setGpsError("GPS ruxsat berilmadi"); setGpsConnected(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, deviceMode]);

  // ── Kamera ──────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError('');
    if (deviceMode === 'car') {
      // Mashina kamerasi — haqiqiy integratsiyada WebRTC/RTSP ishlatiladi
      // Hozircha telefon kamerasini fallback sifatida ishlatamiz
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: deviceMode === 'car' ? 'environment' : 'environment',
                 width:{ideal:1280}, height:{ideal:720} },
        audio: micActive,
      });
      if (videoRef.current) videoRef.current.srcObject = s;
      setStream(s);
      setCameraActive(true);
    } catch {
      setCameraError("Kamera ruxsat berilmadi.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setCameraActive(false);
  };

  const toggleMic = () => {
    if (cameraActive) stream?.getAudioTracks().forEach(t => { t.enabled = !micActive; });
    setMicActive(!micActive);
  };

  useEffect(() => { return () => { stream?.getTracks().forEach(t => t.stop()); }; }, [stream]);

  // ── Bloklash ─────────────────────────────────────────────
  const handleBlock = () => {
    const next = !isBlocked;
    setIsBlocked(next);
    if (user) {
      db.createAlert({
        vehicleId: db.getVehiclesByUserId(user.id)[0]?.id || 'none',
        userId: user.id,
        type: 'unauthorized_start',
        message: next ? "Mashina masofadan bloklandi" : "Blok olib tashlandi",
        severity: 'high',
        resolved: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-3 hover:bg-gray-900 rounded-2xl transition-colors">
            <ArrowLeft size={26}/>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Real vaqt monitoring</h1>
            <p className="text-gray-400 text-sm">{user?.carModel} · {user?.carPlate}</p>
          </div>
          {/* Rejim ko'rsatgichi */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${
            deviceMode === 'car'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {deviceMode === 'car' ? <Wifi size={16}/> : <WifiOff size={16}/>}
            {deviceMode === 'car' ? 'Mashina qurilmalari' : 'Telefon rejimi'}
          </div>
        </div>

        {/* Telefon rejimi eslatmasi */}
        {deviceMode === 'phone' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-5 flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Telefon kamerasi va GPS ishlatilmoqda</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Mashina qurilmalari o'rnatilmagan. Qo'riqchi rejim to'liq emas.
              </p>
              <p className="text-blue-400 text-xs mt-1">
                📍 O'rnatish: {WORKSHOP.address} · {WORKSHOP.phone}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Chap: Status + Kamera ─────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Status */}
            <div className={`bg-gray-900 border rounded-3xl p-5 transition-colors ${
              isBlocked ? 'border-red-500/50' : 'border-green-500/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full animate-pulse ${isBlocked ? 'bg-red-500' : 'bg-green-500'}`}/>
                  <p className={`font-semibold ${isBlocked ? 'text-red-400' : 'text-green-400'}`}>
                    {isBlocked ? '🔒 BLOKLANGAN' : '🟢 ONLINE · Xavfsiz'}
                  </p>
                </div>
                <span className="text-xs text-gray-600">{new Date().toLocaleTimeString()}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800/60 rounded-2xl p-3">
                  <p className="text-gray-500 text-xs mb-1">📍 Joylashuv</p>
                  <p className="text-xs font-medium break-all">
                    {gpsError ? <span className="text-red-400">{gpsError}</span> : location}
                  </p>
                </div>
                <div className="bg-gray-800/60 rounded-2xl p-3">
                  <p className="text-gray-500 text-xs mb-1">🚗 Tezlik</p>
                  <p className="text-xl font-bold">{speed}<span className="text-xs text-gray-400"> km/s</span></p>
                </div>
                <div className="bg-gray-800/60 rounded-2xl p-3">
                  <p className="text-gray-500 text-xs mb-1">📡 GPS</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-2 h-2 rounded-full ${gpsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}/>
                    <span className="text-xs">{gpsConnected ? 'Ulangan' : 'Ulanmagan'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kamera */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Kamera</h3>
                  <p className="text-gray-500 text-xs">
                    {deviceMode === 'car' ? '📹 Mashina kamerasi' : '📱 Telefon kamerasi'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleMic}
                    className={`p-2 rounded-xl transition-colors ${micActive ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
                    {micActive ? <Mic size={18}/> : <MicOff size={18}/>}
                  </button>
                  <button onClick={cameraActive ? stopCamera : startCamera}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-medium text-sm transition-all ${
                      cameraActive
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                    {cameraActive ? <><CameraOff size={16}/>O'chirish</> : <><Camera size={16}/>Yoqish</>}
                  </button>
                </div>
              </div>

              <div className="relative bg-black rounded-2xl overflow-hidden" style={{aspectRatio:'16/9'}}>
                <video ref={videoRef} autoPlay playsInline muted={!micActive}
                  className="w-full h-full object-cover"
                  style={{display: cameraActive ? 'block' : 'none'}}/>
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <Camera size={48} className="mb-3 opacity-30"/>
                    {cameraError
                      ? <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
                      : <p className="text-sm">Kamera o'chirilgan</p>}
                  </div>
                )}
                {cameraActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 px-2.5 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>
                    <span className="text-xs font-bold">LIVE</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── O'ng: Boshqaruv ────────────────────── */}
          <div className="space-y-4">

            {/* Bloklash */}
            <motion.div whileHover={{scale:1.02}} onClick={handleBlock}
              className={`rounded-3xl p-6 border cursor-pointer transition-all ${
                isBlocked
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-gray-900 border-gray-700 hover:border-blue-500'
              }`}>
              <Shield className={`w-10 h-10 mb-3 ${isBlocked ? 'text-red-400' : 'text-blue-500'}`}/>
              <h3 className="text-lg font-bold">{isBlocked ? 'Blok ochish' : 'Bloklash'}</h3>
              <p className="text-gray-400 text-sm mt-1">
                {isBlocked ? 'Blokni olib tashlash' : 'Mashinani masofadan bloklash'}
              </p>
            </motion.div>

            {/* Signal */}
            <motion.div whileHover={{scale:1.02}} onClick={() => setSignalActive(!signalActive)}
              className={`rounded-3xl p-6 border cursor-pointer transition-all ${
                signalActive ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-900 border-gray-700 hover:border-yellow-500'
              }`}>
              <Activity className={`w-10 h-10 mb-3 ${signalActive ? 'text-yellow-400' : 'text-yellow-500'}`}/>
              <h3 className="text-lg font-bold">Signal</h3>
              <p className="text-gray-400 text-sm">{signalActive ? '🔊 Signal yoqilgan' : 'Signalni yoqish'}</p>
            </motion.div>

            {/* Google Maps */}
            <motion.div whileHover={{scale:1.02}}
              onClick={() => coords && window.open(`https://maps.google.com/?q=${coords.lat},${coords.lng}`, '_blank')}
              className={`rounded-3xl p-6 border transition-all ${
                coords ? 'bg-gray-900 border-gray-700 hover:border-purple-500 cursor-pointer' : 'bg-gray-900/50 border-gray-800 opacity-60'
              }`}>
              <MapPin className="w-10 h-10 text-purple-500 mb-3"/>
              <h3 className="text-lg font-bold">Google Maps</h3>
              <p className="text-gray-400 text-sm">{coords ? "Xaritada ko'rish →" : 'GPS kutilmoqda...'}</p>
            </motion.div>

            {/* Coords */}
            {coords && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-xs text-gray-400 space-y-1">
                <p>🌐 Lat: <span className="text-white">{coords.lat.toFixed(6)}</span></p>
                <p>🌐 Lng: <span className="text-white">{coords.lng.toFixed(6)}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorPage;
