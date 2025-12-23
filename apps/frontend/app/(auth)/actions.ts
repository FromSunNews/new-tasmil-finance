"use server";

import { z } from "zod";
import { authApi } from "@/lib/api/auth";
import { cookies } from "next/headers";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const response = await authApi.login({
      email: validatedData.email,
      password: validatedData.password,
    });

    // Store token in cookie for server-side access
    if (response.access_token) {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", response.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    try {
      const response = await authApi.register({
        email: validatedData.email,
        password: validatedData.password,
      });

      // Store token in cookie for server-side access
      if (response.access_token) {
        const cookieStore = await cookies();
        cookieStore.set("auth_token", response.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      return { status: "success" };
    } catch (apiError: unknown) {
      // Check if user already exists
      const error = apiError as { message?: string; code?: string };
      if (error?.message?.includes("already exists") || error?.code === "user_exists") {
        return { status: "user_exists" };
      }
      throw apiError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

