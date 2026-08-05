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

export type CvData = {
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
};

const baseCv: Pick<CvData, "primaryColor" | "accentColor"> = {
  primaryColor: "#173B63",
  accentColor: "#3C6596",
};

export function getInitialCv(locale: string): CvData {
  if (locale === "en") {
    return {
      ...baseCv,
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
  };
}
