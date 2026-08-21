import {
  type CvData,
  type CvLabelId,
  getInitialCv,
  normalizeContentOrder,
  normalizeSectionOrder,
} from "./types";

const templates: CvData["template"][] = ["classic", "modern", "minimal", "right", "compact", "contrast", "editorial"];
const fonts: CvData["fontFamily"][] = ["sans", "serif", "humanist"];

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
const id = (value: unknown, prefix: string) => text(value, 100) || `${prefix}-${crypto.randomUUID()}`;
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const list = (value: unknown, max: number) => Array.isArray(value) ? value.slice(0, max) : [];

export function normalizeCvData(value: unknown, fallbackLocale: "es" | "en" = "es"): CvData {
  const raw = object(value);
  const documentLocale = raw.documentLocale === "en" || raw.documentLocale === "es" ? raw.documentLocale : fallbackLocale;
  const initial = getInitialCv(documentLocale);
  const customSections = list(raw.customSections, 3).map((entry) => {
    const section = object(entry);
    return {
      id: id(section.id, "custom"),
      title: text(section.title, 50),
      type: section.type === "list" ? "list" as const : "text" as const,
      text: text(section.text, 500),
      items: list(section.items, 8).map((item) => {
        const normalized = object(item);
        return { id: id(normalized.id, "item"), text: text(normalized.text, 120) };
      }),
    };
  });
  const legacyOrder = normalizeSectionOrder(Array.isArray(raw.sectionOrder) ? raw.sectionOrder as CvData["sectionOrder"] : undefined);
  const rawTitles = object(raw.sectionTitles);
  const sectionTitles = Object.fromEntries(
    Object.entries(rawTitles).map(([key, value]) => [key, text(value, 50)]),
  ) as Partial<Record<CvLabelId, string>>;

  return {
    documentLocale,
    template: templates.includes(raw.template as CvData["template"]) ? raw.template as CvData["template"] : initial.template,
    fontFamily: fonts.includes(raw.fontFamily as CvData["fontFamily"]) ? raw.fontFamily as CvData["fontFamily"] : initial.fontFamily,
    photoShape: raw.photoShape === "round" ? "round" : "square",
    primaryColor: /^#[0-9a-f]{6}$/i.test(text(raw.primaryColor, 7)) ? String(raw.primaryColor) : initial.primaryColor,
    accentColor: /^#[0-9a-f]{6}$/i.test(text(raw.accentColor, 7)) ? String(raw.accentColor) : initial.accentColor,
    name: text(raw.name, 50),
    headline: text(raw.headline, 60),
    phone: text(raw.phone, 30),
    email: text(raw.email, 80),
    portfolio: text(raw.portfolio, 120),
    location: text(raw.location, 80),
    summary: text(raw.summary, 500),
    photo: typeof raw.photo === "string" && raw.photo.startsWith("data:image/") ? raw.photo : undefined,
    skills: (typeof raw.skills === "string" ? raw.skills.split(",") : list(raw.skills, 12))
      .slice(0, 12)
      .map((entry) => ({ name: text(typeof entry === "string" ? entry.trim() : object(entry).name, 80) })),
    languages: list(raw.languages, 5).map((entry) => {
      const item = object(entry);
      return { name: text(item.name, 40), level: text(item.level, 40) };
    }),
    experiences: list(raw.experiences, 4).map((entry) => {
      const item = object(entry);
      return {
        company: text(item.company, 70), role: text(item.role, 70), location: text(item.location, 70),
        start: text(item.start, 20), end: text(item.end, 20), bullets: list(item.bullets, 4).map((bullet) => text(bullet, 180)),
      };
    }),
    education: list(raw.education, 3).map((entry) => {
      const item = object(entry);
      return { institution: text(item.institution, 80), degree: text(item.degree, 80), location: text(item.location, 70), start: text(item.start, 20), end: text(item.end, 20) };
    }),
    certifications: list(raw.certifications, 4).map((entry) => {
      const item = object(entry);
      return { name: text(item.name, 80), issuer: text(item.issuer, 80), date: text(item.date, 30) };
    }),
    sectionOrder: legacyOrder,
    contentOrder: normalizeContentOrder(Array.isArray(raw.contentOrder) ? raw.contentOrder.map(String) : undefined, legacyOrder, customSections),
    sectionTitles,
    customSections,
  };
}

export const defaultDocumentLabels = {
  es: { summary: "Resumen", experience: "Experiencia", skills: "Habilidades", contact: "Contacto", languages: "Idiomas", education: "Formación académica", certifications: "Certificaciones", location: "Ubicación", phone: "Teléfono", email: "Correo", portfolio: "Portafolio" },
  en: { summary: "Summary", experience: "Experience", skills: "Skills", contact: "Contact", languages: "Languages", education: "Education", certifications: "Certifications", location: "Location", phone: "Phone", email: "Email", portfolio: "Portfolio" },
} satisfies Record<"es" | "en", Record<CvLabelId, string>>;
