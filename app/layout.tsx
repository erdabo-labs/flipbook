import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#FAF9F6" };

export const metadata: Metadata = {
  title: "Flipbook",
  appleWebApp: { capable: true, title: "Flipbook", statusBarStyle: "default" },
  description: "Track local buy/sell/trade deals, with Flippy as your AI sidekick",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-[#1A1A17]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
