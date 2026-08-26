import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getGuideBySlug, getGuideSlugs } from "../../guide-content";
import { generateGuideArticleMetadata, GuideArticlePage } from "../../guide-pages";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getGuideSlugs("en").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const guide = getGuideBySlug(locale, slug);
  return guide ? generateGuideArticleMetadata(guide) : {};
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const guide = getGuideBySlug(locale, slug);
  if (!guide) notFound();
  return <GuideArticlePage guide={guide} />;
}
