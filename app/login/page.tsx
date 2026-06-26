"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FlipbookLogo } from "@/components/ui/FlipbookLogo";
import { FlipbookWordmark } from "@/components/ui/FlipbookWordmark";

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
        <FlipbookLogo className="mb-3 h-10 w-10" />
        <h1><FlipbookWordmark /></h1>
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
