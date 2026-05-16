import { useAuth } from '../context/AuthContext';
import { Car, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VehiclesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const vehicles = [
    {
      id: 1,
      model: user?.carModel || "Toyota Camry",
      plate: user?.carPlate || "01 A 777 AA",
      status: "Himoyalangan",
      lastCheck: "Bugun 10:45"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 hover:bg-gray-900 rounded-2xl"
            >
              <ArrowLeft size={26} />
            </button>
            <h1 className="text-4xl font-bold">Mashinalarim</h1>
          </div>

          <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl transition-all">
            <Plus size={22} />
            Yangi mashina qo‘shish
          </button>
        </div>

        <div className="grid gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Car size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">{vehicle.model}</h3>
                  <p className="text-xl tracking-widest text-gray-400">{vehicle.plate}</p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2 mt-6 md:mt-0">
                <span className="px-5 py-2 bg-green-500/20 text-green-500 rounded-2xl text-sm font-medium">
                  {vehicle.status}
                </span>
                <p className="text-sm text-gray-500">Oxirgi tekshiruv: {vehicle.lastCheck}</p>
              </div>

              <button className="mt-6 md:mt-0 text-red-500 hover:text-red-600 transition-colors">
                <Trash2 size={24} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehiclesPage;