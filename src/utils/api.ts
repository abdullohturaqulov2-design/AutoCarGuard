import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const session = localStorage.getItem('autoguard_session');
  if (session) {
    try {
      const user = JSON.parse(session);
      if (user?.id) config.headers.Authorization = `Bearer ${user.id}`;
    } catch { /* ignore */ }
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('autoguard_session');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
