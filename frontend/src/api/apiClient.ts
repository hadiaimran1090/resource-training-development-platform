import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// In-memory token storage (Not written to localStorage)
let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null): void => {
  memoryToken = token;
};

export const getMemoryToken = (): string | null => memoryToken;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer Token from in-memory variable
apiClient.interceptors.request.use(
  (config) => {
    if (memoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
