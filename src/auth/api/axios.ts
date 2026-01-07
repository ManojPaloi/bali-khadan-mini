import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { store } from "@/store/store";
import { setCredentials, clearAuth } from "@/features/auth/authSlice";
import { refreshAccess } from "./authApi";

const RAW = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const baseURL = RAW ? `${RAW}/api` : "/api";

export const axiosPublic = axios.create({
  baseURL,
  withCredentials: true,
});

export const axiosProtected = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach access token
axiosProtected.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// ---- Refresh Queue ----
let isRefreshing = false;
let subscribers: Array<(token: string | null) => void> = [];

function subscribe(cb: (token: string | null) => void) {
  subscribers.push(cb);
}

function notify(token: string | null) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

axiosProtected.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/users/token/refresh/")
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribe((token) => {
            if (!token) return reject(error);
            original.headers.Authorization = `Bearer ${token}`;
            resolve(axiosProtected(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const data = await refreshAccess();

        store.dispatch(
          setCredentials({
            access: data.access,
            refresh: data.refresh,
            user: data.user ?? null,
          })
        );

        notify(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return axiosProtected(original);
      } catch (err) {
        notify(null);
        store.dispatch(clearAuth());
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
