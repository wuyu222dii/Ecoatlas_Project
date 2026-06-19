import { request, withAuth } from "./client";

type LoginData = {
  token: string;
  user: AuthUser;
};

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
};

const AUTH_USER_KEY = "auth_user";

export function saveToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

export const authApi = {
  sendRegisterCode(email: string) {
    return request<null>("/auth/register/send-code", { email });
  },
  register(email: string, password: string, name: string, code: string) {
    return request<LoginData>("/auth/register", { email, password, name, code });
  },
  login(email: string, password: string) {
    return request<LoginData>("/auth/login", { email, password });
  },
  googleLogin(idToken: string) {
    return request<LoginData>("/auth/google", { idToken });
  },
  me(token: string) {
    return withAuth<AuthUser>("/auth/me", {}, token);
  },
  updateName(token: string, body: { name: string }) {
    return withAuth<AuthUser>("/auth/profile/name", body, token);
  },
  updateAvatar(token: string, body: { avatarUrl: string }) {
    return withAuth<AuthUser>("/auth/profile/avatar", body, token);
  },
  sendForgotCode(email: string) {
    return request<null>("/auth/forgot-password/send-code", { email });
  },
  resetPassword(email: string, code: string, newPassword: string) {
    return request<null>("/auth/forgot-password/reset", { email, code, newPassword });
  },
};
