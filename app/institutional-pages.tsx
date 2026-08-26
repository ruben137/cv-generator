import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteHeader } from "./site-header";
import { SiteContent } from "./site-content";
import { getSiteUrl } from "./site-url";

export type InstitutionalPageKind = "about" | "privacy" | "terms";

type ContentSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const paths = {
  about: { es: "/es/acerca-de", en: "/en/about" },
  privacy: { es: "/es/privacidad", en: "/en/privacy" },
  terms: { es: "/es/terminos", en: "/en/terms" },
} as const;

function normalizedLocale(locale: string): "es" | "en" {
  return locale === "en" ? "en" : "es";
}

export async function generateInstitutionalMetadata(kind: InstitutionalPageKind): Promise<Metadata> {
  const locale = normalizedLocale(await getLocale());
  const t = await getTranslations(`Institutional.${kind}`);
  const siteUrl = getSiteUrl();
  const canonicalPath = paths[kind][locale];

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
      languages: {
        es: `${siteUrl}${paths[kind].es}`,
        en: `${siteUrl}${paths[kind].en}`,
        "x-default": `${siteUrl}${paths[kind].es}`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${siteUrl}${canonicalPath}`,
    },
  };
}

export async function InstitutionalPage({ kind }: { kind: InstitutionalPageKind }) {
  const locale = normalizedLocale(await getLocale());
  const t = await getTranslations("Institutional");
  const page = t.raw(`${kind}.sections`) as ContentSection[];
  const siteUrl = getSiteUrl();
  const canonicalPath = paths[kind][locale];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": kind === "about" ? "AboutPage" : "WebPage",
    name: t(`${kind}.title`),
    description: t(`${kind}.metaDescription`),
    url: `${siteUrl}${canonicalPath}`,
    inLanguage: locale,
  };

  return (
    <>
    <SiteHeader locale={locale} />
    <SiteContent className="institutional-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <article className="institutional-article">
        <header className="institutional-hero">
          <span className="preset-page-eyebrow">{t(`${kind}.eyebrow`)}</span>
          <h1>{t(`${kind}.title`)}</h1>
          <p>{t(`${kind}.intro`)}</p>
          <small>{t(`${kind}.updated`)}</small>
        </header>

        <div className="institutional-content">
          {page.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
        </div>
      </article>

      <footer className="institutional-footer">
        <span>{t("footerText")}</span>
        <nav aria-label={t("legalNavigationLabel")}>
          <a href={paths.about[locale]}>{t("aboutLink")}</a>
          <a href={paths.privacy[locale]}>{t("privacyLink")}</a>
          <a href={paths.terms[locale]}>{t("termsLink")}</a>
        </nav>
      </footer>
    </SiteContent>
    </>
  );
}
