import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "./brand-logo";
import {
  getProfessionalPreset,
  getProfessionalPresetIdBySlug,
  getProfessionalPresetPath,
  professionalPresetIds,
  type ProfessionalPresetId,
} from "./professional-presets";
import { getSiteUrl } from "./site-url";

const translationSuffix: Record<ProfessionalPresetId, string> = {
  software: "Software",
  industrial: "Industrial",
  administrative: "Administrative",
  marketing: "Marketing",
  customerService: "CustomerService",
  sales: "Sales",
  accounting: "Accounting",
  graphicDesign: "GraphicDesign",
};

function localeConfig(locale: string) {
  const normalizedLocale = locale === "en" ? "en" : "es";
  return {
    locale: normalizedLocale,
    catalogPath: normalizedLocale === "en" ? "/en/templates" : "/es/plantillas",
    homePath: `/${normalizedLocale}`,
  } as const;
}

function serializeStructuredData(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateCatalogMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Presets");
  const { catalogPath } = localeConfig(locale);
  const siteUrl = getSiteUrl();
  return {
    title: t("catalogMetaTitle"),
    description: t("catalogMetaDescription"),
    alternates: {
      canonical: `${siteUrl}${catalogPath}`,
      languages: { es: `${siteUrl}/es/plantillas`, en: `${siteUrl}/en/templates` },
    },
    openGraph: { title: t("catalogMetaTitle"), description: t("catalogMetaDescription"), url: `${siteUrl}${catalogPath}` },
  };
}

export async function ProfessionalCatalogPage() {
  const locale = await getLocale();
  const t = await getTranslations("Presets");
  const { catalogPath, homePath } = localeConfig(locale);
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("catalogMetaTitle"),
    description: t("catalogMetaDescription"),
    url: `${siteUrl}${catalogPath}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: professionalPresetIds.map((id, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}${getProfessionalPresetPath(locale, id)}`,
        name: t(`role${translationSuffix[id]}`),
      })),
    },
  };

  return (
    <main className="preset-site-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }} />
      <header className="preset-page-header">
        <BrandLogo />
        <nav aria-label={t("navigationLabel")}>
          <a href={homePath}>{t("generatorLink")}</a>
          <a href={`${homePath}/mis-cvs`}>{t("savedCvsLink")}</a>
        </nav>
      </header>
      <section className="preset-catalog-hero">
        <span className="preset-page-eyebrow">{t("catalogEyebrow")}</span>
        <h1>{t("catalogTitle")}</h1>
        <p>{t("catalogDescription")}</p>
      </section>
      <section className="preset-catalog-grid" aria-label={t("catalogGridLabel")}>
        {professionalPresetIds.map((id, index) => {
          const suffix = translationSuffix[id];
          const preset = getProfessionalPreset(locale, id);
          return (
            <article className="preset-catalog-card" key={id}>
              <div className="preset-card-number">0{index + 1}</div>
              <div className="preset-card-preview" style={{ "--preset-primary": preset.primaryColor, "--preset-accent": preset.accentColor } as React.CSSProperties} aria-hidden="true">
                <span /><span /><span /><span />
              </div>
              <div className="preset-card-copy">
                <h2>{t(`role${suffix}`)}</h2>
                <p>{t(`role${suffix}Description`)}</p>
                <ul>{preset.skills.slice(0, 3).map((skill) => <li key={skill.name}>{skill.name}</li>)}</ul>
                <a href={getProfessionalPresetPath(locale, id)}>{t("viewExample")}</a>
              </div>
            </article>
          );
        })}
      </section>
      <section className="preset-catalog-note">
        <h2>{t("catalogNoteTitle")}</h2>
        <p>{t("catalogNoteDescription")}</p>
      </section>
    </main>
  );
}

