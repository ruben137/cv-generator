import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { getSiteUrl } from "./site-url";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#173b63",
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Metadata");
  const siteUrl = getSiteUrl();
  const publicPath = (await headers()).get("x-cv-public-path");
  const homePath = publicPath === "/es" || publicPath === "/en" ? publicPath : "";
  const canonicalUrl = `${siteUrl}${homePath}`;
  const title = t("title");
  const description = t("description");

  const verification: Metadata["verification"] = {};
  if (process.env.GOOGLE_SITE_VERIFICATION) verification.google = process.env.GOOGLE_SITE_VERIFICATION;
  if (process.env.BING_SITE_VERIFICATION) {
    verification.other = { "msvalidate.01": process.env.BING_SITE_VERIFICATION };
  }

  return {
    metadataBase: new URL(siteUrl),
    applicationName: "CV Simple",
    title: { default: title, template: "%s | CV Simple" },
    description,
    category: "productivity",
    keywords: locale === "es"
      ? ["crear CV gratis", "currículum gratis", "CV en PDF", "CV en Word", "generador de CV"]
      : ["free resume builder", "one-page resume", "resume PDF", "resume DOCX", "private resume builder"],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `${siteUrl}/es`,
        en: `${siteUrl}/en`,
        "x-default": siteUrl,
      },
    },
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
    formatDetection: { telephone: false, email: false, address: false },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "CV Simple",
      url: canonicalUrl,
      locale: locale === "es" ? "es_ES" : "en_US",
      alternateLocale: locale === "es" ? ["en_US"] : ["es_ES"],
      images: [{ url: "/og.png", width: 1200, height: 630, alt: t("imageAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    verification,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("Metadata");
  const siteUrl = getSiteUrl();
  const publicPath = (await headers()).get("x-cv-public-path");
  const homePath = publicPath === "/es" || publicPath === "/en" ? publicPath : "";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CV Simple",
    url: `${siteUrl}${homePath}`,
    description: t("description"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser with JavaScript enabled",
    inLanguage: locale,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: t.raw("featureList") as string[],
  };

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
