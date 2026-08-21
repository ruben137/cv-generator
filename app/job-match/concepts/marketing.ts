import { concept } from "./factory";

const family = ["marketing"] as const;

export const marketingConcepts = [
  concept({ id: "digital-marketing", category: "skill", es: "Marketing digital", en: "Digital marketing", families: [...family], esAliases: ["mercadeo digital"], enAliases: ["online marketing"] }),
  concept({ id: "seo", category: "skill", es: "SEO", en: "SEO", families: [...family], esAliases: [["optimización para motores de búsqueda", "name"], ["posicionamiento orgánico", "name"]], enAliases: [["search engine optimization", "name"], ["organic search", "name"]] }),
  concept({ id: "paid-media", category: "skill", es: "Publicidad digital de pago", en: "Paid media", families: [...family], esAliases: ["publicidad de pago", "campañas PPC", ["PPC", "abbreviation"], "SEM"], enAliases: ["paid advertising", "paid search", "PPC campaigns", ["PPC", "abbreviation"], "SEM"] }),
  concept({ id: "keyword-research", category: "skill", es: "Investigación de palabras clave", en: "Keyword research", families: [...family], esAliases: ["análisis de palabras clave", "búsqueda de palabras clave"], enAliases: ["keyword analysis"], relations: [["seo", "uses-methodology", 0.8], ["paid-media", "related", 0.65]] }),
  concept({ id: "content-marketing", category: "skill", es: "Marketing de contenidos", en: "Content marketing", families: [...family], esAliases: ["estrategia de contenidos"], enAliases: ["content strategy"] }),
  concept({ id: "social-media-management", category: "skill", es: "Gestión de redes sociales", en: "Social media management", families: [...family], esAliases: ["manejo de redes sociales", "community management"], enAliases: ["community management", "social media"] }),
  concept({ id: "google-analytics", category: "tool", es: "Google Analytics", en: "Google Analytics", families: [...family], esAliases: [["GA4", "abbreviation"]], enAliases: [["GA4", "abbreviation"]] }),
  concept({ id: "campaign-management", category: "skill", es: "Gestión de campañas", en: "Campaign management", families: [...family], esAliases: ["planificación de campañas", "ejecución de campañas"], enAliases: ["campaign planning", "campaign execution"] }),
  concept({ id: "campaign-reporting", category: "responsibility", es: "Informes de campañas", en: "Campaign reporting", families: [...family], esAliases: ["reportes de campañas", "análisis de rendimiento de campañas"], enAliases: ["campaign reports", "campaign performance reporting"], relations: [["campaign-management", "related", 0.75], ["google-analytics", "uses-tool", 0.7]] }),
  concept({ id: "conversion-rate-optimization", category: "methodology", es: "Optimización de la tasa de conversión", en: "Conversion rate optimization", families: [...family], esAliases: [["CRO", "abbreviation"], "optimización de conversiones"], enAliases: [["CRO", "abbreviation"], "conversion optimization"] }),
  concept({ id: "email-marketing", category: "skill", es: "Email marketing", en: "Email marketing", families: [...family], esAliases: ["correo masivo", "campañas de correo"], enAliases: ["email campaigns"] }),
] as const;