export async function generateProfessionalMetadata(slug: string): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Presets");
  const id = getProfessionalPresetIdBySlug(locale, slug);
  if (!id) return {};
  const suffix = translationSuffix[id];
  const canonicalPath = getProfessionalPresetPath(locale, id);
  const siteUrl = getSiteUrl();
  return {
    title: t(`role${suffix}MetaTitle`),
    description: t(`role${suffix}MetaDescription`),
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
      languages: {
        es: `${siteUrl}${getProfessionalPresetPath("es", id)}`,
        en: `${siteUrl}${getProfessionalPresetPath("en", id)}`,
        "x-default": `${siteUrl}${getProfessionalPresetPath("es", id)}`,
      },
    },
    openGraph: { title: t(`role${suffix}MetaTitle`), description: t(`role${suffix}MetaDescription`), url: `${siteUrl}${canonicalPath}` },
  };
}

export async function ProfessionalPresetDetailPage({ slug }: { slug: string }) {
  const locale = await getLocale();
  const t = await getTranslations("Presets");
  const id = getProfessionalPresetIdBySlug(locale, slug);
  if (!id) return null;
  const suffix = translationSuffix[id];
  const preset = getProfessionalPreset(locale, id);
  const { catalogPath, homePath } = localeConfig(locale);
  const experience = preset.experiences[0];
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: t(`role${suffix}MetaTitle`),
        description: t(`role${suffix}MetaDescription`),
        url: `${siteUrl}${getProfessionalPresetPath(locale, id)}`,
        inLanguage: locale,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("breadcrumbCatalog"), item: `${siteUrl}${catalogPath}` },
          { "@type": "ListItem", position: 2, name: t(`role${suffix}`), item: `${siteUrl}${getProfessionalPresetPath(locale, id)}` },
        ],
      },
    ],
  };

  return (
    <main className="preset-site-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }} />
      <header className="preset-page-header">
        <BrandLogo />
        <nav aria-label={t("navigationLabel")}>
          <a href={catalogPath}>{t("allExamplesLink")}</a>
          <a href={homePath}>{t("generatorLink")}</a>
        </nav>
      </header>
      <div className="preset-breadcrumb"><a href={catalogPath}>{t("breadcrumbCatalog")}</a><span>/</span>{t(`role${suffix}`)}</div>
      <section className="preset-detail-hero">
        <div className="preset-detail-copy">
          <span className="preset-page-eyebrow">{t("detailEyebrow")}</span>
          <h1>{t(`role${suffix}Title`)}</h1>
          <p>{t(`role${suffix}Intro`)}</p>
          <a className="preset-primary-cta" href={`${homePath}?preset=${id}#generator`}>{t("useThisExample")}</a>
          <small>{t("ctaPrivacyNote")}</small>
        </div>
        <div className="preset-resume-preview" style={{ "--preset-primary": preset.primaryColor, "--preset-accent": preset.accentColor } as React.CSSProperties}>
          <aside>
            <div className="preset-avatar-placeholder" />
            <strong>{preset.headline}</strong>
            <h3>{t("skillsHeading")}</h3>
            <ul>{preset.skills.map((skill) => <li key={skill.name}>{skill.name}</li>)}</ul>
          </aside>
          <article>
            <h2>{t("summaryHeading")}</h2>
            <p>{preset.summary}</p>
            <h2>{t("experienceHeading")}</h2>
            <strong>{experience.role}</strong>
            <em>{experience.company} · {experience.start}–{experience.end}</em>
            <ul>{experience.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
          </article>
        </div>
      </section>
      <section className="preset-guide-grid">
        <article><span>01</span><h2>{t("guideSkillsTitle")}</h2><p>{t(`role${suffix}SkillsGuide`)}</p></article>
        <article><span>02</span><h2>{t("guideExperienceTitle")}</h2><p>{t(`role${suffix}ExperienceGuide`)}</p></article>
        <article><span>03</span><h2>{t("guideCustomizeTitle")}</h2><p>{t("guideCustomizeDescription")}</p></article>
      </section>
      <section className="preset-detail-cta">
        <h2>{t("detailCtaTitle")}</h2>
        <p>{t("detailCtaDescription")}</p>
        <a className="preset-primary-cta" href={`${homePath}?preset=${id}#generator`}>{t("useThisExample")}</a>
      </section>
    </main>
  );
}
