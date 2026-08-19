import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CV Simple — Free and private CV builder",
    short_name: "CV Simple",
    description: "Create and export a professional one-page CV without registration or uploading your personal data.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f8",
    theme_color: "#173b63",
    lang: "es",
    categories: ["business", "productivity", "utilities"],
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
