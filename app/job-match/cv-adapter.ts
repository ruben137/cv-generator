import type { CvData } from "../types";
import type { ResumeMatchInput } from "./model";

export function cvDataToMatchInput(cv: CvData): ResumeMatchInput {
  return {
    title: cv.headline,
    summary: cv.summary,
    skills: cv.skills.map((item) => item.name).filter(Boolean),
    experience: cv.experiences.flatMap((item) => [
      [item.role, item.company].filter(Boolean).join(" · "),
      ...item.bullets.filter(Boolean),
    ]).filter(Boolean),
    education: cv.education.map((item) => [item.degree, item.institution].filter(Boolean).join(" · ")).filter(Boolean),
    certifications: cv.certifications.map((item) => [item.name, item.issuer].filter(Boolean).join(" · ")).filter(Boolean),
    languages: cv.languages.map((item) => [item.name, item.level].filter(Boolean).join(" · ")).filter(Boolean),
  };
}
