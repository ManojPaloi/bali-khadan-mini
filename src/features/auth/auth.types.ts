export interface User {
  username: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
}

export interface AuthPayload {
  access: string;
  refresh: string;
  user?: User | null;
}
