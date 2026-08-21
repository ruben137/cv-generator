import { type CvData, getInitialCv } from "./types";

export const professionalPresetIds = [
  "software",
  "industrial",
  "administrative",
  "marketing",
  "customerService",
  "sales",
  "accounting",
  "graphicDesign",
] as const;
export type ProfessionalPresetId = (typeof professionalPresetIds)[number];

export const professionalPresetSlugs: Record<"es" | "en", Record<ProfessionalPresetId, string>> = {
  es: {
    software: "cv-desarrollador-software",
    industrial: "cv-ingeniero-industrial",
    administrative: "cv-administrativo",
    marketing: "cv-marketing",
    customerService: "cv-atencion-cliente",
    sales: "cv-ventas",
    accounting: "cv-contador",
    graphicDesign: "cv-disenador-grafico",
  },
  en: {
    software: "software-developer-resume",
    industrial: "industrial-engineer-resume",
    administrative: "administrative-assistant-resume",
    marketing: "marketing-resume",
    customerService: "customer-service-resume",
    sales: "sales-resume",
    accounting: "accountant-resume",
    graphicDesign: "graphic-designer-resume",
  },
};

type PresetContent = Pick<CvData, "headline" | "summary" | "skills" | "experiences" | "education" | "certifications"> &
  Partial<Pick<CvData, "template" | "fontFamily" | "primaryColor" | "accentColor">>;

