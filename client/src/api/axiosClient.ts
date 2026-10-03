// client/src/api/axiosClient.ts
import axios from "axios";

const getBaseUrl = (): string => {
  let url =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    "http://localhost:5000/api";
  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends and receives httpOnly refresh cookies
  headers: {
    "Content-Type": "application/json",
  },
});

type StatusListener = (isWakingUp: boolean) => void;
const listeners = new Set<StatusListener>();

export const registerServerStatusListener = (listener: StatusListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let activeRequests = 0;
let coldStartTimer: any = null;

const notifyListeners = (isWakingUp: boolean) => {
  listeners.forEach((fn) => {
    try {
      fn(isWakingUp);
    } catch {
      // Ignore listener error
    }
  });
};

const handleRequestStart = () => {
  activeRequests++;
  if (activeRequests === 1) {
    // If request doesn't complete within 1.5s, trigger cold-start waking up banner
    coldStartTimer = setTimeout(() => {
      notifyListeners(true);
    }, 1500);
  }
};

const handleRequestEnd = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    notifyListeners(false);
  }
};

// Interceptor 1: Attach Access Token & track in-flight requests
axiosClient.interceptors.request.use(
  (config) => {
    handleRequestStart();
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    handleRequestEnd();
    return Promise.reject(error);
  },
);

// Interceptor 2: Catch 401s and automatically refresh access token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    handleRequestEnd();
    return response;
  },
  async (error) => {
    handleRequestEnd();
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = data.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
