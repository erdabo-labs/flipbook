"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export const APP_PASSWORD = "flipbook2026";
export const AUTH_STORAGE_KEY = "flipbook_auth";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== APP_PASSWORD) {
      setError("Wrong password.");
      return;
    }
    localStorage.setItem(AUTH_STORAGE_KEY, "1");
    router.replace("/");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-bold">Flipbook</h1>
      <p className="mb-6 text-sm text-zinc-500">Enter the password to continue.</p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <Button type="submit">Unlock</Button>
      </form>
    </div>
  );
}
