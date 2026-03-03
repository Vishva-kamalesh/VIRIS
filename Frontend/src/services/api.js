import axios from 'axios';
import { store } from '../app/store';
import { logout } from '../features/auth/authSlice';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9000',
  timeout: 30000,
});

// ── Attach JWT token to every request ──────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('viris_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle 401 responses (token expired) ───────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — log out the user
      localStorage.removeItem('viris_token');
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginAPI = (data) => API.post('/login', data);
export const registerAPI = (data) => API.post('/register', data);
export const getMeAPI = () => API.get('/me');
export const citizenLookupAPI = (params) => API.get('/citizen/lookup', { params });

// Violations
export const uploadImageAPI = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const detectPlateAPI = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/detect-plate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getViolationsAPI = () => API.get('/violations');
export const searchViolationsAPI = (vehicleNumber) =>
  API.get(`/violations/search?vehicleNumber=${vehicleNumber}`);
export const getMonthlyStatsAPI = () => API.get('/violations/monthly');

// Payment
export const payFineAPI = (vehicleNumber) =>
  API.post(`/pay?vehicleNumber=${vehicleNumber}`);

// Vehicle lookup (manual search by plate)
export const vehicleLookupAPI = (vehicleNumber) =>
  API.get(`/vehicle-lookup?vehicleNumber=${vehicleNumber}`);

// Manual fine (police-issued without image)
export const manualFineAPI = (data) => API.post('/manual-fine', data);

// Send SMS manually
export const sendSmsAPI = (violationId) =>
  API.post(`/send-sms?violationId=${violationId}`);

export default API;
