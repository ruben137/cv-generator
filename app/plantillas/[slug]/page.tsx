import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ProfessionalPresetDetailPage, generateProfessionalMetadata } from "../../professional-pages";
import { getProfessionalPresetIdBySlug } from "../../professional-presets";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return generateProfessionalMetadata(slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  if (!getProfessionalPresetIdBySlug(locale, slug)) notFound();
  return <ProfessionalPresetDetailPage slug={slug} />;
}
