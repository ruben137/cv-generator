import type { GuideArticle } from "./guide-pages";

const sharedSlug = {
  es: "como-hacer-cv-sin-experiencia",
  en: "how-to-write-resume-no-experience",
};

const noExperienceGuideEs: GuideArticle = {
  title: "Cómo hacer un CV sin experiencia: guía y ejemplos",
  description: "Aprende a crear un currículum sin experiencia laboral usando estudios, proyectos, voluntariado y habilidades demostrables, con ejemplos que puedes adaptar.",
  eyebrow: "Guía para primer empleo",
  slug: sharedSlug,
  updatedAt: "26 de agosto de 2026",
  readTime: "9 min de lectura",
  sections: [
    {
      id: "que-valora-un-reclutador",
      title: "Qué busca un reclutador cuando todavía no tienes experiencia",
      paragraphs: [
        "No tener empleos anteriores no significa que tu CV tenga que estar vacío. En una candidatura inicial, el objetivo es demostrar potencial, responsabilidad y conocimientos aplicables mediante otras evidencias.",
        "Una persona reclutadora no espera que un perfil junior tenga una trayectoria extensa. Sí necesita entender qué sabes hacer, cómo lo aprendiste y en qué situaciones lo has puesto en práctica.",
      ],
      bullets: [
        "Conocimientos relacionados con el puesto.",
        "Proyectos académicos o personales terminados.",
        "Capacidad para aprender y colaborar.",
        "Resultados concretos, aunque provengan de estudios o voluntariado.",
      ],
    },
    {
      id: "estructura-recomendada",
      title: "Estructura recomendada para un CV sin experiencia",
      paragraphs: [
        "El orden de las secciones debe favorecer tus puntos más fuertes. Si tu formación y tus proyectos son más relevantes que tu historial laboral, colócalos antes.",
      ],
      bullets: [
        "Nombre, título profesional objetivo e información de contacto.",
        "Resumen profesional breve.",
        "Formación académica relevante.",
        "Proyectos, prácticas, voluntariado o actividades extracurriculares.",
        "Habilidades técnicas e idiomas.",
        "Cursos y certificaciones que aporten valor.",
      ],
    },
    {
      id: "titulo-y-resumen",
      title: "Escribe un título y un resumen profesional específicos",
      paragraphs: [
        "Evita presentarte simplemente como «estudiante» o escribir que buscas cualquier oportunidad. Utiliza un título cercano al puesto objetivo, siempre que refleje tu formación o tus conocimientos: «Asistente administrativo junior», «Desarrollador frontend junior» o «Técnica de enfermería recién graduada».",
        "Tu resumen puede ocupar entre tres y cuatro líneas. Un ejemplo sería: «Graduada en Administración con experiencia académica organizando datos y preparando reportes en Excel. Desarrollé un proyecto de control de inventario para una empresa simulada y colaboré en actividades de atención al público. Busco aportar organización, aprendizaje rápido y atención al detalle en un puesto administrativo junior».",
        "El ejemplo funciona porque conecta formación, evidencia y objetivo. No afirma años de experiencia que la persona no posee.",
      ],
    },
    {
      id: "experiencia-no-laboral",
      title: "Convierte proyectos y actividades en experiencia relevante",
      paragraphs: [
        "Puedes utilizar una sección llamada Proyectos, Experiencia relevante o Actividades. Describe cada elemento como describirías un empleo: contexto, contribución y resultado.",
        "En lugar de «Proyecto universitario de marketing», escribe: «Diseñé junto a un equipo de cuatro personas una campaña digital para un comercio local; analicé el público objetivo, preparé el calendario de contenidos y presenté métricas estimadas de alcance».",
      ],
      bullets: [
        "Proyectos académicos relacionados con la profesión.",
        "Proyectos personales con un resultado visible.",
        "Prácticas profesionales y pasantías.",
        "Voluntariado, asociaciones estudiantiles y eventos.",
        "Trabajos informales que demuestren habilidades transferibles.",
      ],
    },
    {
      id: "habilidades-con-evidencia",
      title: "Selecciona habilidades que puedas respaldar",
      paragraphs: [
        "Una lista extensa de cualidades no compensa la falta de experiencia. Elige las habilidades más relacionadas con la vacante y procura demostrar las principales dentro de tus proyectos o actividades.",
        "Si incluyes Excel, explica dónde lo utilizaste. Si mencionas atención al cliente, indica la actividad en la que atendiste personas. Para habilidades como comunicación o trabajo en equipo, aporta un ejemplo en vez de depender únicamente de la etiqueta.",
      ],
    },
    {
      id: "formacion-y-cursos",
      title: "Aprovecha la formación sin convertir el CV en un expediente",
      paragraphs: [
        "Incluye el título, la institución y las fechas. Puedes añadir asignaturas, reconocimientos o un trabajo final solamente cuando sean relevantes para el puesto.",
        "Los cursos cortos deben complementar el perfil. Prioriza los recientes y aplicables; evita llenar la página con certificados introductorios que repiten la misma habilidad.",
      ],
    },
    {
      id: "errores-frecuentes",
      title: "Errores frecuentes en un CV para primer empleo",
      paragraphs: [
        "La falta de experiencia no se resuelve agregando información irrelevante. Un CV breve y coherente suele comunicar mejor tu potencial que una página saturada.",
      ],
      bullets: [
        "Escribir «sin experiencia» como parte del título o del resumen.",
        "Inventar empleos, responsabilidades, habilidades o resultados.",
        "Utilizar el mismo CV para vacantes muy diferentes.",
        "Enumerar habilidades sin mostrar dónde fueron aplicadas.",
        "Incluir datos personales innecesarios o referencias completas.",
        "Usar párrafos largos, errores ortográficos o diseños difíciles de leer.",
      ],
    },
    {
      id: "checklist-final",
      title: "Checklist antes de enviar tu CV",
      paragraphs: [
        "Lee el documento desde la perspectiva de alguien que no te conoce. En pocos segundos debería quedar claro a qué puesto apuntas y qué evidencia respalda tu candidatura.",
      ],
      bullets: [
        "El título coincide con el tipo de puesto que buscas.",
        "El resumen aporta información y no repite frases genéricas.",
        "Cada proyecto explica tu contribución, no solo el tema.",
        "Las habilidades principales aparecen respaldadas en otra sección.",
        "La información más relevante cabe en una página fácil de escanear.",
        "El archivo tiene un nombre profesional y fue revisado antes de enviarlo.",
      ],
    },
  ],
};

