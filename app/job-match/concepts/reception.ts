import { concept } from "./factory";

const family = ["reception"] as const;

export const receptionConcepts = [
  concept({ id: "reception-service", category: "skill", es: "Atención en recepción", en: "Reception service", families: [...family], esAliases: ["recepción", "atención en front desk", "atención al público"], enAliases: ["reception", "front desk", "front desk service"] }),
  concept({ id: "visitor-management", category: "responsibility", es: "Atención de visitantes", en: "Visitor management", families: [...family], esAliases: ["recepción de visitantes", "registro de visitantes", "control de visitas"], enAliases: ["greet visitors", "visitor registration", "visitor check-in"] }),
  concept({ id: "appointment-scheduling", category: "responsibility", es: "Gestión de citas", en: "Appointment scheduling", families: [...family], esAliases: ["agenda de citas", "programación de citas", "coordinación de citas"], enAliases: ["schedule appointments", "appointment booking", "calendar scheduling"] }),
  concept({ id: "telephone-service", category: "responsibility", es: "Atención telefónica", en: "Telephone service", families: [...family], esAliases: ["manejo de llamadas", "central telefónica", "gestión de llamadas"], enAliases: ["answer phone calls", "call handling", "telephone switchboard"] }),
  concept({ id: "correspondence-management", category: "responsibility", es: "Gestión de correspondencia", en: "Correspondence management", families: [...family], esAliases: ["recepción de correspondencia", "mensajería y paquetería"], enAliases: ["mail handling", "incoming mail", "courier management"] }),
  concept({ id: "reservation-management", category: "responsibility", es: "Gestión de reservas", en: "Reservation management", families: [...family], esAliases: ["manejo de reservaciones", "control de reservas"], enAliases: ["booking management", "manage reservations"] }),
  concept({ id: "reception-office-support", category: "skill", es: "Administración de oficina", en: "Office administration", families: [...family], esAliases: ["apoyo de oficina", "soporte administrativo", "tareas administrativas"], enAliases: ["office support", "administrative support", "clerical duties"] }),
  concept({ id: "reception-data-entry", category: "responsibility", es: "Ingreso de datos", en: "Data entry", families: [...family], esAliases: ["carga de datos", "registro de información"], enAliases: ["enter data", "information entry"] }),
  concept({ id: "customer-facing-service", category: "skill", es: "Atención presencial al cliente", en: "Customer-facing service", families: [...family], esAliases: ["trato con clientes", "servicio presencial"], enAliases: ["face-to-face customer service", "client-facing service"] }),
  concept({ id: "confidential-information", category: "responsibility", es: "Manejo de información confidencial", en: "Confidential information handling", families: [...family], esAliases: ["confidencialidad de datos", "protección de información"], enAliases: ["data confidentiality", "handle confidential information"] }),
] as const;
