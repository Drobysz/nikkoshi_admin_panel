"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { apiRequest, formatApiError, unwrapData } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import type { LoginResponse, User } from "@/types/api";

const loginSchema = z.object({
  name: z.string().trim().min(1, "Admin name is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>;

export default function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError("");

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: parsed.data,
      });
      const user = unwrapData<User>(response.user as User | { data: User });
      setAuth(response.token, user);
      router.replace("/articles");
    } catch (error) {
      setApiError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {apiError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Admin name</span>
        <input
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          autoComplete="username"
        />
        {errors.name ? (
          <span className="mt-1 block text-xs text-red-600">{errors.name}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          autoComplete="current-password"
        />
        {errors.password ? (
          <span className="mt-1 block text-xs text-red-600">
            {errors.password}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
