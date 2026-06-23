"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const ALLOWED_EMAIL = "erdabo@gmail.com";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      setError("This app is private.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-bold">Flipbook</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {step === "email" ? "Sign in to continue." : `Enter the 6-digit code sent to ${email}.`}
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {step === "email" ? (
        <form onSubmit={handleSendCode} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
          <Input
            label="6-digit code"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
          <button
            type="button"
            className="text-sm text-zinc-500 underline"
            onClick={() => setStep("email")}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
