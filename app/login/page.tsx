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
      <div className="mb-8 flex flex-col items-center text-center">
        <svg className="mb-3 h-10 w-10" viewBox="0 0 40 40" fill="none" stroke="#047857" strokeWidth={3} strokeLinejoin="round">
          <path d="M2 4c6-2.4 12-2.4 18 0v32c-6-2.4-12-2.4-18 0z" />
          <path d="M38 4c-6-2.4-12-2.4-18 0v32c6-2.4 12-2.4 18 0z" />
        </svg>
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#1A1A17]">Flipbook</h1>
        <p className="mt-1 text-sm font-medium text-[#047857]">Every flip, on the books.</p>
        <p className="mt-2 text-sm text-[#8C887D]">Enter your passphrase to continue.</p>
      </div>
      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Passphrase"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <Button type="submit">Enter</Button>
      </form>
    </div>
  );
}
