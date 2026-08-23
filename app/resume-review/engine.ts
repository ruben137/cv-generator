import type { CvData } from "../types";

export type ReviewStatus = "passed" | "warning" | "info";
export type ReviewCheck = { id: string; status: ReviewStatus; values?: string[] };
export type ResumeQualityReview = { percentage: number; passed: number; warnings: number; checks: ReviewCheck[] };

const numberPattern = /(?:\b\d+(?:[.,]\d+)?\s?%|[$€£]\s?\d|\b\d{2,}\b)/;
const actionVerbs = {
  es: ["aumenté", "reduje", "optimicé", "implementé", "lideré", "desarrollé", "coordiné", "diseñé", "automaticé", "gestioné", "mejoré"],
  en: ["increased", "reduced", "optimized", "implemented", "led", "developed", "coordinated", "designed", "automated", "managed", "improved"],
};
const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);

export function reviewResumeQuality(cv: CvData): ResumeQualityReview {
  const checks: ReviewCheck[] = [];
  const skills = cv.skills.map(({ name }) => name.trim()).filter(Boolean);
  const bullets = cv.experiences.flatMap((experience) => experience.bullets).map((item) => item.trim()).filter(Boolean);
  const experienceText = normalize(bullets.join(" "));
  checks.push({ id: "contact", status: cv.email.trim() && cv.phone.trim() ? "passed" : "warning" });
  checks.push({ id: "links", status: cv.portfolio.trim() ? "passed" : "info" });
  checks.push({ id: "title", status: words(cv.headline).length >= 2 ? "passed" : "warning" });
  const summaryWords = words(cv.summary);
  checks.push({ id: "summary", status: summaryWords.length >= 35 && summaryWords.length <= 100 ? "passed" : "warning" });
  checks.push({ id: "experience", status: bullets.length >= 2 ? "passed" : "warning" });
  const incompleteDates = cv.experiences.filter((item) => (item.company || item.role) && (!item.start || !item.end));
  checks.push({ id: "dates", status: incompleteDates.length ? "warning" : "passed", values: incompleteDates.map((item) => item.role || item.company) });
  checks.push({ id: "skills", status: skills.length >= 5 && skills.length <= 12 ? "passed" : "warning" });
  const longBullets = bullets.filter((item) => words(item).length > 35).slice(0, 3);
  checks.push({ id: "bulletLength", status: longBullets.length ? "warning" : "passed", values: longBullets });
  checks.push({ id: "metrics", status: numberPattern.test(bullets.join(" ")) ? "passed" : "warning" });
  const verbs = actionVerbs[cv.documentLocale].map(normalize);
  checks.push({ id: "actionVerbs", status: bullets.some((line) => verbs.some((verb) => normalize(line).startsWith(verb))) ? "passed" : "info" });
  const unsupportedSkills = skills.filter((skill) => !experienceText.includes(normalize(skill))).slice(0, 5);
  checks.push({ id: "skillEvidence", status: unsupportedSkills.length > Math.max(2, Math.floor(skills.length / 2)) ? "warning" : "passed", values: unsupportedSkills });
  const duplicated = [...new Set(bullets.filter((line, index) => bullets.findIndex((other) => normalize(other) === normalize(line)) !== index))].slice(0, 3);
  checks.push({ id: "repetition", status: duplicated.length ? "warning" : "passed", values: duplicated });
  const customText = cv.customSections.flatMap((section) => section.type === "text" ? [section.text] : section.items.map((item) => item.text));
  const totalWords = words([cv.summary, ...bullets, ...skills, ...customText].join(" ")).length;
  checks.push({ id: "length", status: totalWords >= 140 && totalWords <= 700 ? "passed" : "warning" });
  const evaluable = checks.filter((check) => check.status !== "info");
  const passed = checks.filter((check) => check.status === "passed").length;
  const warnings = checks.filter((check) => check.status === "warning").length;
  return { percentage: Math.round((evaluable.filter((check) => check.status === "passed").length / evaluable.length) * 100), passed, warnings, checks };
}
