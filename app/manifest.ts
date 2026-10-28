import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "Flipbook", short_name: "Flipbook", description: "Your deals, inventory, and Flippy evaluations", start_url: "/", scope: "/", display: "standalone", background_color: "#FAF9F6", theme_color: "#FAF9F6", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }, { src: "/app-icon.png", sizes: "1024x1024", type: "image/png" }] };
}
