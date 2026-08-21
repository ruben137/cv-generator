export type Experience = {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
};

export type Language = {
  name: string;
  level: string;
};

export type Skill = {
  name: string;
};

export type Education = {
  institution: string;
  degree: string;
  location: string;
  start: string;
  end: string;
};

export type Certification = {
  name: string;
  issuer: string;
  date: string;
};

export const mainSectionIds = ["summary", "experience", "education", "certifications", "skills"] as const;
export type MainSectionId = (typeof mainSectionIds)[number];

export const sidebarLabelIds = ["contact", "languages", "location", "phone", "email", "portfolio"] as const;
export type SidebarLabelId = (typeof sidebarLabelIds)[number];
export type CvLabelId = MainSectionId | SidebarLabelId;

export type CustomSectionItem = { id: string; text: string };
export type CustomSection = {
  id: string;
  title: string;
  type: "text" | "list";
  text: string;
  items: CustomSectionItem[];
};

export function normalizeSectionOrder(order?: MainSectionId[]): MainSectionId[] {
  const valid = (order ?? []).filter(
    (item, index, items): item is MainSectionId => mainSectionIds.includes(item) && items.indexOf(item) === index,
  );
  return [...valid, ...mainSectionIds.filter((item) => !valid.includes(item))];
}

export function normalizeContentOrder(
  order: string[] | undefined,
  legacyOrder: MainSectionId[] | undefined,
  customSections: CustomSection[],
): string[] {
  const customIds = customSections.map((section) => section.id);
  const validIds = new Set<string>([...mainSectionIds, ...customIds]);
  const preferred = order?.length ? order : normalizeSectionOrder(legacyOrder);
  const valid = preferred.filter((item, index, items) => validIds.has(item) && items.indexOf(item) === index);
  return [
    ...valid,
    ...mainSectionIds.filter((item) => !valid.includes(item)),
    ...customIds.filter((item) => !valid.includes(item)),
  ];
}

export type CvData = {
  documentLocale: "es" | "en";
  template: "classic" | "modern" | "minimal" | "right" | "compact" | "contrast" | "editorial";
  fontFamily: "sans" | "serif" | "humanist";
  photoShape: "square" | "round";
  primaryColor: string;
  accentColor: string;
  name: string;
  headline: string;
  phone: string;
  email: string;
  portfolio: string;
  location: string;
  summary: string;
  skills: Skill[];
  photo?: string;
  languages: Language[];
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  sectionOrder: MainSectionId[];
  contentOrder: string[];
  sectionTitles: Partial<Record<CvLabelId, string>>;
  customSections: CustomSection[];
};

const baseCv: Pick<CvData, "documentLocale" | "template" | "fontFamily" | "photoShape" | "primaryColor" | "accentColor" | "sectionOrder" | "contentOrder" | "sectionTitles" | "customSections"> = {
  documentLocale: "es",
  template: "classic",
  fontFamily: "sans",
  photoShape: "square",
  primaryColor: "#173B63",
  accentColor: "#3C6596",
  sectionOrder: [...mainSectionIds],
  contentOrder: [...mainSectionIds],
  sectionTitles: {},
  customSections: [],
};

export function getInitialCv(locale: string): CvData {
  if (locale === "en") {
    return {
      ...baseCv,
      documentLocale: "en",
      name: "First Last",
      headline: "Professional title",
      phone: "+00 000 000 000",
      email: "name@example.com",
      portfolio: "myportfolio.com",
      location: "City, Country",
      summary:
        "Professional with experience collaborating on projects and solving problems in an organized way. Interested in delivering clear results, learning continuously, and working as part of a team.",
      skills: [
        { name: "Communication" },
        { name: "Teamwork" },
        { name: "Organization" },
        { name: "Problem solving" },
        { name: "Adaptability" },
      ],
      languages: [
        { name: "Primary language", level: "Native" },
        { name: "Second language", level: "Intermediate" },
      ],
      experiences: [
        {
          company: "Example Company",
          role: "Professional role",
          location: "City (Remote)",
          start: "2022",
          end: "Present",
          bullets: [
            "Coordinated tasks and tracked team objectives.",
            "Improved processes to deliver results more efficiently.",
            "Collaborated across departments to address project needs.",
          ],
        },
        {
          company: "Demo Organization",
          role: "Previous role",
          location: "City",
          start: "2020",
          end: "2022",
          bullets: [
            "Supported the planning and execution of internal initiatives.",
            "Documented progress and communicated results.",
          ],
        },
      ],
      education: [
        {
          institution: "Example University",
          degree: "Bachelor's degree",
          location: "City, Country",
          start: "2016",
          end: "2020",
        },
      ],
      certifications: [
        { name: "Professional Certification", issuer: "Example Institute", date: "2024" },
      ],
    };
  }

  return {
    ...baseCv,
    name: "Nombre Apellido",
    headline: "Título profesional",
    phone: "+00 000 000 000",
    email: "nombre@ejemplo.com",
    portfolio: "miportafolio.com",
    location: "Ciudad, País",
    summary:
      "Profesional con experiencia colaborando en proyectos y resolviendo problemas de forma organizada. Me interesa aportar resultados claros, aprender continuamente y trabajar en equipo.",
    skills: [
      { name: "Comunicación" },
      { name: "Trabajo en equipo" },
      { name: "Organización" },
      { name: "Resolución de problemas" },
      { name: "Adaptabilidad" },
    ],
    languages: [
      { name: "Idioma principal", level: "Nativo" },
      { name: "Segundo idioma", level: "Intermedio" },
    ],
    experiences: [
      {
        company: "Empresa Ejemplo",
        role: "Cargo profesional",
        location: "Ciudad (Remoto)",
        start: "2022",
        end: "Actualidad",
        bullets: [
          "Coordinación de tareas y seguimiento de objetivos del equipo.",
          "Mejora de procesos para entregar resultados de forma más eficiente.",
          "Colaboración con diferentes áreas para resolver necesidades del proyecto.",
        ],
      },
      {
        company: "Organización Demo",
        role: "Cargo anterior",
        location: "Ciudad",
        start: "2020",
        end: "2022",
        bullets: [
          "Apoyo en la planificación y ejecución de iniciativas internas.",
          "Documentación de avances y comunicación de resultados.",
        ],
      },
    ],
    education: [
      {
        institution: "Universidad Ejemplo",
        degree: "Título universitario",
        location: "Ciudad, País",
        start: "2016",
        end: "2020",
      },
    ],
    certifications: [
      { name: "Certificación profesional", issuer: "Institución Ejemplo", date: "2024" },
    ],
  };
}
