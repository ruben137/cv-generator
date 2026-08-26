import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteHeader } from "./site-header";
import { SiteContent } from "./site-content";
import { getSiteUrl } from "./site-url";

type GuideTopic = {
  title: string;
  description: string;
  category: string;
  slug?: string;
};

export type GuideSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GuideArticle = {
  title: string;
  description: string;
  eyebrow: string;
  slug: { es: string; en: string };
  updatedAt: string;
  readTime: string;
  sections: GuideSection[];
};

function localeConfig(locale: string) {
  const normalizedLocale = locale === "en" ? "en" : "es";
  return {
    locale: normalizedLocale,
    homePath: `/${normalizedLocale}`,
    catalogPath: normalizedLocale === "en" ? "/en/guides" : "/es/guias",
    templatesPath: normalizedLocale === "en" ? "/en/templates" : "/es/plantillas",
  } as const;
}

function guidePath(locale: "es" | "en", guide: GuideArticle) {
  return locale === "en" ? `/en/guides/${guide.slug.en}` : `/es/guias/${guide.slug.es}`;
}

function serializeStructuredData(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateGuideCatalogMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Guides");
  const { catalogPath } = localeConfig(locale);
  const siteUrl = getSiteUrl();
  const languages = { es: `${siteUrl}/es/guias`, en: `${siteUrl}/en/guides`, "x-default": `${siteUrl}/es/guias` };

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `${siteUrl}${catalogPath}`, languages },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${siteUrl}${catalogPath}`,
      type: "website",
    },
  };
}

export async function GuidesCatalogPage() {
  const locale = await getLocale();
  const t = await getTranslations("Guides");
  const { catalogPath, homePath, templatesPath } = localeConfig(locale);
  const siteUrl = getSiteUrl();
  const topics = t.raw("topics") as GuideTopic[];
  const principles = t.raw("principles") as GuideTopic[];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: t("metaTitle"),
        description: t("metaDescription"),
        url: `${siteUrl}${catalogPath}`,
        inLanguage: locale,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${siteUrl}${homePath}` },
          { "@type": "ListItem", position: 2, name: t("breadcrumbGuides"), item: `${siteUrl}${catalogPath}` },
        ],
      },
    ],
  };

  return (
    <>
    <SiteHeader locale={locale} />
    <SiteContent className="guide-site-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }} />

      <div className="guide-breadcrumb">
        <Link href={homePath}>{t("breadcrumbHome")}</Link><span>/</span><span>{t("breadcrumbGuides")}</span>
      </div>

      <section className="guide-catalog-hero">
        <div>
          <span className="preset-page-eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <aside aria-label={t("heroAsideLabel")}>
          <strong>{t("heroAsideTitle")}</strong>
          <p>{t("heroAsideDescription")}</p>
        </aside>
      </section>

      <section className="guide-catalog-section" aria-labelledby="guide-topics-title">
        <div className="guide-section-heading">
          <span className="preset-page-eyebrow">{t("topicsEyebrow")}</span>
          <h2 id="guide-topics-title">{t("topicsTitle")}</h2>
          <p>{t("topicsDescription")}</p>
        </div>
        <div className="guide-topic-grid">
          {topics.map((topic, index) => (
            <article key={topic.title} className="guide-topic-card">
              <div><span>0{index + 1}</span><small>{topic.category}</small></div>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              {topic.slug ? (
                <Link className="guide-topic-link" href={`${catalogPath}/${topic.slug}`}>{t("readGuide")}</Link>
              ) : (
                <span className="guide-coming-soon">{t("comingSoon")}</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="guide-principles" aria-labelledby="guide-principles-title">
        <div className="guide-section-heading">
          <span className="preset-page-eyebrow">{t("principlesEyebrow")}</span>
          <h2 id="guide-principles-title">{t("principlesTitle")}</h2>
        </div>
        <div>
          {principles.map((principle) => (
            <article key={principle.title}>
              <span>{principle.category}</span>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-catalog-cta">
        <div><h2>{t("ctaTitle")}</h2><p>{t("ctaDescription")}</p></div>
        <div><Link className="guide-secondary-cta" href={templatesPath}>{t("ctaTemplates")}</Link><Link className="preset-primary-cta" href={`${homePath}#generator`}>{t("ctaGenerator")}</Link></div>
      </section>
    </SiteContent>
    </>
  );
}

export async function generateGuideArticleMetadata(guide: GuideArticle): Promise<Metadata> {
  const locale = await getLocale();
  const normalizedLocale = locale === "en" ? "en" : "es";
  const siteUrl = getSiteUrl();
  const canonicalPath = guidePath(normalizedLocale, guide);
  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
      languages: {
        es: `${siteUrl}${guidePath("es", guide)}`,
        en: `${siteUrl}${guidePath("en", guide)}`,
        "x-default": `${siteUrl}${guidePath("es", guide)}`,
      },
    },
    openGraph: { title: guide.title, description: guide.description, url: `${siteUrl}${canonicalPath}`, type: "article" },
  };
}

export async function GuideArticlePage({ guide }: { guide: GuideArticle }) {
  const locale = await getLocale();
  const t = await getTranslations("Guides");
  const normalizedLocale = locale === "en" ? "en" : "es";
  const { catalogPath, homePath, templatesPath } = localeConfig(locale);
  const siteUrl = getSiteUrl();
  const canonicalPath = guidePath(normalizedLocale, guide);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: guide.title, description: guide.description, dateModified: guide.updatedAt, inLanguage: locale, mainEntityOfPage: `${siteUrl}${canonicalPath}`, author: { "@type": "Organization", name: "CV Simple" } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${siteUrl}${homePath}` },
        { "@type": "ListItem", position: 2, name: t("breadcrumbGuides"), item: `${siteUrl}${catalogPath}` },
        { "@type": "ListItem", position: 3, name: guide.title, item: `${siteUrl}${canonicalPath}` },
      ] },
    ],
  };

  return (
    <>
    <SiteHeader locale={locale} />
    <SiteContent className="guide-site-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }} />
      <article className="guide-article">
        <div className="guide-breadcrumb"><Link href={catalogPath}>{t("breadcrumbGuides")}</Link><span>/</span><span>{guide.title}</span></div>
        <header className="guide-article-hero"><span className="preset-page-eyebrow">{guide.eyebrow}</span><h1>{guide.title}</h1><p>{guide.description}</p><div><span>{t("updatedLabel", { date: guide.updatedAt })}</span><span>{guide.readTime}</span></div></header>
        <nav className="guide-table-of-contents" aria-label={t("contentsLabel")}><strong>{t("contentsTitle")}</strong><ol>{guide.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
        <div className="guide-article-content">{guide.sections.map((section) => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets?.length ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}</div>
        <aside className="guide-article-cta"><div><h2>{t("articleCtaTitle")}</h2><p>{t("articleCtaDescription")}</p></div><Link className="preset-primary-cta" href={templatesPath}>{t("ctaTemplates")}</Link></aside>
      </article>
    </SiteContent>
    </>
  );
}
