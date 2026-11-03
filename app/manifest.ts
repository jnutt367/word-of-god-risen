import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes Word of God Risen installable
 * (home-screen icon, standalone window) like a native app.
 * Served by Next at /manifest.webmanifest and linked automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Word of God Risen",
    short_name: "Word of God",
    description:
      "The whole Bible read aloud by Grandpa Teddy — pick a chapter, tap Listen, and read along. No sign-up, nothing to download.",
    start_url: "/",
    display: "standalone",
    // "any" = the app follows the phone in every direction, including
    // upside-down portrait (readers holding the phone with the cable
    // at the top). No orientation is ever locked.
    orientation: "any",
    background_color: "#0c1f16",
    theme_color: "#0c1f16",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
