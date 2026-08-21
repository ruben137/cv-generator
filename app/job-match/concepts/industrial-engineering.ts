import { concept } from "./factory";

const family = ["industrial-engineering"] as const;

export const industrialEngineeringConcepts = [
  concept({ id: "continuous-improvement", category: "methodology", es: "Mejora continua", en: "Continuous improvement", families: [...family], esAliases: ["optimización continua"], enAliases: ["continual improvement", "process improvement"], relations: [["lean", "uses-methodology", 0.75], ["kaizen", "uses-methodology", 0.8]] }),
  concept({ id: "lean", category: "methodology", es: "Lean", en: "Lean", families: [...family], esAliases: ["manufactura esbelta", "Lean Manufacturing"], enAliases: ["Lean Manufacturing"] }),
  concept({ id: "kaizen", category: "methodology", es: "Kaizen", en: "Kaizen", families: [...family], relations: [["continuous-improvement", "related", 0.8]] }),
  concept({ id: "process-analysis", category: "skill", es: "Análisis de procesos", en: "Process analysis", families: [...family], esAliases: ["optimización de procesos", "mapeo de procesos"], enAliases: ["process optimization", "process mapping"] }),
  concept({ id: "value-stream-mapping", category: "methodology", es: "Mapeo de flujo de valor", en: "Value stream mapping", families: [...family], esAliases: ["mapa de flujo de valor", ["VSM", "abbreviation"]], enAliases: [["VSM", "abbreviation"], "value-stream mapping"], relations: [["lean", "uses-methodology", 0.8], ["process-analysis", "related", 0.75]] }),
  concept({ id: "root-cause-analysis", category: "methodology", es: "Análisis de causa raíz", en: "Root cause analysis", families: [...family], esAliases: ["análisis de causas", ["ACR", "abbreviation"], "5 porqués", "diagrama de Ishikawa"], enAliases: [["RCA", "abbreviation"], "5 Whys", "fishbone analysis", "Ishikawa diagram"] }),
  concept({ id: "six-sigma", category: "methodology", es: "Six Sigma", en: "Six Sigma", families: [...family], esAliases: ["Seis Sigma", "Lean Six Sigma"], enAliases: ["Lean Six Sigma"] }),
  concept({ id: "five-s", category: "methodology", es: "5S", en: "5S", families: [...family], esAliases: ["metodología 5S"], enAliases: ["5S methodology"], relations: [["lean", "uses-methodology", 0.8]] }),
  concept({ id: "kpi-management", category: "skill", es: "Gestión de indicadores", en: "KPI management", families: [...family], esAliases: ["indicadores de gestión", "indicadores de producción", "KPI de manufactura", ["KPI", "abbreviation"]], enAliases: ["performance indicators", "production KPIs", "manufacturing KPIs", ["KPI", "abbreviation"]] }),
  concept({ id: "quality-management", category: "skill", es: "Gestión de calidad", en: "Quality management", families: [...family], esAliases: ["control de calidad", "aseguramiento de calidad"], enAliases: ["quality control", "quality assurance"] }),
  concept({ id: "inventory-management", category: "skill", es: "Gestión de inventarios", en: "Inventory management", families: [...family], esAliases: ["control de inventario", "manejo de inventarios"], enAliases: ["inventory control"] }),
] as const;
