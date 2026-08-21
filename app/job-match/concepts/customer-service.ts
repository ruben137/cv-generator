import { concept } from "./factory";

const family = ["customer-service"] as const;

export const customerServiceConcepts = [
  concept({ id: "customer-service", category: "skill", es: "Atención al cliente", en: "Customer service", families: [...family], esAliases: ["servicio al cliente", "soporte al cliente"], enAliases: ["customer support", "client service"] }),
  concept({ id: "issue-resolution", category: "responsibility", es: "Resolución de incidencias", en: "Issue resolution", families: [...family], esAliases: ["gestión de incidencias", "resolución de casos"], enAliases: ["case resolution", "problem resolution"] }),
  concept({ id: "ticketing-systems", category: "tool", es: "Sistemas de tickets", en: "Ticketing systems", families: [...family], esAliases: ["gestión de tickets", "mesa de ayuda"], enAliases: ["ticket management", "help desk"] }),
  concept({ id: "call-center", category: "industry", es: "Centro de llamadas", en: "Call center", families: [...family], esAliases: ["call center", "contact center"], enAliases: ["contact center"] }),
  concept({ id: "complaint-management", category: "responsibility", es: "Gestión de reclamos", en: "Complaint management", families: [...family], esAliases: ["manejo de quejas", "atención de reclamos"], enAliases: ["complaint handling"] }),
  concept({ id: "active-listening", category: "skill", es: "Escucha activa", en: "Active listening", families: [...family], esAliases: ["capacidad de escucha"], enAliases: ["listening skills"] }),
] as const;
