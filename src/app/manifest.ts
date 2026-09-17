import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Control de Carga de Jugadores", short_name: "Carga Jugadores", description: "Control de minutos, Borg y frecuencia de partidos para fútbol.", start_url: "/dashboard?source=pwa", scope: "/", display: "standalone", display_override: ["standalone", "minimal-ui"], background_color: "#f5f7f5", theme_color: "#176b4a", lang: "es-AR", icons: [{ src: "/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" }, { src: "/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" }] };
}
