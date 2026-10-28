"use client";
import { useEffect, useState } from "react";
export function PwaStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* App remains usable without offline support. */ });
    }
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return offline ? <div role="status" className="offline-status">You’re offline. Drafts stay in this tab; reconnect before saving.</div> : null;
}
