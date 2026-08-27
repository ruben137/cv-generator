import type { JobFamily, JobMatchLanguage, MatchConcept } from "../model";
import { normalizeText } from "../normalization";
import { accountingConcepts } from "./accounting";
import { administrationConcepts } from "./administration";
import { customerServiceConcepts } from "./customer-service";
import { escoCuratedConcepts } from "./esco-curated";
import { graphicDesignConcepts } from "./graphic-design";
import { industrialEngineeringConcepts } from "./industrial-engineering";
import { marketingConcepts } from "./marketing";
import { nursingConcepts } from "./nursing";
import { receptionConcepts } from "./reception";
import { teachingConcepts } from "./teaching";
import { salesConcepts } from "./sales";
import { sharedConcepts } from "./shared";
import { softwareDevelopmentConcepts } from "./software-development";

export const professionalConcepts: Record<Exclude<JobFamily, "general">, readonly MatchConcept[]> = {
  "software-development": [...softwareDevelopmentConcepts, ...(escoCuratedConcepts["software-development"] ?? [])],
  "industrial-engineering": [...industrialEngineeringConcepts, ...(escoCuratedConcepts["industrial-engineering"] ?? [])],
  administration: [...administrationConcepts, ...(escoCuratedConcepts.administration ?? [])],
  marketing: [...marketingConcepts, ...(escoCuratedConcepts.marketing ?? [])],
  sales: [...salesConcepts, ...(escoCuratedConcepts.sales ?? [])],
  accounting: [...accountingConcepts, ...(escoCuratedConcepts.accounting ?? [])],
  "customer-service": [...customerServiceConcepts, ...(escoCuratedConcepts["customer-service"] ?? [])],
  "graphic-design": [...graphicDesignConcepts, ...(escoCuratedConcepts["graphic-design"] ?? [])],
  nursing: [...nursingConcepts, ...(escoCuratedConcepts.nursing ?? [])],
  reception: [...receptionConcepts, ...(escoCuratedConcepts.reception ?? [])],
  teaching: [...teachingConcepts, ...(escoCuratedConcepts.teaching ?? [])],
};

export const jobMatchConcepts: readonly MatchConcept[] = [
  ...sharedConcepts,
  ...Object.values(professionalConcepts).flat(),
];

export function getConceptsForJobFamily(jobFamily: JobFamily): MatchConcept[] {
  const shared = sharedConcepts.filter((item) => item.jobFamilies.includes("general") || item.jobFamilies.includes(jobFamily));
  return jobFamily === "general" ? [...shared] : [...shared, ...professionalConcepts[jobFamily]];
}

export function findConceptsByTerm(term: string, language?: JobMatchLanguage, jobFamily: JobFamily = "general"): MatchConcept[] {
  const normalized = normalizeText(term);
  return getConceptsForJobFamily(jobFamily).filter((item) => item.aliases.some((alias) =>
    (!language || alias.locale === language) && normalizeText(alias.value) === normalized,
  ));
}

export type ConceptDictionaryIssue = {
  conceptId: string;
  code: "duplicate-id" | "missing-label" | "empty-alias" | "invalid-confidence" | "missing-relation-target" | "invalid-source";
  detail: string;
};

export function validateConceptDictionary(concepts: readonly MatchConcept[] = jobMatchConcepts): ConceptDictionaryIssue[] {
  const issues: ConceptDictionaryIssue[] = [];
  const ids = new Set<string>();
  const allIds = new Set(concepts.map((item) => item.id));

  for (const item of concepts) {
    if (ids.has(item.id)) issues.push({ conceptId: item.id, code: "duplicate-id", detail: item.id });
    ids.add(item.id);
    if (!item.labels.es || !item.labels.en) issues.push({ conceptId: item.id, code: "missing-label", detail: "es/en" });
    for (const alias of item.aliases) {
      if (!normalizeText(alias.value)) issues.push({ conceptId: item.id, code: "empty-alias", detail: alias.value });
    }
    for (const relation of item.relations) {
      if (relation.confidence < 0 || relation.confidence > 1) issues.push({ conceptId: item.id, code: "invalid-confidence", detail: String(relation.confidence) });
      if (!allIds.has(relation.targetConceptId)) issues.push({ conceptId: item.id, code: "missing-relation-target", detail: relation.targetConceptId });
    }
    for (const source of item.sources) {
      if (!/^https?:\/\//.test(source.uri)) issues.push({ conceptId: item.id, code: "invalid-source", detail: source.uri });
    }
  }
  return issues;
}
