import type { MetadataRoute } from "next";
import { getSiteUrl } from "./site-url";
import { getProfessionalPresetPath, professionalPresetIds } from "./professional-presets";
import { getGuideSitemapEntries } from "./guide-content";

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
  const jobMatchLanguages = { es: `${siteUrl}/es/analizar-vacante`, en: `${siteUrl}/en/job-match` };
  const jobMatchPages = [jobMatchLanguages.es, jobMatchLanguages.en].map((url) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
    alternates: { languages: jobMatchLanguages },
  }));
  const toolGroups = [
    { es: "es/herramientas", en: "en/tools", priority: 0.9 },
    { es: "es/revisar-cv", en: "en/resume-review", priority: 0.9 },
    { es: "es/carta-presentacion", en: "en/cover-letter", priority: 0.9 },
  ];
  const toolPages = toolGroups.flatMap((paths) => {
    const languages = { es: `${siteUrl}/${paths.es}`, en: `${siteUrl}/${paths.en}` };
    return (["es", "en"] as const).map((locale) => ({
      url: languages[locale], lastModified: new Date(), changeFrequency: "weekly" as const,
      priority: paths.priority, alternates: { languages },
    }));
  });
  const guideLanguages = { es: `${siteUrl}/es/guias`, en: `${siteUrl}/en/guides` };
  const guidePages = [guideLanguages.es, guideLanguages.en].map((url) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
    alternates: { languages: guideLanguages },
  }));
  const guideArticlePages = getGuideSitemapEntries().flatMap(({ slug, lastModified }) => {
    const languages = { es: `${siteUrl}/es/guias/${slug.es}`, en: `${siteUrl}/en/guides/${slug.en}` };
    return (["es", "en"] as const).map((locale) => ({
      url: languages[locale],
      lastModified: new Date(lastModified),
      changeFrequency: "monthly" as const,
      priority: 0.85,
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
  return [...homePages, ...catalogPages, ...professionalPages, ...guidePages, ...guideArticlePages, ...toolPages, ...jobMatchPages, ...institutionalPages];
}
