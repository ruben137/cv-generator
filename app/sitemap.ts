import type { MetadataRoute } from "next";
import { getSiteUrl } from "./site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const languages = { es: `${siteUrl}/es`, en: `${siteUrl}/en`, "x-default": siteUrl };
  return ["es", "en"].map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
    images: [`${siteUrl}/og.png`],
    alternates: { languages },
  }));
}
