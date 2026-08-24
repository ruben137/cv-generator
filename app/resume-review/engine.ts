import type { CvData } from "../types";
import { containsExactTerm } from "../job-match/normalization";

export type ReviewStatus = "passed" | "warning" | "info";
export type ReviewCheck = { id: string; status: ReviewStatus; values?: string[]; matched?: number; total?: number };
export type ResumeQualityReview = { percentage: number; passed: number; warnings: number; checks: ReviewCheck[] };

const quantitativePatterns = {
  es: [
    /(?:[$€£]\s*\d|\b\d+(?:[.,]\d+)?\s*(?:%|x\b))/i,
    /\b(?:mas de|menos de|aproximadamente|alrededor de|hasta)\s+\d+(?:[.,]\d+)?\b/i,
    /\b\d+(?:[.,]\d+)?\s*(?:anos?|mes(?:es)?|semanas?|dias?|horas?|minutos?|personas?|usuarios?|clientes?|proyectos?|campanas?|cuentas?|casos?|solicitudes?|tickets?|equipos?|procesos?|reportes?|informes?|documentos?|productos?|ventas?|conversiones?|visitas?|registros?|sucursales?|paises?|mercados?|empleados?|colaboradores?)\b/i,
  ],
  en: [
    /(?:[$€£]\s*\d|\b\d+(?:[.,]\d+)?\s*(?:%|x\b))/i,
    /\b(?:more than|less than|approximately|around|up to|over)\s+\d+(?:[.,]\d+)?\b/i,
    /\b\d+(?:[.,]\d+)?\s*(?:years?|months?|weeks?|days?|hours?|minutes?|people|users?|clients?|customers?|projects?|campaigns?|accounts?|cases?|requests?|tickets?|teams?|processes|reports?|documents?|products?|sales|conversions?|visits?|records?|branches|countries|markets|employees|collaborators?)\b/i,
  ],
};
const actionVerbPatterns = {
  es: /^(?:aumente|reduje|optimice|implemente|lidere|desarrolle|coordine|disene|automatice|gestione|mejore|logre|cree|dirigi|analice|ejecute|administre|supervise|negocie|organice|planifique|resolvi|disminui|incremente|transforme|elabore|construi|migre|integre|configure|capacite|atendi|controle|audite|documente|presente|prepare|estableci|impulse|consegui|alcance|supere|colabore|apoye|participe)\b/,
  en: /^(?:increased|reduced|optimized|implemented|led|developed|coordinated|designed|automated|managed|improved|achieved|created|directed|analyzed|executed|administered|supervised|negotiated|organized|planned|resolved|decreased|grew|transformed|built|migrated|integrated|configured|trained|served|controlled|audited|documented|presented|prepared|established|drove|delivered|exceeded|collaborated|supported|participated)\b/,
};
const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);
const beginsWithActionVerb = (value: string, locale: CvData["documentLocale"]) => actionVerbPatterns[locale].test(normalize(value).replace(/^[^a-z]+/, ""));
const hasQuantitativeEvidence = (value: string, locale: CvData["documentLocale"]) => quantitativePatterns[locale].some((pattern) => pattern.test(normalize(value)));
const expandDeclaredSkills = (skills: string[]) => [...new Set(skills.flatMap((skill) => {
  const separator = skill.indexOf(":");
  const content = separator >= 0 && skill.slice(separator + 1).trim() ? skill.slice(separator + 1) : skill;
  return content.split(/[,;|\n•]+/).map((item) => item.trim()).filter(Boolean);
}))];

export function reviewResumeQuality(cv: CvData): ResumeQualityReview {
  const checks: ReviewCheck[] = [];
  const skills = cv.skills.map(({ name }) => name.trim()).filter(Boolean);
  const declaredSkills = expandDeclaredSkills(skills);
  const bullets = cv.experiences.flatMap((experience) => experience.bullets).map((item) => item.trim()).filter(Boolean);
  const experienceText = bullets.join(" ");
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
  const quantifiedBullets = bullets.filter((line) => hasQuantitativeEvidence(line, cv.documentLocale));
  checks.push({
    id: "metrics",
    status: quantifiedBullets.length > 0 ? "passed" : "warning",
    matched: quantifiedBullets.length,
    total: bullets.length,
  });
  const actionBullets = bullets.filter((line) => beginsWithActionVerb(line, cv.documentLocale));
  const actionVerbRatio = bullets.length ? actionBullets.length / bullets.length : 0;
  checks.push({
    id: "actionVerbs",
    status: actionVerbRatio >= 0.6 ? "passed" : "info",
    matched: actionBullets.length,
    total: bullets.length,
  });
  const unsupportedSkills = declaredSkills.filter((skill) => !containsExactTerm(experienceText, skill));
  checks.push({
    id: "skillEvidence",
    status: unsupportedSkills.length > Math.max(2, Math.floor(declaredSkills.length / 2)) ? "warning" : "passed",
    values: unsupportedSkills.slice(0, 5),
    matched: declaredSkills.length - unsupportedSkills.length,
    total: declaredSkills.length,
  });
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
