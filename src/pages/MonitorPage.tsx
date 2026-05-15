import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Navigation, Users, AlertTriangle, Shield,
  Car, MapPin, Clock, Square, Phone, Check,
  User, Zap, Lock, Unlock, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, Vehicle, Person, Alert } from '../utils/db';

type MonitorStep = 'select_vehicle' | 'camera_view' | 'driver_detected' | 'passenger_query' | 'engine_auth' | 'trip_active' | 'theft_alert' | 'weapon_alert';

interface PassengerQuery {
  seat: string;
  seatLabel: string;
  answered: boolean;
  relation?: 'family' | 'friend' | 'stranger';
  faceImage?: string;
}

const SEAT_NAMES: { seat: string; seatLabel: string }[] = [
  { seat: 'front_passenger', seatLabel: "Old o'ng o'rindiq" },
  { seat: 'rear_left', seatLabel: 'Orqa chap' },
  { seat: 'rear_center', seatLabel: 'Orqa markaziy' },
  { seat: 'rear_right', seatLabel: "Orqa o'ng" },
];

const PERSON_AVATARS = ['👨', '👩', '👴', '👵', '👦', '👧'];
const TOSHKENT_LOCS = [
  { lat: 41.2995, lng: 69.2401, address: "Yunusobod, Buyuk Ipak yo'li ko'chasi", timestamp: new Date().toISOString() },
  { lat: 41.3111, lng: 69.2797, address: "Shayxontohur, Navoiy ko'chasi", timestamp: new Date().toISOString() },
  { lat: 41.2800, lng: 69.2200, address: "Sergeli, Yangi hayot ko'chasi", timestamp: new Date().toISOString() },
  { lat: 41.3000, lng: 69.2600, address: "Olmazor, Farxod bozori", timestamp: new Date().toISOString() },
  { lat: 41.3200, lng: 69.2500, address: "Mirzo Ulug'bek, Universitet ko'chasi", timestamp: new Date().toISOString() },
];

