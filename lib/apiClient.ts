import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses to handle errors globally if needed
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global error messages here
    return Promise.reject(error);
  }
);

export default apiClient;
