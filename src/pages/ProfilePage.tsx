import { useAuth } from '../context/AuthContext';
import { User, Phone, Car, Edit3, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="max-w-4xl mx-auto px-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 hover:bg-gray-900 rounded-2xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-4xl font-bold">Profil</h1>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-6xl mb-4">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <button className="text-blue-500 flex items-center gap-2 text-sm hover:underline">
                <Edit3 size={16} /> Rasmni o'zgartirish
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-gray-400 text-sm">Ism va Familiya</p>
                <p className="text-3xl font-semibold mt-1">{user?.name}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <User size={18} /> Email
                  </p>
                  <p className="mt-1 font-medium">{user?.email}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Phone size={18} /> Telefon
                  </p>
                  <p className="mt-1 font-medium">{user?.phone || "+998 XX XXX XX XX"}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Car size={18} /> Mashina modeli
                  </p>
                  <p className="mt-1 font-medium">{user?.carModel}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Davlat raqami</p>
                  <p className="mt-1 font-medium text-xl tracking-widest">{user?.carPlate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;