import axios from 'axios';

console.log('API URL:', import.meta.env.VITE_API_URL);

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// automatically attach JWT token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// handle 401 — token expired or invalid
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // only redirect to login if 401 AND we're not on an auth route
    if (error.response?.status === 401) {
      const isAuthRoute = error.config.url.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;