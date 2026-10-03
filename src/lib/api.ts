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
      localStorage.removeItem('pos-token');
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/setup') {
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