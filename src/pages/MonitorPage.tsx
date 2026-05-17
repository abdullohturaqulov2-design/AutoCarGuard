import { useAuth } from '../context/AuthContext';
import { Shield, MapPin, Activity, ArrowLeft, Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import db from '../utils/db';

const MonitorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(false);

  // GPS
  const [location, setLocation] = useState('Aniqlanmoqda...');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = useState(0);
  const [gpsError, setGpsError] = useState('');
  const [gpsConnected, setGpsConnected] = useState(false);

  // Controls
  const [isBlocked, setIsBlocked] = useState(false);
  const [signalActive, setSignalActive] = useState(false);

  // ── GPS ────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS qo'llab-quvvatlanmaydi");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, speed: spd } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setSpeed(Math.round((spd || 0) * 3.6));
        setGpsConnected(true);
        setGpsError('');

        // DB ga saqlash
        if (user) {
          const vehicles = db.getVehiclesByUserId(user.id);
          if (vehicles.length > 0) {
            db.updateVehicle(vehicles[0].id, {
              lastLocation: {
                lat: latitude,
                lng: longitude,
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                timestamp: new Date().toISOString(),
              },
            });
          }
        }
      },
      err => {
        setGpsError("GPS ruxsat berilmadi yoki mavjud emas");
        setGpsConnected(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  // ── Camera ────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: micActive,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch {
      setCameraError("Kamera ruxsat berilmadi. Brauzer sozlamalarini tekshiring.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setCameraActive(false);
  };

  const toggleMic = async () => {
    if (!cameraActive) {
      setMicActive(!micActive);
      return;
    }
    // Mikrofon holatini o'zgartirish
    stream?.getAudioTracks().forEach(t => { t.enabled = !micActive; });
    setMicActive(!micActive);
  };

  // Cleanup
  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  // ── Controls ──────────────────────────────────────────────
  const handleBlock = () => {
    const next = !isBlocked;
    setIsBlocked(next);
    if (user) {
      db.createAlert({
        vehicleId: db.getVehiclesByUserId(user.id)[0]?.id || 'none',
        userId: user.id,
        type: 'unauthorized_start',
        message: next ? "Mashina masofadan bloklandi" : "Mashina bloki olib tashlandi",
        severity: 'high',
        resolved: false,
      });
    }
  };

  const openInMaps = () => {
    if (!coords) return;
    window.open(`https://maps.google.com/?q=${coords.lat},${coords.lng}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-3 hover:bg-gray-900 rounded-2xl transition-colors">
            <ArrowLeft size={26} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Real vaqt monitoring</h1>
            <p className="text-gray-400 text-sm mt-1">
              {user?.carModel && user?.carPlate ? `${user.carModel} · ${user.carPlate}` : 'Mashina ma\'lumotlari yo\'q'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Status + Camera ─────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <div className={`bg-gray-900 border rounded-3xl p-6 transition-colors ${
              isBlocked ? 'border-red-500/50' : 'border-green-500/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full animate-pulse ${isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                  <p className={`font-semibold ${isBlocked ? 'text-red-400' : 'text-green-400'}`}>
                    {isBlocked ? '🔒 BLOKLANGAN' : '🟢 ONLINE · Xavfsiz'}
                  </p>
                </div>
                <span className="text-xs text-gray-600">{new Date().toLocaleTimeString('uz')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-800/60 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1">📍 Joylashuv</p>
                  <p className="text-sm font-medium break-all">
                    {gpsError ? <span className="text-red-400 text-xs">{gpsError}</span> : location}
                  </p>
                </div>
                <div className="bg-gray-800/60 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1">🚗 Tezlik</p>
                  <p className="text-2xl font-bold">
                    {speed} <span className="text-sm font-normal text-gray-400">km/s</span>
                  </p>
                </div>
                <div className="bg-gray-800/60 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1">📡 GPS Holati</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${gpsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm">{gpsConnected ? 'Ulangan' : 'Ulanmagan'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Kamera</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMic}
                    className={`p-2 rounded-xl transition-colors ${micActive ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
                    title={micActive ? 'Mikrofon yoqiq' : 'Mikrofon o\'chirilgan'}
                  >
                    {micActive ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>

                  <button
                    onClick={cameraActive ? stopCamera : startCamera}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-medium text-sm transition-all ${
                      cameraActive
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {cameraActive ? <><CameraOff size={16} /> O'chirish</> : <><Camera size={16} /> Yoqish</>}
                  </button>
                </div>
              </div>

              <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={!micActive}
                  className="w-full h-full object-cover"
                  style={{ display: cameraActive ? 'block' : 'none' }}
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <Camera size={52} className="mb-3 opacity-40" />
                    {cameraError
                      ? <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
                      : <p className="text-sm">Kamera o'chirilgan</p>
                    }
                  </div>
                )}

                {cameraActive && (
                  <>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 px-2.5 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-bold">LIVE</span>
                    </div>
                    {micActive && (
                      <div className="absolute top-3 right-3 bg-blue-500/80 p-1.5 rounded-full">
                        <Mic size={14} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Controls ───────────────────────── */}
          <div className="space-y-4">
            {/* Block */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={handleBlock}
              className={`rounded-3xl p-6 border cursor-pointer transition-all ${
                isBlocked
                  ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/10'
                  : 'bg-gray-900 border-gray-700 hover:border-blue-500'
              }`}
            >
              <Shield className={`w-10 h-10 mb-3 ${isBlocked ? 'text-red-400' : 'text-blue-500'}`} />
              <h3 className="text-lg font-bold">{isBlocked ? 'Blok ochish' : 'Bloklash'}</h3>
              <p className="text-gray-400 text-sm mt-1">
                {isBlocked ? 'Blokni olib tashlash' : 'Mashinani masofadan bloklash'}
              </p>
            </motion.div>

            {/* Signal */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setSignalActive(!signalActive)}
              className={`rounded-3xl p-6 border cursor-pointer transition-all ${
                signalActive
                  ? 'bg-yellow-500/20 border-yellow-500'
                  : 'bg-gray-900 border-gray-700 hover:border-yellow-500'
              }`}
            >
              <Activity className={`w-10 h-10 mb-3 ${signalActive ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <h3 className="text-lg font-bold">Signal</h3>
              <p className="text-gray-400 text-sm mt-1">
                {signalActive ? '🔊 Signal yoqilgan' : 'Signalni yoqish'}
              </p>
            </motion.div>

            {/* Maps */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={openInMaps}
              className={`rounded-3xl p-6 border transition-all ${
                coords
                  ? 'bg-gray-900 border-gray-700 hover:border-purple-500 cursor-pointer'
                  : 'bg-gray-900/50 border-gray-800 cursor-not-allowed opacity-60'
              }`}
            >
              <MapPin className="w-10 h-10 text-purple-500 mb-3" />
              <h3 className="text-lg font-bold">Google Maps</h3>
              <p className="text-gray-400 text-sm mt-1">
                {coords ? "Xaritada ko'rish →" : 'GPS kutilmoqda...'}
              </p>
            </motion.div>

            {/* GPS Coords detail */}
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
