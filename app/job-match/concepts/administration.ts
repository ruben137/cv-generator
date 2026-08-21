import { concept } from "./factory";

const family = ["administration"] as const;

export const administrationConcepts = [
  concept({ id: "administrative-support", category: "responsibility", es: "Soporte administrativo", en: "Administrative support", families: [...family], esAliases: ["asistencia administrativa", "apoyo administrativo"], enAliases: ["administrative assistance"] }),
  concept({ id: "document-management", category: "skill", es: "Gestión documental", en: "Document management", families: [...family], esAliases: ["archivo de documentos", "control documental"], enAliases: ["records management", "document control"] }),
  concept({ id: "calendar-management", category: "responsibility", es: "Gestión de agenda", en: "Calendar management", families: [...family], esAliases: ["manejo de agenda", "coordinación de reuniones"], enAliases: ["scheduling", "meeting coordination"] }),
  concept({ id: "microsoft-office", category: "tool", es: "Microsoft Office", en: "Microsoft Office", families: [...family], esAliases: [["MS Office", "abbreviation"], "paquete Office"], enAliases: [["MS Office", "abbreviation"], "Office suite"] }),
  concept({ id: "data-entry", category: "responsibility", es: "Ingreso de datos", en: "Data entry", families: [...family], esAliases: ["carga de datos", "digitación"], enAliases: ["data input"] }),
  concept({ id: "invoicing", category: "responsibility", es: "Facturación", en: "Invoicing", families: [...family], esAliases: ["emisión de facturas"], enAliases: ["billing"] }),
] as const;
