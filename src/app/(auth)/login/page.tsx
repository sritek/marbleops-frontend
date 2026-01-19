"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import { appMeta } from "@/config/navigation";

// Validation schema
const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login({
        phone: data.phone.replace(/\D/g, ""), // Strip non-digits
        password: data.password,
      });
      toast.success("Welcome back!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app p-4">
      {/* Background pattern */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-primary-100 via-bg-app to-blue-50 dark:from-slate-900 dark:via-bg-app dark:to-slate-800"
        aria-hidden="true"
      />

      {/* Login card */}
      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600 mb-4">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <CardTitle className="text-2xl">{appMeta.name}</CardTitle>
          <CardDescription>{appMeta.tagline}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Phone input */}
            <FormInput
              {...register("phone")}
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              error={errors.phone?.message}
              required
              autoComplete="tel"
              autoFocus
            />

            {/* Password input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text-primary"
              >
                Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`flex h-11 w-full rounded-lg border bg-bg-surface px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0 focus-visible:border-primary-600 ${
                    errors.password
                      ? "border-error focus-visible:border-error focus-visible:outline-error"
                      : "border-border-subtle"
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-error" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Help text */}
          <p className="mt-6 text-center text-sm text-text-muted">
            Contact your administrator if you need access or forgot your
            password.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
