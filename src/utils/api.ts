import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (token qo'shish uchun)
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const token = JSON.parse(user).id; // real backendda JWT token bo'ladi
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;