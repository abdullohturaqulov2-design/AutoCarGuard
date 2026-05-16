import { useState } from 'react';
import { useAuth, User } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mockUser: User = {
      id: 'user_' + Date.now(),
      name: formData.name || "Abdulloh Turaqulov",
      email: formData.email,
      phone: "+998901234567",
      carModel: "Toyota Camry",
      carPlate: "01 A 777 AA",
      avatar: "https://i.pravatar.cc/150?u=abdulloh",
    };

    login(mockUser);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center">
              <Car className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">AutoCarGuard</h1>
          <p className="text-gray-400 mt-2">Mashinangizni himoya qiling</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            {isLogin ? "Kirish" : "Ro‘yxatdan o‘tish"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <input
                type="text"
                placeholder="Ismingiz"
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email manzilingiz"
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Parol"
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-all py-3.5 rounded-2xl font-semibold text-lg text-white"
            >
              {isLogin ? "Kirish" : "Ro‘yxatdan o‘tish"}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            {isLogin ? "Hisobingiz yo‘qmi?" : "Allaqachon hisobingiz bormi?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:underline"
            >
              {isLogin ? "Ro‘yxatdan o‘ting" : "Kirish"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;