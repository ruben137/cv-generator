import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { JobMatchClient } from "./job-match/job-match-client";
import { getSiteUrl } from "./site-url";

export async function generateJobMatchMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("JobMatch");
  const path = locale === "en" ? "/en/job-match" : "/es/analizar-vacante";
  const siteUrl = getSiteUrl();
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: { es: `${siteUrl}/es/analizar-vacante`, en: `${siteUrl}/en/job-match`, "x-default": `${siteUrl}/es/analizar-vacante` },
    },
    openGraph: { title: t("metaTitle"), description: t("metaDescription"), url: `${siteUrl}${path}` },
  };
}

function serializeStructuredData(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function JobMatchPage() {
  const locale = await getLocale();
  const t = await getTranslations("JobMatch");
  const siteUrl = getSiteUrl();
  const path = locale === "en" ? "/en/job-match" : "/es/analizar-vacante";
  const faqItems = t.raw("faqItems") as Array<{ question: string; answer: string }>;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: t("title"),
        description: t("metaDescription"),
        url: `${siteUrl}${path}`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser with JavaScript enabled",
        inLanguage: locale,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: t.raw("structuredFeatures") as string[],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }} />
    <JobMatchClient />
  </>;
}
