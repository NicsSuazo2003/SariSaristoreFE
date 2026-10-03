import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5286';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const path = window.location.pathname;

      // Don't redirect for public/auth-check endpoints
      const isPublicEndpoint =
        url.includes('/api/auth/needs-setup') ||
        url.includes('/api/auth/setup') ||
        url.includes('/api/auth/login') ||
        url.includes('/api/auth/me') ||
        url.includes('/api/settings');

      // Don't redirect if already on setup/login
      const isAuthPage = path === '/setup' || path === '/login';

      if (!isPublicEndpoint && !isAuthPage) {
        localStorage.removeItem('pos-token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: any): string {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.title ||
    error?.message ||
    'Something went wrong'
  );
}