import type { MetadataRoute } from "next";
import { getSiteUrl } from "./site-url";
import { getProfessionalPresetPath, professionalPresetIds } from "./professional-presets";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const homeLanguages = { es: `${siteUrl}/es`, en: `${siteUrl}/en`, "x-default": siteUrl };
  const homePages = ["es", "en"].map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
    images: [`${siteUrl}/og.png`],
    alternates: { languages: homeLanguages },
  }));
  const catalogLanguages = { es: `${siteUrl}/es/plantillas`, en: `${siteUrl}/en/templates` };
  const catalogPages = ["es/plantillas", "en/templates"].map((path) => ({
    url: `${siteUrl}/${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
    alternates: { languages: catalogLanguages },
  }));
  const professionalPages = professionalPresetIds.flatMap((id) => {
    const languages = {
      es: `${siteUrl}${getProfessionalPresetPath("es", id)}`,
      en: `${siteUrl}${getProfessionalPresetPath("en", id)}`,
    };
    return (["es", "en"] as const).map((locale) => ({
      url: `${siteUrl}${getProfessionalPresetPath(locale, id)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: { languages },
    }));
  });
  const institutionalGroups = [
    { es: "es/acerca-de", en: "en/about" },
    { es: "es/privacidad", en: "en/privacy" },
    { es: "es/terminos", en: "en/terms" },
  ];
  const institutionalPages = institutionalGroups.flatMap((paths) => {
    const languages = { es: `${siteUrl}/${paths.es}`, en: `${siteUrl}/${paths.en}` };
    return (["es", "en"] as const).map((locale) => ({
      url: languages[locale],
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.55,
      alternates: { languages },
    }));
  });
  return [...homePages, ...catalogPages, ...professionalPages, ...institutionalPages];
}
