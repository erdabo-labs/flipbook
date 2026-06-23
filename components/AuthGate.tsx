"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      setChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!authenticated && pathname !== "/login") {
      router.replace("/login");
    } else if (authenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [checked, authenticated, pathname, router]);

  if (!checked) return null;
  if (!authenticated && pathname !== "/login") return null;

  return (
    <>
      <main className="flex-1 pb-20 md:pb-6">{children}</main>
      {authenticated && <BottomNav />}
    </>
  );
}