const noExperienceGuideEn: GuideArticle = {
  title: "How to write a resume with no experience: guide and examples",
  description: "Learn how to build a resume with no work experience using education, projects, volunteering, and demonstrable skills, with examples you can adapt.",
  eyebrow: "First-job resume guide",
  slug: sharedSlug,
  updatedAt: "August 26, 2026",
  readTime: "9 min read",
  sections: [
    {
      id: "what-recruiters-value",
      title: "What recruiters look for when you have no experience",
      paragraphs: [
        "Having no previous jobs does not mean your resume must be empty. For an entry-level application, your goal is to show potential, reliability, and relevant knowledge through other forms of evidence.",
        "Recruiters do not expect junior candidates to have a long career history. They do need to understand what you can do, how you learned it, and where you have applied it.",
      ],
      bullets: ["Knowledge related to the role.", "Completed academic or personal projects.", "Ability to learn and collaborate.", "Concrete outcomes from education, volunteering, or other activities."],
    },
    {
      id: "recommended-structure",
      title: "Recommended structure for a resume with no experience",
      paragraphs: ["Order your sections around your strongest evidence. If your education and projects matter more than your employment history, place them first."],
      bullets: ["Name, target professional title, and contact details.", "A concise professional summary.", "Relevant education.", "Projects, internships, volunteering, or extracurricular activities.", "Technical skills and languages.", "Courses and certifications that add value."],
    },
    {
      id: "title-and-summary",
      title: "Write a specific title and professional summary",
      paragraphs: [
        "Avoid presenting yourself only as a student or saying that you are open to any opportunity. Use a title close to your target role when it reflects your training or knowledge, such as “Junior Administrative Assistant,” “Junior Frontend Developer,” or “Newly Qualified Nursing Technician.”",
        "Keep your summary to three or four lines. For example: “Business Administration graduate with academic experience organizing data and preparing Excel reports. Developed an inventory-control project for a simulated company and supported public-facing volunteer activities. Looking to bring organization, fast learning, and attention to detail to a junior administrative role.”",
        "The example works because it connects education, evidence, and direction without claiming years of experience the candidate does not have.",
      ],
    },
    {
      id: "non-work-experience",
      title: "Turn projects and activities into relevant experience",
      paragraphs: [
        "You can create a section called Projects, Relevant Experience, or Activities. Describe every item as you would describe a job: provide context, explain your contribution, and state the outcome.",
        "Instead of “University marketing project,” write: “Worked with a four-person team to design a digital campaign for a local business; analyzed the target audience, prepared the content calendar, and presented estimated reach metrics.”",
      ],
      bullets: ["Academic projects related to the profession.", "Personal projects with a visible result.", "Internships and work placements.", "Volunteering, student organizations, and events.", "Informal work that demonstrates transferable skills."],
    },
    {
      id: "skills-with-evidence",
      title: "Choose skills you can support with evidence",
      paragraphs: [
        "A long list of qualities does not compensate for limited experience. Choose the skills most relevant to the opening and demonstrate the key ones in your projects or activities.",
        "If you list Excel, show where you used it. If you mention customer service, identify the activity where you assisted people. For communication or teamwork, provide an example instead of relying only on the label.",
      ],
    },
    {
      id: "education-and-courses",
      title: "Use education effectively without listing your entire transcript",
      paragraphs: [
        "Include the qualification, institution, and dates. Add relevant coursework, awards, or a final project only when they support the target role.",
        "Short courses should strengthen the profile. Prioritize recent, applicable learning and avoid filling the page with introductory certificates that repeat the same skill.",
      ],
    },
    {
      id: "common-mistakes",
      title: "Common mistakes on a first-job resume",
      paragraphs: ["You cannot solve a lack of experience by adding irrelevant information. A concise, coherent resume usually communicates your potential better than a crowded page."],
      bullets: ["Using “no experience” in the title or summary.", "Inventing jobs, responsibilities, skills, or results.", "Sending the same resume to very different openings.", "Listing skills without showing where you applied them.", "Including unnecessary personal details or full references.", "Using long paragraphs, spelling mistakes, or a hard-to-read design."],
    },
    {
      id: "final-checklist",
      title: "Checklist before sending your resume",
      paragraphs: ["Read the document from the perspective of someone who does not know you. Within a few seconds, your target role and the evidence supporting your application should be clear."],
      bullets: ["The title matches the type of role you want.", "The summary adds information instead of repeating generic phrases.", "Every project explains your contribution, not only the subject.", "Your main skills are supported elsewhere in the resume.", "The most relevant information fits on one easy-to-scan page.", "The file has a professional name and has been proofread."],
    },
  ],
};

export function getGuideBySlug(locale: string, slug: string): GuideArticle | undefined {
  if (locale === "en" && slug === sharedSlug.en) return noExperienceGuideEn;
  if (locale !== "en" && slug === sharedSlug.es) return noExperienceGuideEs;
  return undefined;
}

export function getGuideSlugs(locale: "es" | "en"): string[] {
  return [sharedSlug[locale]];
}
