import { clientGet, clientPost } from "@/lib/api-client";
import { RegisterInput, LoginInput } from "@/lib/validations/auth";
import type { AuthUser as User, AuthResponse } from "@/types";

interface RegisterResponse {
  email: string;
}

interface VerifyOtpResponse {
  user: User;
}

export const authService = {
  // Register new user - returns email for OTP verification
  register: async (data: RegisterInput): Promise<RegisterResponse> => {
    const result = await clientPost<{ data: RegisterResponse }>(
      "/auth/register",
      data
    );
    return result.data;
  },

  // Verify OTP and complete registration
  verifyOtp: async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    const result = await clientPost<{ data: VerifyOtpResponse }>(
      "/auth/verify-otp",
      { email, otp }
    );
    return result.data;
  },

  // Resend OTP
  resendOtp: async (email: string): Promise<void> => {
    await clientPost("/auth/resend-otp", { email });
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

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await clientPost("/auth/forgot-password", { email });
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<void> => {
    await clientPost("/auth/reset-password", { token, password });
  },
};
