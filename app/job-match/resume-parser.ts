import type { JobMatchLanguage, ResumeMatchInput, TermSource } from "./model";

const sectionHeadings: Record<JobMatchLanguage, Array<{ source: TermSource; pattern: RegExp }>> = {
  es: [
    { source: "resume-experience", pattern: /^(experiencia|experiencia profesional|historial laboral)$/i },
    { source: "resume-skill", pattern: /^(habilidades|competencias|aptitudes|conocimientos)$/i },
    { source: "resume-education", pattern: /^(educaci[oó]n|formaci[oó]n|formaci[oó]n acad[eé]mica|estudios)$/i },
    { source: "resume-certification", pattern: /^(certificaciones|certificados|cursos)$/i },
    { source: "resume-language", pattern: /^(idiomas|lenguajes)$/i },
    { source: "resume-summary", pattern: /^(resumen|perfil|perfil profesional|sobre m[ií])$/i },
  ],
  en: [
    { source: "resume-experience", pattern: /^(experience|work experience|employment history)$/i },
    { source: "resume-skill", pattern: /^(skills|competencies|expertise|technical skills)$/i },
    { source: "resume-education", pattern: /^(education|academic background|studies)$/i },
    { source: "resume-certification", pattern: /^(certifications|certificates|courses)$/i },
    { source: "resume-language", pattern: /^(languages)$/i },
    { source: "resume-summary", pattern: /^(summary|profile|professional profile|about me)$/i },
  ],
};

function cleanLine(value: string): string {
  return value.replace(/^[\s•·▪◦*-]+/, "").trim();
}

export function parsePastedResume(
  title: string,
  text: string,
  language: JobMatchLanguage,
): ResumeMatchInput {
  const grouped: Record<TermSource, string[]> = {
    "job-title": [],
    "job-description": [],
    "resume-title": [],
    "resume-summary": [],
    "resume-skill": [],
    "resume-experience": [],
    "resume-experience-context": [],
    "resume-education": [],
    "resume-certification": [],
    "resume-language": [],
    "resume-custom": [],
  };
  let currentSource: TermSource = "resume-summary";

  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (!line) continue;
    const heading = sectionHeadings[language].find((item) => item.pattern.test(line.replace(/:$/, "")));
    if (heading) {
      currentSource = heading.source;
      continue;
    }
    grouped[currentSource].push(line);
  }

  return {
    source: "text",
    title: title.trim(),
    summary: grouped["resume-summary"].join("\n"),
    skills: grouped["resume-skill"],
    experience: grouped["resume-experience"],
    education: grouped["resume-education"],
    certifications: grouped["resume-certification"],
    languages: grouped["resume-language"],
  };
}
