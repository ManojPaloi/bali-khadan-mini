import { axiosPublic, axiosProtected } from "./axios";
import { store } from "@/store/store";
import { AuthPayload } from "@/features/auth/auth.types";

export const login = (credentials: {
  email: string;
  password: string;
}) =>
  axiosPublic
    .post<AuthPayload>("/users/login/", credentials)
    .then((r) => r.data);

export const refreshAccess = async (): Promise<AuthPayload> => {
  const { refreshToken } = store.getState().auth;
  if (!refreshToken) throw new Error("No refresh token");

  const { data } = await axiosPublic.post<AuthPayload>(
    "/users/token/refresh/",
    { refresh: refreshToken }
  );

  return data;
};

export const logoutApi = (refresh: string) =>
  axiosProtected.post("/users/logout/", { refresh }).then((r) => r.data);
