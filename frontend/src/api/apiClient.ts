import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:5000/api';

const normalizeApiBaseUrl = (rawUrl: string): string => {
  const apiUrl = new URL(rawUrl.trim());
  const normalizedPath = apiUrl.pathname
    .replace(/\/{2,}/g, '/')
    .replace(/\/+$/, '');

  apiUrl.pathname =
    !normalizedPath || normalizedPath === '/'
      ? '/api'
      : normalizedPath.endsWith('/api')
        ? normalizedPath
        : `${normalizedPath}/api`;
  apiUrl.search = '';
  apiUrl.hash = '';

  return apiUrl.toString().replace(/\/+$/, '');
};

const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables browser to automatically send and accept HttpOnly Cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor for Automatic Silent Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (Access Token Expired)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // Attempt silent token refresh (HttpOnly cookie will be sent automatically)
        await apiClient.post('/auth/refresh');
        // Retry the failed original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
