import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Control de Carga de Jugadores", short_name: "Carga Jugadores", description: "Control de minutos, Borg y frecuencia de partidos para fútbol.", start_url: "/", display: "standalone", background_color: "#f5f7f5", theme_color: "#176b4a", lang: "es-AR", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }, { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }] };
}
