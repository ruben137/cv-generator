import type { CvData } from "./types";

export const IMPROVEMENT_PLANS_KEY = "cv-simple-improvement-plans";
const VERSION = 1;
const MAX_PLANS = 12;

export type ImprovementSource = "job-match" | "quality-review";
export type ImprovementTarget = { cvId?: string; fingerprint: string };
export type ImprovementSuggestion = {
  id: string;
  kind: "add-skill" | "review-section";
  section: "contact" | "headline" | "summary" | "experience" | "skills" | "general";
  terms?: string[];
  title: string;
  detail: string;
};
export type ImprovementPlan = {
  version: typeof VERSION;
  id: string;
  createdAt: string;
  source: ImprovementSource;
  target: ImprovementTarget;
  suggestions: ImprovementSuggestion[];
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

export function fingerprintCv(cv: CvData): string {
  return hash(JSON.stringify({
    locale: cv.documentLocale,
    name: cv.name,
    headline: cv.headline,
    summary: cv.summary,
    contact: [cv.email, cv.phone, cv.portfolio, cv.location],
    skills: cv.skills,
    languages: cv.languages,
    experiences: cv.experiences,
    education: cv.education,
    certifications: cv.certifications,
    customSections: cv.customSections,
  }));
}

export function createImprovementTarget(cv: CvData, cvId?: string | null): ImprovementTarget {
  return { ...(cvId ? { cvId } : {}), fingerprint: fingerprintCv(cv) };
}

function isSameTarget(left: ImprovementTarget, right: ImprovementTarget): boolean {
  if (left.cvId && right.cvId) return left.cvId === right.cvId;
  return left.fingerprint === right.fingerprint;
}

function readPlans(storage: Storage): ImprovementPlan[] {
  try {
    const value = JSON.parse(storage.getItem(IMPROVEMENT_PLANS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((plan): plan is ImprovementPlan => Boolean(
      plan && typeof plan === "object"
      && (plan as ImprovementPlan).version === VERSION
      && typeof (plan as ImprovementPlan).id === "string"
      && Array.isArray((plan as ImprovementPlan).suggestions),
    ));
  } catch {
    return [];
  }
}

export function saveImprovementPlan(
  storage: Storage,
  input: Omit<ImprovementPlan, "version" | "id" | "createdAt">,
): ImprovementPlan {
  const plan: ImprovementPlan = {
    ...input,
    version: VERSION,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const previousPlans = readPlans(storage);
  const plansToKeep = input.source === "quality-review"
    ? previousPlans.filter((previousPlan) => !(
        previousPlan.source === "quality-review"
        && isSameTarget(previousPlan.target, input.target)
      ))
    : previousPlans;
  storage.setItem(IMPROVEMENT_PLANS_KEY, JSON.stringify([plan, ...plansToKeep].slice(0, MAX_PLANS)));
  return plan;
}

export function getImprovementPlans(storage: Storage, target: ImprovementTarget): ImprovementPlan[] {
  let qualityPlanIncluded = false;
  return readPlans(storage).filter((plan) => {
    if (!isSameTarget(plan.target, target)) return false;
    if (plan.source !== "quality-review") return true;
    if (qualityPlanIncluded) return false;
    qualityPlanIncluded = true;
    return true;
  });
}

export function removeImprovementPlan(storage: Storage, planId: string): void {
  storage.setItem(IMPROVEMENT_PLANS_KEY, JSON.stringify(readPlans(storage).filter((plan) => plan.id !== planId)));
}

export function storeImprovementPlans(storage: Storage, plans: ImprovementPlan[]): void {
  storage.setItem(IMPROVEMENT_PLANS_KEY, JSON.stringify(plans.slice(0, MAX_PLANS)));
}
