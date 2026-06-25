"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getFlippyProfile, saveFlippyProfile } from "@/lib/db";
import { Input, Textarea, Toggle } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Empty";

export default function SettingsPage() {
  const [location, setLocation] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [shipsItems, setShipsItems] = useState(false);
  const [styleNotes, setStyleNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const profile = await getFlippyProfile();
      if (profile) {
        setLocation(profile.location ?? "");
        setPlatforms(profile.platforms ?? "");
        setShipsItems(profile.ships_items);
        setStyleNotes(profile.style_notes ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await saveFlippyProfile({
        location: location.trim() || null,
        platforms: platforms.trim() || null,
        ships_items: shipsItems,
        style_notes: styleNotes.trim() || null,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Link href="/evaluations" className="mb-3 inline-block text-sm font-medium text-[#8C887D]">
        ‹ Evaluations
      </Link>
      <h1 className="mb-1 text-[26px] font-extrabold tracking-[-0.03em] text-[#1A1A17]">Configure Flippy</h1>
      <p className="mb-6 text-sm text-[#8C887D]">
        Tell Flippy how you operate so evaluations and suggested offers fit your actual habits.
      </p>

      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

      <div className="flex flex-col gap-4">
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Salt Lake City, UT"
        />
        <Input
          label="Where you sell"
          value={platforms}
          onChange={(e) => setPlatforms(e.target.value)}
          placeholder="e.g. FB Marketplace, KSL"
        />
        <Toggle label="I ship items" checked={shipsItems} onChange={setShipsItems} />
        <Textarea
          label="Your evaluation style / preferences"
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          placeholder="e.g. I only deal with simple, easy-to-resell items. I avoid anything that needs repair. I'm picky about meeting in person for high-value items. I like a 2x markup minimum."
        />
        <Button onClick={handleSave} disabled={saving} className="mt-2">
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
        </Button>
      </div>
    </div>
  );
}
