import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, GitBranch } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { api, ApiError } from "../../lib/api";
import { setAccessToken } from "../../lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      createdAt: string;
    };
  };
};

export default function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      return api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });
    },
    onSuccess: (response) => {
      setAccessToken(response.data.token);
      navigate("/app/overview", { replace: true });
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const serverError =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.error
        ? "Something went wrong. Please try again."
        : null;

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#171528] p-12 text-white lg:flex lg:flex-col">
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-white text-sm font-semibold text-thread-950">
            T
            <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-[#171528] bg-violet-400" />
          </div>

          <div>
            <p className="text-[15px] font-semibold tracking-[0.18em]">
              THREAD
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-violet-300/70">
              Decision intelligence
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-md">
          <div className="mb-7 flex size-11 items-center justify-center rounded-2xl bg-white/10 text-violet-200">
            <GitBranch size={20} />
          </div>

          <h1 className="text-4xl font-semibold leading-[1.15] tracking-[-0.04em]">
            Return to the decisions that shaped your work.
          </h1>

          <p className="mt-5 max-w-sm text-sm leading-7 text-zinc-400">
            Sign in to continue following decisions, context and dependencies
            across your team's work.
          </p>

          <div className="mt-10 flex items-center gap-3 text-xs text-zinc-500">
            <span className="size-2 rounded-full bg-violet-400" />
            Every decision leaves a trail.
          </div>
        </div>

        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full border border-violet-400/10" />
        <div className="absolute -bottom-20 -right-20 size-[350px] rounded-full border border-violet-400/10" />
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-thread-950 text-sm font-semibold text-white">
                T
                <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-white bg-thread-500" />
              </div>

              <span className="text-sm font-semibold tracking-[0.16em]">
                THREAD
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-thread-600">Welcome back</p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
            Continue your decision trail.
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Sign in to your THREAD account to continue where you left off.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-zinc-700"
              >
                Work email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-300 focus:border-thread-400 focus:ring-4 focus:ring-thread-100"
              />

              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-zinc-700"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 pr-12 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-300 focus:border-thread-400 focus:ring-4 focus:ring-thread-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition hover:text-zinc-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white transition hover:bg-thread-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}

              {!loginMutation.isPending && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-zinc-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-thread-700 hover:text-thread-900"
            >
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
