import type { Metadata } from "next";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import WorkHistoryOutlinedIcon from "@mui/icons-material/WorkHistoryOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteHeader } from "./site-header";
import { SiteContent } from "./site-content";
import { getSiteUrl } from "./site-url";

export async function generateToolsMetadata(): Promise<Metadata> {
  const locale = await getLocale(); const t = await getTranslations("Tools"); const siteUrl = getSiteUrl();
  const path = locale === "en" ? "/en/tools" : "/es/herramientas";
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: `${siteUrl}${path}`, languages: { es: `${siteUrl}/es/herramientas`, en: `${siteUrl}/en/tools` } } };
}

export async function ToolsPage() {
  const locale = await getLocale(); const t = await getTranslations("Tools");
  const tools = [
    { id: "quality", href: locale === "en" ? "/en/resume-review" : "/es/revisar-cv", icon: <FactCheckOutlinedIcon /> },
    { id: "match", href: locale === "en" ? "/en/job-match" : "/es/analizar-vacante", icon: <ManageSearchRoundedIcon /> },
    { id: "applications", href: locale === "en" ? "/en/applications" : "/es/mis-postulaciones", icon: <WorkHistoryOutlinedIcon /> },
    { id: "coverLetter", href: locale === "en" ? "/en/cover-letter" : "/es/carta-presentacion", icon: <ArticleOutlinedIcon /> },
  ];
  return <><SiteHeader locale={locale} active="tools" /><SiteContent className="tools-page"><section className="tools-hero"><span>{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("description")}</p></section><section className="tools-grid">{tools.map((tool) => <a key={tool.id} href={tool.href} className={`tool-card tool-card-${tool.id}`}><div className="tool-card-icon">{tool.icon}</div><span>{t(`${tool.id}.eyebrow`)}</span><h2>{t(`${tool.id}.title`)}</h2><p>{t(`${tool.id}.description`)}</p><strong>{t(`${tool.id}.cta`)}<ArrowForwardRoundedIcon /></strong></a>)}</section><aside className="tools-privacy">{t("privacy")}</aside></SiteContent></>;
}
