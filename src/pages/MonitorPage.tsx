import { useAuth } from '../context/AuthContext';
import { Shield, MapPin, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MonitorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 hover:bg-gray-900 rounded-2xl"
          >
            <ArrowLeft size={26} />
          </button>
          <h1 className="text-4xl font-bold">Real vaqt monitoring</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="lg:col-span-2 bg-gray-900 border border-green-500/30 rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-500 font-semibold text-xl">ONLINE • Xavfsiz</p>
            </div>

            <h2 className="text-5xl font-bold mb-2">{user?.carModel}</h2>
            <p className="text-3xl text-gray-400 mb-8">{user?.carPlate}</p>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Hozirgi joylashuv</span>
                <span className="font-medium">Toshkent, Yunusobod tumani</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tezlik</span>
                <span className="font-medium">0 km/soat</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Batareya</span>
                <span className="font-medium text-green-500">98%</span>
              </div>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="space-y-6">
            <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-blue-500 cursor-pointer">
              <Shield className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-2xl font-bold">Bloklash</h3>
              <p className="text-gray-400">Mashinani masofadan bloklash</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-yellow-500 cursor-pointer">
              <Activity className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-2xl font-bold">Signal</h3>
              <p className="text-gray-400">Signalni yoqish</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-purple-500 cursor-pointer">
              <MapPin className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-2xl font-bold">Joylashuvni kuzatish</h3>
              <p className="text-gray-400">GPS kuzatuvi</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorPage;