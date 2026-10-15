import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PantauPangan v2.0 - Sistem Informasi & Early Warning Harga Pangan",
    short_name: "PantauPangan",
    description:
      "Platform intelijen harga komoditas pangan Bapanas dengan radar anomali dan prediksi inflasi daerah.",
    start_url: "/",
    display: "standalone",
    background_color: "#064e3b", // Forest 900
    theme_color: "#047857", // Forest 700
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
