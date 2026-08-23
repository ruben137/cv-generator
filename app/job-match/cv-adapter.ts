import type { CvData } from "../types";
import type { ResumeMatchInput } from "./model";

export function cvDataToMatchInput(cv: CvData): ResumeMatchInput {
  return {
    source: "structured",
    title: cv.headline,
    summary: cv.summary,
    skills: cv.skills.map((item) => item.name).filter(Boolean),
    experience: cv.experiences.flatMap((item) => item.bullets.filter(Boolean)),
    experienceContext: cv.experiences.map((item) => [item.role, item.company, item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")).filter(Boolean),
    education: cv.education.map((item) => [item.degree, item.institution].filter(Boolean).join(" · ")).filter(Boolean),
    certifications: cv.certifications.map((item) => [item.name, item.issuer].filter(Boolean).join(" · ")).filter(Boolean),
    languages: cv.languages.map((item) => [item.name, item.level].filter(Boolean).join(" · ")).filter(Boolean),
    customSections: cv.customSections.flatMap((section) => section.type === "text"
      ? [section.title, section.text].filter(Boolean).join(" · ")
      : section.items.map((item) => [section.title, item.text].filter(Boolean).join(" · "))).filter(Boolean),
  };
}
