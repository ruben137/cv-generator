export const jobMatchLanguages = ["es", "en"] as const;
export type JobMatchLanguage = (typeof jobMatchLanguages)[number];

export const jobFamilies = [
  "general",
  "software-development",
  "industrial-engineering",
  "administration",
  "marketing",
  "sales",
  "accounting",
  "customer-service",
  "graphic-design",
] as const;
export type JobFamily = (typeof jobFamilies)[number];

export const termCategories = [
  "skill",
  "tool",
  "methodology",
  "language",
  "certification",
  "responsibility",
  "industry",
] as const;
export type TermCategory = (typeof termCategories)[number];

export type LocalizedLabel = Partial<Record<JobMatchLanguage, string>>;

export type ConceptAlias = {
  value: string;
  locale: JobMatchLanguage;
  /** Abbreviations are aliases, but remain identifiable in the analysis evidence. */
  kind: "name" | "abbreviation" | "spelling-variant";
};

export type ConceptRelation = {
  targetConceptId: string;
  /** A related tool or methodology is evidence, not an exact synonym. */
  kind: "uses-tool" | "uses-methodology" | "broader" | "narrower" | "related";
  confidence: number;
};

export type MatchConcept = {
  /** Stable, language-independent identifier, for example `continuous-improvement`. */
  id: string;
  category: TermCategory;
  labels: LocalizedLabel;
  aliases: ConceptAlias[];
  relations: ConceptRelation[];
  jobFamilies: JobFamily[];
};

export const requirementLevels = ["required", "preferred", "unknown"] as const;
export type RequirementLevel = (typeof requirementLevels)[number];

export type JobDescriptionInput = {
  title: string;
  text: string;
  language: JobMatchLanguage;
  jobFamily: JobFamily;
};

/** A UI-independent projection of a CV. An adapter from CvData will be added later. */
export type ResumeMatchInput = {
  title: string;
  summary: string;
  skills: string[];
  experience: string[];
  education: string[];
  certifications: string[];
  languages: string[];
};

export type TermSource =
  | "job-title"
  | "job-description"
  | "resume-title"
  | "resume-summary"
  | "resume-skill"
  | "resume-experience"
  | "resume-education"
  | "resume-certification"
  | "resume-language";

export type ExtractedTerm = {
  original: string;
  normalized: string;
  source: TermSource;
  frequency: number;
  conceptId?: string;
  category?: TermCategory;
  requirementLevel?: RequirementLevel;
};

export const matchTypes = [
  "exact",
  "alias",
  "related",
  "approximate",
  "user-confirmed",
  "unclassified",
] as const;
export type MatchType = (typeof matchTypes)[number];

export const defaultMatchConfidence: Record<MatchType, number> = {
  exact: 1,
  alias: 0.9,
  "user-confirmed": 0.9,
  related: 0.65,
  approximate: 0.5,
  unclassified: 0,
};

export type MatchEvidence = {
  jobTerm: ExtractedTerm;
  resumeTerm?: ExtractedTerm;
  matchType: MatchType;
  /** Always between 0 and 1. It affects the score and must be shown in the UI. */
  confidence: number;
  conceptId?: string;
  relation?: ConceptRelation["kind"];
  explanationKey: string;
};

export type MissingRequirement = {
  term: ExtractedTerm;
  level: RequirementLevel;
  /** Suggestions must never claim the user possesses a missing skill. */
  recommendationKey: string;
};

export type UnclassifiedTerm = {
  term: ExtractedTerm;
  reason: "unknown-concept" | "ambiguous" | "insufficient-context";
};

export type AnalysisRecommendation = {
  id: string;
  kind: "review-skill" | "add-evidence" | "review-title" | "quantify-achievement" | "manual-review";
  priority: "high" | "medium" | "low";
  messageKey: string;
  relatedTerms: string[];
};

export type JobMatchScoreComponentId = "skills" | "keywords" | "title" | "evidence";

export type JobMatchScoreComponent = {
  id: JobMatchScoreComponentId;
  /** False when the input does not contain enough information to evaluate this component. */
  available: boolean;
  /** Raw coverage between 0 and 1 before applying the component weight. */
  coverage: number;
  weight: number;
  weightedPoints: number;
};

export type JobMatchScore = {
  /** An explainable match percentage, never an ATS score. */
  percentage: number;
  components: JobMatchScoreComponent[];
  disclaimerKey: "jobMatch.scoreDisclaimer";
};

export const JOB_MATCH_SCHEMA_VERSION = 1 as const;

export type JobMatchAnalysis = {
  schemaVersion: typeof JOB_MATCH_SCHEMA_VERSION;
  analyzedAt: string;
  inputLanguage: JobMatchLanguage;
  jobFamily: JobFamily;
  score: JobMatchScore;
  matches: MatchEvidence[];
  missingRequirements: MissingRequirement[];
  unclassifiedTerms: UnclassifiedTerm[];
  recommendations: AnalysisRecommendation[];
};
