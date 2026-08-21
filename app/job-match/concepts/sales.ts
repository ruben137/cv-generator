import { concept } from "./factory";

const family = ["sales"] as const;

export const salesConcepts = [
  concept({ id: "sales-management", category: "skill", es: "Gestión de ventas", en: "Sales management", families: [...family], esAliases: ["administración de ventas", "ventas B2B", "ventas empresariales"], enAliases: ["sales operations", "B2B sales", "enterprise sales"] }),
  concept({ id: "sales-cycle", category: "responsibility", es: "Ciclo completo de ventas", en: "Full sales cycle", families: [...family], esAliases: ["ciclo de ventas", "proceso completo de ventas", "venta de principio a fin"], enAliases: ["sales cycle", "end-to-end sales", "full-cycle sales"] }),
  concept({ id: "consultative-selling", category: "methodology", es: "Venta consultiva", en: "Consultative selling", families: [...family], esAliases: ["ventas consultivas"], enAliases: ["consultative sales", "solution selling"] }),
  concept({ id: "negotiation", category: "skill", es: "Negociación", en: "Negotiation", families: [...family], esAliases: ["negociación comercial", "cierre de acuerdos", "cierre de ventas"], enAliases: ["commercial negotiation", "deal closing", "sales closing", "closing"] }),
  concept({ id: "lead-generation", category: "responsibility", es: "Generación de prospectos", en: "Lead generation", families: [...family], esAliases: ["generación de leads"], enAliases: ["lead acquisition"] }),
  concept({ id: "customer-prospecting", category: "responsibility", es: "Prospección de clientes", en: "Customer prospecting", families: [...family], esAliases: ["prospección comercial", "captación de clientes"], enAliases: ["sales prospecting", "customer acquisition"] }),
  concept({ id: "sales-targets", category: "responsibility", es: "Cumplimiento de metas de ventas", en: "Sales target achievement", families: [...family], esAliases: ["cumplimiento de objetivos comerciales", "cuota de ventas", "metas de ventas"], enAliases: ["sales quota", "sales quotas", "sales goals", "quota attainment"] }),
  concept({ id: "account-management", category: "responsibility", es: "Gestión de cuentas", en: "Account management", families: [...family], esAliases: ["manejo de cartera de clientes"], enAliases: ["client portfolio management"] }),
  concept({ id: "pipeline-management", category: "responsibility", es: "Gestión del pipeline de ventas", en: "Sales pipeline management", families: [...family], esAliases: ["gestión del embudo de ventas", "manejo del pipeline", "pipeline comercial"], enAliases: ["pipeline management", "CRM pipeline", "pipeline hygiene"], relations: [["crm", "uses-tool", 0.8]] }),
  concept({ id: "sales-forecasting", category: "responsibility", es: "Pronóstico de ventas", en: "Sales forecasting", families: [...family], esAliases: ["previsión de ventas", "forecast comercial"], enAliases: ["forecasting", "sales forecast", "forecast accuracy"], relations: [["pipeline-management", "related", 0.75]] }),
  concept({ id: "presentation-skills", category: "skill", es: "Habilidades de presentación", en: "Presentation skills", families: [...family], esAliases: ["presentaciones comerciales", "presentación de propuestas"], enAliases: ["presentation", "sales presentations", "proposal presentation"], relations: [["communication", "related", 0.65]] }),
] as const;
