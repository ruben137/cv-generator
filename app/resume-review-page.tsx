import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ResumeReviewClient } from "./resume-review/resume-review-client";
import { getSiteUrl } from "./site-url";

export async function generateResumeReviewMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("ResumeReview");
  const siteUrl = getSiteUrl();
  const path = locale === "en" ? "/en/resume-review" : "/es/revisar-cv";
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: `${siteUrl}${path}`, languages: { es: `${siteUrl}/es/revisar-cv`, en: `${siteUrl}/en/resume-review` } } };
}

export async function ResumeReviewPage() { return <ResumeReviewClient />; }