export default function MonitorPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<MonitorStep>('select_vehicle');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [sessionId] = useState(() => db.generateId());
  const [passengers, setPassengers] = useState<PassengerQuery[]>([]);
  const [currentPassengerIdx, setCurrentPassengerIdx] = useState(0);
  const [engineAuth, setEngineAuth] = useState<'pending' | 'yes' | 'no' | 'timed'>('pending');
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [countdown, setCountdown] = useState(0);
  const [tripStarted, setTripStarted] = useState(false);
  const [tripTime, setTripTime] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(TOSHKENT_LOCS[0]);
  const [locationHistory, setLocationHistory] = useState<typeof TOSHKENT_LOCS>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [scanningFace, setScanningFace] = useState(false);
  const [driverDetected, setDriverDetected] = useState(false);

  useEffect(() => {
    if (user) {
      setVehicles(db.getVehiclesByUserId(user.id));
    }
  }, [user]);

  // Trip timer
  useEffect(() => {
    if (!tripStarted) return;
    const t = setInterval(() => {
      setTripTime(prev => prev + 1);
      // Update location every 30 seconds
      if (tripTime % 30 === 0) {
        const newLoc = TOSHKENT_LOCS[Math.floor(Math.random() * TOSHKENT_LOCS.length)];
        setCurrentLocation(newLoc);
        setLocationHistory(prev => [...prev, { ...newLoc, timestamp: new Date().toISOString() } as any]);
        if (selectedVehicle) {
          db.updateVehicle(selectedVehicle.id, { lastLocation: { ...newLoc, timestamp: new Date().toISOString() } });
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, [tripStarted, tripTime, selectedVehicle]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0 || engineAuth !== 'timed') return;
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          setEngineAuth('yes');
          speak(`Mashina egasi ${delayMinutes} daqiqadan so'ng mashinani zavodi qilishga ruxsat berdi!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown, engineAuth, delayMinutes]);

  const speak = (text: string) => {
    setMessages(prev => [...prev.slice(-4), text]);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'uz-UZ';
      u.rate = 0.9;
      try { window.speechSynthesis.speak(u); } catch { }
    }
  };

  const handleVehicleSelect = (v: Vehicle) => {
    setSelectedVehicle(v);
    setStep('camera_view');
    setScanningFace(true);
    setTimeout(() => {
      setScanningFace(false);
      setDriverDetected(true);
      setStep('driver_detected');
      speak('Siz mashinaning rul qismiga o\'tirdingiz. Yonidagi o\'rindiqda kim o\'tiribdi?');
    }, 3000);
  };

  const handleDriverConfirmed = () => {
    if (!user || !selectedVehicle) return;
    // Save driver as person
    const driverPerson = db.savePerson({
      sessionId,
      vehicleId: selectedVehicle.id,
      seatPosition: 'driver',
      relation: 'family',
      isKnown: true,
      timestamp: new Date().toISOString(),
    });
    setPersons(prev => [...prev, driverPerson]);
    // Setup passenger queries
    const queries: PassengerQuery[] = SEAT_NAMES.map(s => ({
      seat: s.seat,
      seatLabel: s.seatLabel,
      answered: false,
      faceImage: PERSON_AVATARS[Math.floor(Math.random() * PERSON_AVATARS.length)],
    }));
    setPassengers(queries);
    setCurrentPassengerIdx(0);
    setStep('passenger_query');
  };

  const handlePassengerRelation = (relation: 'family' | 'friend' | 'stranger') => {
    if (!selectedVehicle) return;
    const updated = [...passengers];
    updated[currentPassengerIdx] = { ...updated[currentPassengerIdx], answered: true, relation };

    // Save person
    const p = db.savePerson({
      sessionId,
      vehicleId: selectedVehicle.id,
      seatPosition: passengers[currentPassengerIdx].seat,
      relation,
      faceImage: passengers[currentPassengerIdx].faceImage,
      isKnown: relation !== 'stranger',
      timestamp: new Date().toISOString(),
    });
    setPersons(prev => [...prev, p]);

    // Save face if known
    if (user && relation !== 'stranger') {
      db.saveFace({
        userId: user.id,
        personId: p.id,
        relation,
        faceDescriptor: `face_${Date.now()}`,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        seenCount: 1,
      });
    }

    setPassengers(updated);

    // Check if all passengers answered
    const nextUnanswered = updated.findIndex((q, i) => i > currentPassengerIdx && !q.answered);
    if (nextUnanswered === -1) {
      // All done
      setTimeout(() => setStep('engine_auth'), 500);
      speak('Barcha yo\'lovchilar aniqlandi. Mashina egasidan motor yoqishga ruxsat so\'ralmoqda.');
    } else {
      setCurrentPassengerIdx(nextUnanswered);
      speak(`${SEAT_NAMES[nextUnanswered].label}da o\'tirgan kishi kim?`);
    }
  };

  const skipPassenger = () => {
    const updated = [...passengers];
    updated[currentPassengerIdx] = { ...updated[currentPassengerIdx], answered: true, relation: 'stranger' };
    setPassengers(updated);
    const nextUnanswered = updated.findIndex((q, i) => i > currentPassengerIdx && !q.answered);
    if (nextUnanswered === -1) {
      setTimeout(() => setStep('engine_auth'), 500);
    } else {
      setCurrentPassengerIdx(nextUnanswered);
    }
  };

  const handleEngineAuth = (decision: 'yes' | 'no' | 'timed') => {
    setEngineAuth(decision);
    if (decision === 'yes') {
      speak('Mashina egasi mashinani zavodi qilishga ruxsat berdi!');
      setStep('trip_active');
      setTripStarted(true);
      if (selectedVehicle) db.updateVehicle(selectedVehicle.id, { status: 'active' });
    } else if (decision === 'no') {
      speak('Afsuski, mashina egasi mashinani zavodi qilishga ruxsat bermadi!');
    } else {
      const secs = delayMinutes * 60;
      setCountdown(secs);
      speak(`Mashina egasi ${delayMinutes} daqiqadan so'ng mashinani zavodi qilishga ruxsat berdi!`);
    }
  };

  const handleTheftSOS = () => {
    if (activeAlert) {
      db.updateAlert(activeAlert.id, { resolved: true, userAction: 'sos' });
    }
    speak('SOS! Politsiyaga qo\'ng\'iroq qilinmoqda!');
    alert(`🚨 SOS SIGNAL!\n\n📞 102 ga qo'ng'iroq qilinmoqda...\n\n📍 Manzil: ${currentLocation.address}\n🚗 Mashina: ${selectedVehicle?.plateNumber}\n👤 Egasi: ${user?.name}\n📱 Tel: ${user?.phone || '+998901234567'}\n\n📸 O'g'rilar rasmlari va video yuborildi!\n\nPolitsiya yo'lda!`);
    setActiveAlert(null);
    setStep('select_vehicle');
  };

  const handleTheftSelf = () => {
    if (activeAlert) {
      db.updateAlert(activeAlert.id, { resolved: true, userAction: 'self_handle' });
    }
    speak('Mashina egasiga barcha ma\'lumotlar yuborilmoqda.');
    alert(`📱 Sizga barcha ma'lumotlar yuborildi:\n\n📍 Mashina manzili: ${currentLocation.address}\n🔄 Har 5 daqiqada yangilanadi\n\n📸 O'g'rilar rasmlari:\n• Rul egasi: 👤\n• Yonida: 👤\n\n🎬 Video yozib olinmoqda...\n📊 GPS trek saqlanmoqda`);
    setActiveAlert(null);
    setStep('select_vehicle');
  };

  const simulateTheft = () => {
    if (!user || !selectedVehicle) return;
    const alert = db.createAlert({
      vehicleId: selectedVehicle.id,
      userId: user.id,
      type: 'theft',
      message: `⚠️ Mashinangiz (${selectedVehicle.plateNumber}) ruxsatsiz yoqildi!`,
      severity: 'critical',
      location: currentLocation,
      resolved: false,
    });
    db.updateVehicle(selectedVehicle.id, { status: 'stolen' });
    setActiveAlert(alert);
    setStep('theft_alert');
    speak('Diqqat! Mashinangiz zavodi qilindi. Nima qilasiz?');
  };

  const simulateWeaponDetected = () => {
    if (!user || !selectedVehicle) return;
    const alert = db.createAlert({
      vehicleId: selectedVehicle.id,
      userId: user.id,
      type: 'weapon_detected',
      message: '🔫 Mashina ichida sovuq qurol aniqlandi!',
      severity: 'critical',
      location: currentLocation,
      resolved: false,
    });
    setActiveAlert(alert);
    setStep('weapon_alert');
    speak('Diqqat! Mashina ichida qurol aniqlandi! Xavf darajasi yuqori!');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!user) return null;

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-xl font-bold">Monitoring</h2>
        <div className="flex items-center gap-1 bg-green-900/30 border border-green-700/50 rounded-xl px-3 py-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-medium">Real-time</span>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-3 space-y-1">
              {messages.map((msg, i) => (
                <p key={i} className={`text-sm flex items-start gap-2 ${i === messages.length - 1 ? 'text-white' : 'text-gray-500'}`}>
                  <span className="text-blue-400 flex-shrink-0">🔊</span> {msg}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP: Select Vehicle */}
      {step === 'select_vehicle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Car size={16} className="text-blue-400" /> Mashinani tanlang
            </h3>
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">Hech qanday mashina yo'q</p>
                <p className="text-gray-600 text-sm">Mashinalar bo'limida mashina qo'shing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => (
                  <button key={v.id} onClick={() => handleVehicleSelect(v)}
                    className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-600 rounded-2xl p-4 flex items-center gap-3 transition-all text-left">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${v.status === 'active' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                      <Car size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold">{v.brand} {v.model}</p>
                      <p className="text-gray-400 text-sm font-mono">{v.plateNumber}</p>
                    </div>
                    <Eye size={18} className="text-blue-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* STEP: Camera View / Scanning */}
      {step === 'camera_view' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="bg-gray-900 rounded-2xl overflow-hidden mb-4">
            {/* Camera Feed Simulation */}
            <div className="relative bg-gray-800 h-56 flex items-center justify-center">
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-10">
                {Array.from({length: 12}).map((_, i) => <div key={i} className="border border-gray-400"></div>)}
              </div>
              <div className="text-center">
                <Camera size={48} className="text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">Kamera yoqilmoqda...</p>
              </div>
              {scanningFace && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-40 border-4 border-blue-500 rounded-2xl flex items-center justify-center">
                      <User size={40} className="text-blue-400" />
                    </div>
                    <motion.div className="absolute inset-0 border-4 border-blue-300 rounded-2xl"
                      animate={{ opacity: [1, 0, 1], scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }} />
                  </div>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-red-600 rounded-full w-3 h-3 animate-pulse"></div>
              <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-0.5">
                <span className="text-white text-xs">● REC</span>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-0.5">
                <span className="text-white text-xs">{selectedVehicle?.plateNumber}</span>
              </div>
            </div>
            <div className="p-4 text-center">
              <div className="flex justify-center gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }} />
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-2">Haydovchi skanirlanmoqda...</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP: Driver Detected */}
      {step === 'driver_detected' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gray-900 rounded-2xl p-5 mb-4">
            {/* Camera */}
            <div className="relative bg-gray-800 rounded-xl h-40 flex items-center justify-center mb-4 overflow-hidden">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User size={32} className="text-white" />
                </div>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-green-400 text-xs">✓ Haydovchi aniqlandi</p>
              </div>
              <div className="absolute top-2 left-2 bg-red-600 rounded-full w-3 h-3 animate-pulse"></div>
              <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-0.5">
                <span className="text-white text-xs">● REC</span>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-3 mb-4">
              <p className="text-blue-300 text-sm font-medium">🚗 Siz mashinaning rul qismiga o'tirdingiz</p>
              <p className="text-gray-400 text-xs mt-1">Haydovchi sifatida tasdiqlash uchun "Tasdiqlash" tugmasini bosing</p>
            </div>

            <button onClick={handleDriverConfirmed}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2">
              <Check size={18} /> Tasdiqlash va davom etish
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP: Passenger Query */}
      {step === 'passenger_query' && passengers.length > 0 && currentPassengerIdx < passengers.length && (
        <motion.div key={currentPassengerIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-gray-900 rounded-2xl p-5 mb-4">
            {/* Progress */}
            <div className="flex gap-1 mb-4">
              {passengers.map((p, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${p.answered ? 'bg-green-500' : i === currentPassengerIdx ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
              ))}
            </div>

            {/* Camera with person */}
            <div className="relative bg-gray-800 rounded-xl h-44 flex items-center justify-center mb-4 overflow-hidden">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 text-4xl">
                  {passengers[currentPassengerIdx].faceImage}
                </div>
                <p className="text-orange-400 font-medium">{passengers[currentPassengerIdx].seatLabel}</p>
                <p className="text-gray-400 text-sm">Shaxs aniqlandi</p>
              </div>
              <div className="absolute top-2 left-2 bg-red-600 rounded-full w-3 h-3 animate-pulse"></div>
              <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-0.5">
                <span className="text-white text-xs">● REC</span>
              </div>
            </div>

            <div className="bg-orange-900/20 border border-orange-700/50 rounded-xl p-3 mb-4">
              <p className="text-orange-300 text-sm font-medium flex items-center gap-2">
                <Users size={14} />
                <strong>{passengers[currentPassengerIdx].seatLabel}</strong>da o'tirgan kishi kim?
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => handlePassengerRelation('family')}
                className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-medium text-sm transition-all flex flex-col items-center gap-1">
                <span className="text-xl">👨‍👩‍👧</span> Qarindoshim
              </button>
              <button onClick={() => handlePassengerRelation('friend')}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium text-sm transition-all flex flex-col items-center gap-1">
                <span className="text-xl">🤝</span> Tanishim
              </button>
              <button onClick={() => handlePassengerRelation('stranger')}
                className="py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-medium text-sm transition-all flex flex-col items-center gap-1">
                <span className="text-xl">❓</span> Begona
              </button>
            </div>

            <button onClick={skipPassenger}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-sm transition-all">
              Bu o'rindiq bo'sh
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP: Engine Auth */}
      {step === 'engine_auth' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gray-900 rounded-2xl p-5 mb-4">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap size={32} className="text-white" />
              </div>
              <h3 className="text-white text-lg font-bold">Motor yoqishga ruxsat</h3>
              <p className="text-gray-400 text-sm">Haydovchi mashinani yoqmoqchi</p>
            </div>

            {engineAuth === 'pending' && (
              <div className="space-y-3">
                <button onClick={() => handleEngineAuth('yes')}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3">
                  <Unlock size={22} /> Ha - Ruxsat beraman
                </button>
                <button onClick={() => handleEngineAuth('no')}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3">
                  <Lock size={22} /> Yo'q - Ruxsat bermayman
                </button>
                <div className="bg-gray-800 rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                    <Clock size={14} /> Necha daqiqadan keyin ruxsat berish?
                  </p>
                  <div className="flex items-center gap-3">
                    <input type="range" min="1" max="60" value={delayMinutes} onChange={e => setDelayMinutes(parseInt(e.target.value))}
                      className="flex-1 accent-blue-600" />
                    <span className="text-white font-bold w-16 text-right">{delayMinutes} min</span>
                  </div>
                  <button onClick={() => handleEngineAuth('timed')}
                    className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                    <Clock size={16} /> {delayMinutes} daqiqadan keyin
                  </button>
                </div>
              </div>
            )}

            {engineAuth === 'no' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-center">
                  <Lock size={32} className="text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 font-bold">Motor bloklangan!</p>
                  <p className="text-gray-400 text-sm mt-1">Haydovchi mashinani yoqa olmaydi</p>
                </div>
                <button onClick={() => setEngineAuth('pending')} className="w-full mt-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-sm">
                  Qaytadan ko'rib chiqish
                </button>
              </motion.div>
            )}

            {engineAuth === 'timed' && countdown > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 text-center">
                  <Clock size={32} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-bold text-3xl">{formatTime(countdown)}</p>
                  <p className="text-blue-400 text-sm mt-1">Ruxsat berish uchun qolgan vaqt</p>
                  <p className="text-gray-400 text-xs mt-1">Haydovchi hozircha yoqa olmaydi</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* STEP: Trip Active */}
      {step === 'trip_active' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Live Camera */}
          <div className="relative bg-gray-800 rounded-2xl h-48 flex items-center justify-center mb-4 overflow-hidden border border-green-700/50">
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-5">
              {Array.from({length:12}).map((_,i)=><div key={i} className="border border-white"></div>)}
            </div>
            <div className="text-center">
              <Car size={40} className="text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium">Sayohat aktiv</p>
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 rounded-lg px-2 py-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
            <div className="absolute top-2 right-2 bg-black/80 rounded-lg px-2 py-1">
              <span className="text-white text-xs font-mono">{formatTime(tripTime)}</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded-lg p-2">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-blue-400 flex-shrink-0" />
                <span className="text-white text-xs truncate">{currentLocation.address}</span>
              </div>
            </div>
          </div>

          {/* Trip Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-900 rounded-xl p-3 text-center">
              <Clock size={16} className="text-blue-400 mx-auto mb-1" />
              <div className="text-white font-bold">{formatTime(tripTime)}</div>
              <div className="text-gray-500 text-xs">Vaqt</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 text-center">
              <Users size={16} className="text-green-400 mx-auto mb-1" />
              <div className="text-white font-bold">{persons.length}</div>
              <div className="text-gray-500 text-xs">Yo'lovchi</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-3 text-center">
              <Navigation size={16} className="text-purple-400 mx-auto mb-1" />
              <div className="text-white font-bold">{locationHistory.length}</div>
              <div className="text-gray-500 text-xs">Nuqtalar</div>
            </div>
          </div>

          {/* Persons in car */}
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users size={14} className="text-blue-400" /> Mashina ichidagilar
            </h3>
            <div className="space-y-2">
              {persons.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    p.relation === 'family' ? 'bg-green-600' : p.relation === 'friend' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {p.seatPosition === 'driver' ? '🚗' : '👤'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{
                      p.seatPosition === 'driver' ? 'Haydovchi' :
                      SEAT_NAMES.find(s => s.seat === p.seatPosition)?.seatLabel || p.seatPosition
                    }</p>
                    <p className="text-gray-500 text-xs">{
                      p.relation === 'family' ? 'Qarindosh' : p.relation === 'friend' ? 'Tanish' : 'Begona'
                    }</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${p.relation === 'stranger' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Location History */}
          {locationHistory.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-green-400" /> Marshrut
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {locationHistory.slice(-5).reverse().map((loc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                    <span className="text-gray-300 truncate">{(loc as any).address || 'Manzil'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simulate Buttons */}
          <div className="space-y-2 mb-4">
            <p className="text-gray-500 text-xs text-center">Simulatsiya testlari:</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={simulateTheft}
                className="py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <AlertTriangle size={14} /> O'g'irlik sim.
              </button>
              <button onClick={simulateWeaponDetected}
                className="py-2.5 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/30 text-orange-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <Shield size={14} /> Qurol sim.
              </button>
            </div>
          </div>

          <button onClick={() => { setStep('select_vehicle'); setTripStarted(false); setTripTime(0); if (selectedVehicle) db.updateVehicle(selectedVehicle.id, { status: 'parked' }); }}
            className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2">
            <Square size={16} /> Sayohatni tugatish
          </button>
        </motion.div>
      )}

      {/* STEP: Theft Alert */}
      {step === 'theft_alert' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="bg-red-900/30 border-2 border-red-600 rounded-3xl p-6 mb-4 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={40} className="text-white" />
            </motion.div>
            <h3 className="text-red-400 text-2xl font-bold mb-2">🚨 OGOHLANTIRISH!</h3>
            <p className="text-white font-semibold mb-1">Mashinangiz ruxsatsiz yoqildi!</p>
            <p className="text-gray-400 text-sm mb-1">📍 {currentLocation.address}</p>
            <p className="text-gray-500 text-xs">{new Date().toLocaleTimeString('uz-UZ')}</p>
          </div>

          <p className="text-white font-semibold text-center mb-4">Nima qilasiz?</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleTheftSOS}
              className="py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg transition-all flex flex-col items-center gap-2">
              <Phone size={28} />
              <span>SOS</span>
              <span className="text-xs font-normal opacity-80">102 ga qo'ng'iroq</span>
            </button>
            <button onClick={handleTheftSelf}
              className="py-5 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl font-bold transition-all flex flex-col items-center gap-2">
              <User size={28} />
              <span className="text-sm">O'zim hal qilaman</span>
              <span className="text-xs font-normal opacity-80">Ma'lumot yuborish</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP: Weapon Alert */}
      {step === 'weapon_alert' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="bg-orange-900/30 border-2 border-orange-600 rounded-3xl p-6 mb-4 text-center">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={40} className="text-white" />
            </motion.div>
            <h3 className="text-orange-400 text-xl font-bold mb-2">⚠️ XAVF ANIQLANDI!</h3>
            <p className="text-white font-semibold mb-1">🔫 Sovuq qurol aniqlandi!</p>
            <p className="text-gray-400 text-sm mb-1">Sensori mashina ichida qurol borligini aniqladi</p>
            <p className="text-gray-400 text-sm">📍 {currentLocation.address}</p>
          </div>

          <p className="text-white font-semibold text-center mb-4">Nima qilasiz?</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleTheftSOS}
              className="py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg transition-all flex flex-col items-center gap-2">
              <Phone size={28} />
              <span>SOS</span>
              <span className="text-xs font-normal opacity-80">Politsiya</span>
            </button>
            <button onClick={handleTheftSelf}
              className="py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold transition-all flex flex-col items-center gap-2">
              <User size={28} />
              <span className="text-sm">O'zim hal qilaman</span>
              <span className="text-xs font-normal opacity-80">Ma'lumot olish</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
