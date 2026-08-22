import { concept } from "./factory";

export const sharedConcepts = [
  concept({ id: "english-language", category: "language", es: "Inglés", en: "English", families: ["general"], esAliases: ["inglés profesional", "idioma inglés"], enAliases: ["professional English", "English language"] }),
  concept({ id: "communication", category: "skill", es: "Comunicación", en: "Communication", families: ["general"], esAliases: ["comunicación efectiva", "habilidades comunicativas"], enAliases: ["effective communication", "communication skills"] }),
  concept({ id: "teamwork", category: "skill", es: "Trabajo en equipo", en: "Teamwork", families: ["general"], esAliases: ["colaboración", "trabajo colaborativo"], enAliases: ["collaboration", "collaborative work"] }),
  concept({ id: "problem-solving", category: "skill", es: "Resolución de problemas", en: "Problem solving", families: ["general"], esAliases: ["solución de problemas"], enAliases: ["problem resolution"] }),
  concept({ id: "organization", category: "skill", es: "Organización", en: "Organization", families: ["general"], esAliases: ["capacidad organizativa"], enAliases: ["organizational skills"] }),
  concept({ id: "time-management", category: "skill", es: "Gestión del tiempo", en: "Time management", families: ["general"], esAliases: ["manejo del tiempo"], enAliases: ["time planning"] }),
  concept({ id: "leadership", category: "skill", es: "Liderazgo", en: "Leadership", families: ["general"], esAliases: ["liderazgo de equipos"], enAliases: ["team leadership"] }),
  concept({ id: "attention-to-detail", category: "skill", es: "Atención al detalle", en: "Attention to detail", families: ["general"], esAliases: ["orientación al detalle"], enAliases: ["detail oriented", "detail-oriented"] }),
  concept({ id: "adaptability", category: "skill", es: "Adaptabilidad", en: "Adaptability", families: ["general"], esAliases: ["flexibilidad"], enAliases: ["flexibility"] }),
  concept({ id: "microsoft-excel", category: "tool", es: "Microsoft Excel", en: "Microsoft Excel", families: ["general"], esAliases: ["Excel", "hojas de cálculo"], enAliases: ["Excel", "spreadsheets"] }),
  concept({ id: "data-analysis", category: "skill", es: "Análisis de datos", en: "Data analysis", families: ["general"], esAliases: ["analítica de datos", "interpretación de datos"], enAliases: ["data analytics", "data interpretation"] }),
  concept({ id: "crm", category: "tool", es: "CRM", en: "CRM", families: ["sales", "customer-service", "marketing"], esAliases: [["gestión de relaciones con clientes", "name"]], enAliases: [["customer relationship management", "name"]] }),
] as const;