const presets: Record<"es" | "en", Record<ProfessionalPresetId, PresetContent>> = {
  es: {
    software: {
      headline: "Desarrollador/a de software",
      summary: "Profesional de desarrollo de software orientado a crear soluciones mantenibles, colaborar con equipos multidisciplinarios y transformar necesidades del negocio en productos digitales claros y funcionales.",
      skills: ["JavaScript", "TypeScript", "React", "APIs REST", "Git", "Pruebas de software"].map((name) => ({ name })),
      experiences: [{
        company: "Empresa de tecnología",
        role: "Desarrollador/a de software",
        location: "Ciudad (Remoto)",
        start: "2022",
        end: "Actualidad",
        bullets: [
          "Desarrollo y mantenimiento de funcionalidades centradas en las necesidades de los usuarios.",
          "Integración de servicios y APIs para automatizar procesos del producto.",
          "Colaboración con diseño y producto para entregar mejoras de forma iterativa.",
        ],
      }],
      education: [{ institution: "Universidad o instituto", degree: "Formación en informática o área relacionada", location: "Ciudad, País", start: "2018", end: "2022" }],
      certifications: [],
      template: "contrast",
      primaryColor: "#203A43",
      accentColor: "#5C8796",
    },
    industrial: {
      headline: "Ingeniero/a industrial",
      summary: "Profesional de ingeniería industrial con enfoque en mejora continua, análisis de procesos y coordinación de operaciones. Orientado a optimizar recursos, documentar indicadores y apoyar decisiones basadas en datos.",
      skills: ["Mejora continua", "Análisis de procesos", "Excel", "Indicadores KPI", "Gestión de proyectos", "Control de calidad"].map((name) => ({ name })),
      experiences: [{
        company: "Empresa manufacturera",
        role: "Analista de procesos",
        location: "Ciudad, País",
        start: "2021",
        end: "Actualidad",
        bullets: [
          "Análisis de flujos operativos e identificación de oportunidades de mejora.",
          "Seguimiento de indicadores de productividad, calidad y cumplimiento.",
          "Estandarización de procedimientos junto con las áreas de operaciones.",
        ],
      }],
      education: [{ institution: "Universidad Ejemplo", degree: "Ingeniería industrial", location: "Ciudad, País", start: "2016", end: "2021" }],
      certifications: [{ name: "Certificación en mejora continua", issuer: "Institución formativa", date: "2023" }],
      template: "modern",
      primaryColor: "#174C3C",
      accentColor: "#4D806F",
    },
    administrative: {
      headline: "Asistente administrativo/a",
      summary: "Profesional administrativo organizado y orientado al servicio, con experiencia apoyando la gestión documental, la coordinación de agendas y el seguimiento de tareas para facilitar el trabajo diario del equipo.",
      skills: ["Organización", "Microsoft Office", "Gestión documental", "Atención al cliente", "Coordinación de agendas", "Comunicación"].map((name) => ({ name })),
      experiences: [{
        company: "Empresa de servicios",
        role: "Asistente administrativo/a",
        location: "Ciudad, País",
        start: "2022",
        end: "Actualidad",
        bullets: [
          "Organización de documentos, agendas y comunicaciones internas.",
          "Seguimiento de solicitudes de clientes y proveedores.",
          "Preparación de reportes y apoyo en tareas administrativas del equipo.",
        ],
      }],
      education: [{ institution: "Instituto de formación", degree: "Administración o área relacionada", location: "Ciudad, País", start: "2019", end: "2021" }],
      certifications: [],
      template: "classic",
      fontFamily: "humanist",
    },
    marketing: {
      headline: "Especialista en marketing",
      summary: "Profesional de marketing orientado a planificar campañas, analizar resultados y crear contenidos relevantes. Capaz de coordinar iniciativas digitales y convertir información de audiencia en acciones medibles.",
      skills: ["Marketing digital", "Estrategia de contenidos", "Analítica web", "Redes sociales", "SEO", "Gestión de campañas"].map((name) => ({ name })),
      experiences: [{
        company: "Agencia o empresa",
        role: "Especialista en marketing",
        location: "Ciudad (Híbrido)",
        start: "2022",
        end: "Actualidad",
        bullets: [
          "Planificación y ejecución de campañas para distintos canales digitales.",
          "Análisis de métricas y elaboración de reportes de desempeño.",
          "Coordinación de contenidos con diseño, ventas y otras áreas.",
        ],
      }],
      education: [{ institution: "Universidad o instituto", degree: "Marketing, comunicación o área relacionada", location: "Ciudad, País", start: "2017", end: "2021" }],
      certifications: [{ name: "Certificación en marketing digital", issuer: "Plataforma formativa", date: "2024" }],
      template: "editorial",
      primaryColor: "#4C2E5F",
      accentColor: "#806294",
    },
    customerService: {
      headline: "Representante de atención al cliente",
      summary: "Profesional de atención al cliente orientado a resolver solicitudes con empatía, mantener una comunicación clara y convertir cada interacción en una experiencia positiva para el usuario.",
      skills: ["Atención al cliente", "Comunicación", "Resolución de conflictos", "CRM", "Gestión de casos", "Trabajo en equipo"].map((name) => ({ name })),
      experiences: [{
        company: "Empresa de servicios",
        role: "Representante de atención al cliente",
        location: "Ciudad (Híbrido)",
        start: "2022",
        end: "Actualidad",
        bullets: [
          "Atención de consultas por canales digitales y telefónicos, manteniendo una comunicación clara y cordial.",
          "Seguimiento de casos hasta su resolución y registro de información relevante en el CRM.",
          "Identificación de consultas frecuentes para mejorar respuestas y procesos de soporte.",
        ],
      }],
      education: [{ institution: "Instituto de formación", degree: "Formación en servicio, comunicación o área relacionada", location: "Ciudad, País", start: "2019", end: "2021" }],
      certifications: [],
      template: "compact",
      fontFamily: "humanist",
      primaryColor: "#173B63",
      accentColor: "#4E82B4",
    },
    sales: {
      headline: "Ejecutivo/a de ventas",
      summary: "Profesional de ventas enfocado en comprender necesidades, desarrollar relaciones comerciales y gestionar oportunidades de principio a fin para alcanzar objetivos sostenibles.",
      skills: ["Ventas consultivas", "Negociación", "Prospección", "CRM", "Presentaciones comerciales", "Seguimiento de indicadores"].map((name) => ({ name })),
      experiences: [{
        company: "Empresa comercial",
        role: "Ejecutivo/a de ventas",
        location: "Ciudad, País",
        start: "2021",
        end: "Actualidad",
        bullets: [
          "Gestión de oportunidades comerciales desde la prospección hasta el cierre y seguimiento posventa.",
          "Preparación de propuestas adaptadas a las necesidades y prioridades de cada cliente.",
          "Registro del avance del embudo comercial y análisis periódico de resultados.",
        ],
      }],
      education: [{ institution: "Universidad o instituto", degree: "Administración, ventas o área relacionada", location: "Ciudad, País", start: "2017", end: "2021" }],
      certifications: [{ name: "Formación en ventas consultivas", issuer: "Institución formativa", date: "2024" }],
      template: "modern",
      primaryColor: "#1F4D3A",
      accentColor: "#D49A3A",
    },
    accounting: {
      headline: "Contador/a",
      summary: "Profesional contable metódico y orientado al detalle, con experiencia organizando registros, preparando conciliaciones y apoyando cierres e informes financieros confiables.",
      skills: ["Contabilidad", "Conciliaciones bancarias", "Excel", "Cierres contables", "Reportes financieros", "Control documental"].map((name) => ({ name })),
      experiences: [{
        company: "Empresa de servicios financieros",
        role: "Analista contable",
        location: "Ciudad, País",
        start: "2021",
        end: "Actualidad",
        bullets: [
          "Registro y revisión de operaciones contables conforme a los procedimientos internos.",
          "Preparación de conciliaciones bancarias y seguimiento de diferencias identificadas.",
          "Apoyo en cierres mensuales y elaboración de reportes para la toma de decisiones.",
        ],
      }],
      education: [{ institution: "Universidad Ejemplo", degree: "Contaduría pública", location: "Ciudad, País", start: "2016", end: "2021" }],
      certifications: [],
      template: "classic",
      fontFamily: "serif",
      primaryColor: "#263238",
      accentColor: "#607D8B",
    },
    graphicDesign: {
      headline: "Diseñador/a gráfico/a",
      summary: "Profesional del diseño gráfico capaz de convertir objetivos de comunicación en piezas visuales coherentes, colaborar con distintas áreas y mantener consistencia entre formatos y canales.",
      skills: ["Diseño gráfico", "Identidad visual", "Adobe Illustrator", "Adobe Photoshop", "Diseño editorial", "Preparación de archivos"].map((name) => ({ name })),
      experiences: [{
        company: "Estudio o agencia creativa",
        role: "Diseñador/a gráfico/a",
        location: "Ciudad (Remoto)",
        start: "2022",
        end: "Actualidad",
        bullets: [
          "Diseño de piezas visuales para campañas, redes sociales y materiales corporativos.",
          "Adaptación de conceptos gráficos a diferentes formatos digitales e impresos.",
          "Coordinación con marketing y contenidos para asegurar claridad y consistencia de marca.",
        ],
      }],
      education: [{ institution: "Escuela de diseño", degree: "Diseño gráfico o comunicación visual", location: "Ciudad, País", start: "2018", end: "2022" }],
      certifications: [{ name: "Certificación en herramientas de diseño", issuer: "Plataforma formativa", date: "2023" }],
      template: "editorial",
      primaryColor: "#3D315B",
      accentColor: "#C47A5A",
    },
  },
  en: {
    software: {
      headline: "Software Developer",
      summary: "Software development professional focused on building maintainable solutions, collaborating with cross-functional teams, and turning business needs into clear and functional digital products.",
      skills: ["JavaScript", "TypeScript", "React", "REST APIs", "Git", "Software testing"].map((name) => ({ name })),
      experiences: [{
        company: "Technology Company",
        role: "Software Developer",
        location: "City (Remote)",
        start: "2022",
        end: "Present",
        bullets: [
          "Developed and maintained features centered on user needs.",
          "Integrated services and APIs to automate product workflows.",
          "Collaborated with design and product teams to deliver iterative improvements.",
        ],
      }],
      education: [{ institution: "University or College", degree: "Computer science or related studies", location: "City, Country", start: "2018", end: "2022" }],
      certifications: [],
      template: "contrast",
      primaryColor: "#203A43",
      accentColor: "#5C8796",
    },
    industrial: {
      headline: "Industrial Engineer",
      summary: "Industrial engineering professional focused on continuous improvement, process analysis, and operations coordination. Skilled at optimizing resources, tracking indicators, and supporting data-informed decisions.",
      skills: ["Continuous improvement", "Process analysis", "Excel", "KPI reporting", "Project management", "Quality control"].map((name) => ({ name })),
      experiences: [{
        company: "Manufacturing Company",
        role: "Process Analyst",
        location: "City, Country",
        start: "2021",
        end: "Present",
        bullets: [
          "Analyzed operational workflows and identified improvement opportunities.",
          "Tracked productivity, quality, and compliance indicators.",
          "Standardized procedures with operations teams.",
        ],
      }],
      education: [{ institution: "Example University", degree: "Industrial Engineering", location: "City, Country", start: "2016", end: "2021" }],
      certifications: [{ name: "Continuous Improvement Certification", issuer: "Training Institution", date: "2023" }],
      template: "modern",
      primaryColor: "#174C3C",
      accentColor: "#4D806F",
    },
    administrative: {
      headline: "Administrative Assistant",
      summary: "Organized, service-oriented administrative professional experienced in document management, calendar coordination, and task follow-up to keep daily team operations running smoothly.",
      skills: ["Organization", "Microsoft Office", "Document management", "Customer service", "Calendar coordination", "Communication"].map((name) => ({ name })),
      experiences: [{
        company: "Services Company",
        role: "Administrative Assistant",
        location: "City, Country",
        start: "2022",
        end: "Present",
        bullets: [
          "Organized documents, calendars, and internal communications.",
          "Followed up on customer and vendor requests.",
          "Prepared reports and supported the team's administrative workload.",
        ],
      }],
      education: [{ institution: "Training Institute", degree: "Business administration or related studies", location: "City, Country", start: "2019", end: "2021" }],
      certifications: [],
      template: "classic",
      fontFamily: "humanist",
    },
    marketing: {
      headline: "Marketing Specialist",
      summary: "Marketing professional focused on planning campaigns, analyzing results, and creating relevant content. Able to coordinate digital initiatives and turn audience insights into measurable actions.",
      skills: ["Digital marketing", "Content strategy", "Web analytics", "Social media", "SEO", "Campaign management"].map((name) => ({ name })),
      experiences: [{
        company: "Agency or Company",
        role: "Marketing Specialist",
        location: "City (Hybrid)",
        start: "2022",
        end: "Present",
        bullets: [
          "Planned and executed campaigns across digital channels.",
          "Analyzed metrics and prepared performance reports.",
          "Coordinated content with design, sales, and other teams.",
        ],
      }],
      education: [{ institution: "University or College", degree: "Marketing, communications, or related studies", location: "City, Country", start: "2017", end: "2021" }],
      certifications: [{ name: "Digital Marketing Certification", issuer: "Training Platform", date: "2024" }],
      template: "editorial",
      primaryColor: "#4C2E5F",
      accentColor: "#806294",
    },
    customerService: {
      headline: "Customer Service Representative",
      summary: "Customer service professional focused on resolving requests with empathy, communicating clearly, and turning each interaction into a positive customer experience.",
      skills: ["Customer service", "Communication", "Conflict resolution", "CRM", "Case management", "Teamwork"].map((name) => ({ name })),
      experiences: [{
        company: "Services Company",
        role: "Customer Service Representative",
        location: "City (Hybrid)",
        start: "2022",
        end: "Present",
        bullets: [
          "Handled customer questions through digital and phone channels with clear, courteous communication.",
          "Followed cases through resolution and documented relevant details in the CRM.",
          "Identified recurring questions to improve support responses and processes.",
        ],
      }],
      education: [{ institution: "Training Institute", degree: "Customer service, communications, or related studies", location: "City, Country", start: "2019", end: "2021" }],
      certifications: [],
      template: "compact",
      fontFamily: "humanist",
      primaryColor: "#173B63",
      accentColor: "#4E82B4",
    },
    sales: {
      headline: "Sales Executive",
      summary: "Sales professional focused on understanding needs, building commercial relationships, and managing opportunities from initial contact through close to achieve sustainable targets.",
      skills: ["Consultative selling", "Negotiation", "Prospecting", "CRM", "Sales presentations", "Performance tracking"].map((name) => ({ name })),
      experiences: [{
        company: "Commercial Company",
        role: "Sales Executive",
        location: "City, Country",
        start: "2021",
        end: "Present",
        bullets: [
          "Managed commercial opportunities from prospecting through closing and post-sale follow-up.",
          "Prepared proposals tailored to each customer's needs and priorities.",
          "Tracked pipeline progress and reviewed sales performance regularly.",
        ],
      }],
      education: [{ institution: "University or College", degree: "Business, sales, or related studies", location: "City, Country", start: "2017", end: "2021" }],
      certifications: [{ name: "Consultative Sales Training", issuer: "Training Institution", date: "2024" }],
      template: "modern",
      primaryColor: "#1F4D3A",
      accentColor: "#D49A3A",
    },
    accounting: {
      headline: "Accountant",
      summary: "Detail-oriented accounting professional experienced in organizing records, preparing reconciliations, and supporting reliable financial closes and reporting.",
      skills: ["Accounting", "Bank reconciliations", "Excel", "Month-end close", "Financial reporting", "Document control"].map((name) => ({ name })),
      experiences: [{
        company: "Financial Services Company",
        role: "Accounting Analyst",
        location: "City, Country",
        start: "2021",
        end: "Present",
        bullets: [
          "Recorded and reviewed accounting transactions according to internal procedures.",
          "Prepared bank reconciliations and followed up on identified discrepancies.",
          "Supported monthly closes and prepared reports for decision-making.",
        ],
      }],
      education: [{ institution: "Example University", degree: "Accounting", location: "City, Country", start: "2016", end: "2021" }],
      certifications: [],
      template: "classic",
      fontFamily: "serif",
      primaryColor: "#263238",
      accentColor: "#607D8B",
    },
    graphicDesign: {
      headline: "Graphic Designer",
      summary: "Graphic design professional skilled at turning communication goals into coherent visual assets, collaborating across teams, and maintaining consistency across formats and channels.",
      skills: ["Graphic design", "Visual identity", "Adobe Illustrator", "Adobe Photoshop", "Editorial design", "File preparation"].map((name) => ({ name })),
      experiences: [{
        company: "Creative Studio or Agency",
        role: "Graphic Designer",
        location: "City (Remote)",
        start: "2022",
        end: "Present",
        bullets: [
          "Designed visual assets for campaigns, social media, and corporate materials.",
          "Adapted visual concepts for multiple digital and print formats.",
          "Worked with marketing and content teams to maintain brand clarity and consistency.",
        ],
      }],
      education: [{ institution: "Design School", degree: "Graphic Design or Visual Communication", location: "City, Country", start: "2018", end: "2022" }],
      certifications: [{ name: "Design Tools Certification", issuer: "Training Platform", date: "2023" }],
      template: "editorial",
      primaryColor: "#3D315B",
      accentColor: "#C47A5A",
    },
  },
};

export function getProfessionalPreset(locale: string, id: ProfessionalPresetId): CvData {
  const normalizedLocale = locale === "en" ? "en" : "es";
  return { ...getInitialCv(normalizedLocale), ...presets[normalizedLocale][id] };
}

export function isProfessionalPresetId(value: string | null): value is ProfessionalPresetId {
  return value !== null && professionalPresetIds.includes(value as ProfessionalPresetId);
}

export function getProfessionalPresetIdBySlug(locale: string, slug: string): ProfessionalPresetId | undefined {
  const normalizedLocale = locale === "en" ? "en" : "es";
  return professionalPresetIds.find((id) => professionalPresetSlugs[normalizedLocale][id] === slug);
}

export function getProfessionalPresetPath(locale: string, id: ProfessionalPresetId): string {
  const normalizedLocale = locale === "en" ? "en" : "es";
  const catalogSegment = normalizedLocale === "en" ? "templates" : "plantillas";
  return `/${normalizedLocale}/${catalogSegment}/${professionalPresetSlugs[normalizedLocale][id]}`;
}
