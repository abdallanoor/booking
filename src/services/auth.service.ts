import { clientGet, clientPost } from "@/lib/api-client";
import { RegisterInput, LoginInput } from "@/lib/validations/auth";
import type { AuthUser as User, AuthResponse } from "@/types";

export const authService = {
  // Register new user
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const result = await clientPost<{ data: AuthResponse }>(
      "/auth/register",
      data
    );
    return result.data;
  },

  // Login user
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const result = await clientPost<{ data: AuthResponse }>(
      "/auth/login",
      data
    );
    return result.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await clientPost("/auth/logout");
  },

  // Get current user
  me: async (): Promise<User> => {
    const result = await clientGet<{ data: { user: User } }>("/auth/me");
    return result.data.user;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await clientGet(`/auth/verify-email?token=${token}`);
  },

  // Resend verification email
  resendVerificationEmail: async (email: string): Promise<void> => {
    await clientPost("/auth/resend-verification", { email });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await clientPost("/auth/forgot-password", { email });
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<void> => {
    await clientPost("/auth/reset-password", { token, password });
  },
};
