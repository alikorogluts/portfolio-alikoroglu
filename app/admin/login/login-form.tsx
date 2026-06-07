"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"password" | "two-factor">("password");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const value = searchParams.get("next");
    return value?.startsWith("/admin") ? value : "/admin";
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      twoFactorRequired?: boolean;
    } | null;

    if (!response.ok || !result?.success) {
      setError("Email or password is incorrect.");
      setIsSubmitting(false);
      return;
    }

    if (result.twoFactorRequired) {
      setStep("two-factor");
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function handleTwoFactorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/admin/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      setError("Authenticator code or backup code is incorrect.");
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  if (step === "two-factor") {
    return (
      <form
        onSubmit={handleTwoFactorSubmit}
        className="rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <div className="mb-7">
          <h2 className="text-xl font-medium text-white">Two-Factor Check</h2>
          <p className="mt-2 text-sm text-white/45">Enter your Google Authenticator code.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token" className="text-white/65">
            Authenticator code
          </Label>
          <Input
            id="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/25"
            placeholder="123456 or backup code"
            required
          />
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-7 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStep("password");
              setToken("");
              setError("");
            }}
            className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-white text-black hover:bg-white/85">
            {isSubmitting ? "Verifying..." : "Verify"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <div className="mb-7">
        <h2 className="text-xl font-medium text-white">Admin Login</h2>
        <p className="mt-2 text-sm text-white/45">Sign in with your owner credentials.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/65">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/25"
            placeholder="admin@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/65">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/25"
            placeholder="Password"
            required
          />
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 w-full bg-white text-black hover:bg-white/85"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
