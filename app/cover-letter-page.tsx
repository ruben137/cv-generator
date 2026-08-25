import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CoverLetterClient } from "./cover-letter/cover-letter-client";
import { getSiteUrl } from "./site-url";

export async function generateCoverLetterMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("CoverLetter");
  const path = locale === "en" ? "/en/cover-letter" : "/es/carta-presentacion";
  const siteUrl = getSiteUrl();
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        es: `${siteUrl}/es/carta-presentacion`,
        en: `${siteUrl}/en/cover-letter`,
      },
    },
  };
}

export function CoverLetterPage() {
  return <CoverLetterClient />;
}
