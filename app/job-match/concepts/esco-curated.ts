import type { ConceptSource, JobFamily } from "../model";
import { concept } from "./factory";

const esco = (id: string): ConceptSource => ({
  dataset: "esco",
  version: "v1.2.0",
  uri: `http://data.europa.eu/esco/skill/${id}`,
});

export const escoCuratedConcepts: Partial<Record<Exclude<JobFamily, "general">, ReturnType<typeof concept>[]>> = {
  "software-development": [
    concept({ id: "java", category: "language", es: "Java", en: "Java", families: ["software-development"], esAliases: ["Java (programación informática)"], enAliases: ["Java programming", "Java (computer programming)"], sources: [esco("19a8293b-8e95-4de3-983f-77484079c389")] }),
    concept({ id: "css", category: "language", es: "CSS", en: "CSS", families: ["software-development"], esAliases: [["hojas de estilo en cascada", "name"]], enAliases: [["Cascading Style Sheets", "name"]], sources: [esco("e5d1f825-60ed-4bdd-872a-e748c387f777")] }),
  ],
  "industrial-engineering": [
    concept({ id: "supply-chain-management", category: "skill", es: "Gestión de la cadena de suministro", en: "Supply chain management", families: ["industrial-engineering"], esAliases: ["gestión de cadena de suministro"], enAliases: ["supply chain"], sources: [esco("f929c89e-c363-4132-a918-e021d57b307c")] }),
    concept({ id: "production-scheduling", category: "responsibility", es: "Programación de la producción", en: "Production scheduling", families: ["industrial-engineering"], esAliases: ["programar la producción", "planificación de producción"], enAliases: ["schedule production", "production planning"], sources: [esco("2a778aeb-f246-4f03-9a96-c60183001037")] }),
    concept({ id: "ohsas-18001", category: "methodology", es: "OHSAS 18001", en: "OHSAS 18001", families: ["industrial-engineering"], esAliases: ["normas OHSAS 18001"], enAliases: ["adhere to OHSAS 18001"], sources: [esco("2d9aaad3-a3c8-4c5b-bf67-46984d860873")] }),
  ],
  administration: [
    concept({ id: "travel-arrangements", category: "responsibility", es: "Organización de viajes", en: "Travel arrangements", families: ["administration"], esAliases: ["preparativos de viajes", "gestión de viajes"], enAliases: ["make travel arrangements", "oversee all travel arrangements", "travel coordination"], sources: [esco("15b7d066-35aa-418a-b115-3460f908f997")] }),
    concept({ id: "office-administration", category: "skill", es: "Administración de oficina", en: "Office administration", families: ["administration"], esAliases: ["gestión de oficina"], enAliases: ["office management"], sources: [esco("6a609f8f-1451-4102-ad2d-62c5270e1237")] }),
  ],
  marketing: [
    concept({ id: "market-research", category: "skill", es: "Estudios de mercado", en: "Market research", families: ["marketing"], esAliases: ["investigación de mercado"], enAliases: ["market analysis"], sources: [esco("8770350e-746f-4adb-9556-18ca68104be6")] }),
    concept({ id: "brand-management", category: "skill", es: "Gestión de marca", en: "Brand management", families: ["marketing"], esAliases: ["supervisión de marca"], enAliases: ["supervise brand management"], relations: [["branding", "related", 0.75]], sources: [esco("ab5c3fac-238f-4006-a122-1114082a2f46")] }),
  ],
  sales: [
    concept({ id: "relationship-marketing", category: "methodology", es: "Marketing de relaciones", en: "Relationship marketing", families: ["sales"], esAliases: ["marketing relacional", "fidelización de clientes"], enAliases: ["relationship selling"], sources: [esco("0e54cc0e-6cef-41ec-bd8c-e8e8778969ec")] }),
    concept({ id: "contract-management", category: "responsibility", es: "Gestión de contratos", en: "Contract management", families: ["sales"], esAliases: ["gestionar contratos"], enAliases: ["manage contracts"], sources: [esco("92721092-fe7c-4689-96bd-4f02385bc0e7")] }),
    concept({ id: "telemarketing", category: "skill", es: "Telemarketing", en: "Telemarketing", families: ["sales"], esAliases: ["ventas telefónicas"], enAliases: ["telephone sales"], sources: [esco("16132f2b-cf61-4c53-ae8d-9023a8bab90b")] }),
  ],
  accounting: [
    concept({ id: "budgetary-principles", category: "skill", es: "Principios presupuestarios", en: "Budgetary principles", families: ["accounting"], esAliases: ["principios de presupuesto"], enAliases: ["budget principles"], sources: [esco("74688c5d-2af1-4f7a-9d1c-00e808eaa1e6")] }),
    concept({ id: "financial-analysis", category: "skill", es: "Análisis financiero", en: "Financial analysis", families: ["accounting"], esAliases: ["análisis de información financiera"], enAliases: ["financial data analysis"], sources: [esco("99571e68-801f-49af-a897-5f75996642e1")] }),
  ],
  "customer-service": [
    concept({ id: "customer-satisfaction", category: "responsibility", es: "Satisfacción del cliente", en: "Customer satisfaction", families: ["customer-service"], esAliases: ["garantizar la satisfacción del cliente"], enAliases: ["guarantee customer satisfaction", "client satisfaction"], sources: [esco("00e53a0a-c0ba-4c9f-a2ed-4706d5832a00")] }),
    concept({ id: "escalation-procedure", category: "responsibility", es: "Procedimiento de escalamiento", en: "Escalation procedure", families: ["customer-service"], esAliases: ["escalamiento de casos", "notificación escalonada"], enAliases: ["perform escalation procedure", "case escalation"], sources: [esco("946c1229-1171-40d4-82cc-fe3f483ca100")] }),
  ],
  "graphic-design": [
    concept({ id: "usability-engineering", category: "skill", es: "Ingeniería de usabilidad", en: "Usability engineering", families: ["graphic-design"], esAliases: ["diseño de usabilidad"], enAliases: ["usability design"], sources: [esco("95ee5e38-5c1e-4cd2-a21d-6921390025a9")] }),
    concept({ id: "ux-prototyping", category: "skill", es: "Prototipado de experiencia de usuario", en: "User experience prototyping", families: ["graphic-design"], esAliases: ["prototipos UX", "prototipado UX"], enAliases: ["UX prototyping", "create prototype of user experience solutions"], sources: [esco("07dd856d-6141-48a7-a228-918f88494812")] }),
    concept({ id: "motion-graphics", category: "skill", es: "Gráficos en movimiento", en: "Motion graphics", families: ["graphic-design"], esAliases: ["motion graphics", "diseño en movimiento"], enAliases: ["motion design"], sources: [esco("8afe68ff-b261-4fa8-ab25-bb30b0e5c292")] }),
  ],
};
