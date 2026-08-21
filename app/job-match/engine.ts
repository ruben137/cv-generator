import { getConceptsForJobFamily } from "./concepts";
import { extractExplicitRequirements, extractJobTerms } from "./extraction";
import {
  defaultMatchConfidence,
  JOB_MATCH_SCHEMA_VERSION,
  type AnalysisRecommendation,
  type ExtractedTerm,
  type JobDescriptionInput,
  type JobMatchAnalysis,
  type MatchConcept,
  type MatchEvidence,
  type MatchType,
  type RequirementLevel,
  type ResumeMatchInput,
  type TermSource,
  type UnclassifiedTerm,
} from "./model";
import { calculateJobMatchScore } from "./scoring";
import { containsExactTerm, countExactTermOccurrences, isStopWord, normalizeText, tokenize } from "./normalization";
import { isApproximateSpellingMatch } from "./similarity";

type LocatedConcept = {
  concept: MatchConcept;
  term: ExtractedTerm;
  matchedAlias: string;
};

type AnalysisOptions = { now?: () => Date };

function resumeSections(resume: ResumeMatchInput): Array<readonly [TermSource, string]> {
  return [
    ["resume-title", resume.title],
    ["resume-summary", resume.summary],
    ...resume.skills.map((value) => ["resume-skill", value] as const),
    ...resume.experience.map((value) => ["resume-experience", value] as const),
    ...resume.education.map((value) => ["resume-education", value] as const),
    ...resume.certifications.map((value) => ["resume-certification", value] as const),
    ...resume.languages.map((value) => ["resume-language", value] as const),
  ];
}

function requirementForConcept(concept: MatchConcept, explicit: ExtractedTerm[]): RequirementLevel {
  let result: RequirementLevel = "unknown";
  for (const requirement of explicit) {
    const matches = concept.aliases.some((alias) =>
      containsExactTerm(requirement.original, alias.value) || containsExactTerm(alias.value, requirement.original),
    );
    if (!matches) continue;
    if (requirement.requirementLevel === "required") return "required";
    if (requirement.requirementLevel === "preferred") result = "preferred";
  }
  return result;
}

function locateJobConcepts(input: JobDescriptionInput, concepts: MatchConcept[]): LocatedConcept[] {
  const explicit = extractExplicitRequirements(input);
  const results: LocatedConcept[] = [];
  for (const concept of concepts) {
    let best: LocatedConcept | undefined;
    for (const alias of concept.aliases.filter((item) => item.locale === input.language)) {
      const titleFrequency = countExactTermOccurrences(input.title, alias.value);
      const descriptionFrequency = countExactTermOccurrences(input.text, alias.value);
      const frequency = titleFrequency + descriptionFrequency;
      if (!frequency || (best && best.term.frequency >= frequency)) continue;
      best = {
        concept,
        matchedAlias: alias.value,
        term: {
          original: alias.value,
          normalized: normalizeText(alias.value),
          source: titleFrequency ? "job-title" : "job-description",
          frequency,
          conceptId: concept.id,
          category: concept.category,
          requirementLevel: requirementForConcept(concept, explicit),
        },
      };
    }
    if (best) results.push(best);
  }
  return results;
}

function locateResumeConcepts(resume: ResumeMatchInput, concepts: MatchConcept[]): LocatedConcept[] {
  const sections = resumeSections(resume);
  const sourcePriority: Partial<Record<TermSource, number>> = {
    "resume-experience": 2,
    "resume-skill": 1,
  };
  const results: LocatedConcept[] = [];
  for (const concept of concepts) {
    let best: LocatedConcept | undefined;
    for (const alias of concept.aliases) {
      for (const [source, value] of sections) {
        const frequency = countExactTermOccurrences(value, alias.value);
        const currentPriority = sourcePriority[source] ?? 0;
        const bestPriority = best ? sourcePriority[best.term.source] ?? 0 : -1;
        if (!frequency || (best && (best.term.frequency > frequency || (best.term.frequency === frequency && bestPriority >= currentPriority)))) continue;
        best = {
          concept,
          matchedAlias: alias.value,
          term: { original: alias.value, normalized: normalizeText(alias.value), source, frequency, conceptId: concept.id, category: concept.category },
        };
      }
    }
    if (best) results.push(best);
  }
  return results;
}

function findRelatedResumeConcept(job: LocatedConcept, resumeConcepts: LocatedConcept[]): { located: LocatedConcept; confidence: number; relation: NonNullable<MatchEvidence["relation"]> } | undefined {
  for (const relation of job.concept.relations) {
    const located = resumeConcepts.find((item) => item.concept.id === relation.targetConceptId);
    if (located) return { located, confidence: relation.confidence, relation: relation.kind };
  }
  for (const located of resumeConcepts) {
    const inverse = located.concept.relations.find((relation) => relation.targetConceptId === job.concept.id);
    if (inverse) return { located, confidence: inverse.confidence, relation: inverse.kind };
  }
  return undefined;
}

function compareConcepts(jobConcepts: LocatedConcept[], resumeConcepts: LocatedConcept[]): { matches: MatchEvidence[]; missing: LocatedConcept[] } {
  const matches: MatchEvidence[] = [];
  const missing: LocatedConcept[] = [];
  for (const job of jobConcepts) {
    const sameConcept = resumeConcepts.find((item) => item.concept.id === job.concept.id);
    if (sameConcept) {
      const matchType: MatchType = job.term.normalized === sameConcept.term.normalized ? "exact" : "alias";
      matches.push({
        jobTerm: job.term,
        resumeTerm: sameConcept.term,
        matchType,
        confidence: defaultMatchConfidence[matchType],
        conceptId: job.concept.id,
        explanationKey: `jobMatch.match.${matchType}`,
      });
      continue;
    }
    const related = findRelatedResumeConcept(job, resumeConcepts);
    if (related) {
      matches.push({
        jobTerm: job.term,
        resumeTerm: related.located.term,
        matchType: "related",
        confidence: related.confidence,
        conceptId: job.concept.id,
        relation: related.relation,
        explanationKey: "jobMatch.match.related",
      });
      if ((job.concept.category === "tool" && related.located.concept.category !== "tool") || related.confidence < 0.75) missing.push(job);
    } else {
      missing.push(job);
    }
  }
  return { matches, missing };
}

function resumeText(resume: ResumeMatchInput): string {
  return [resume.title, resume.summary, ...resume.skills, ...resume.experience, ...resume.education, ...resume.certifications, ...resume.languages].join("\n");
}

function meaningfulTitleCoverage(jobTitle: string, resumeTitle: string, language: JobDescriptionInput["language"]): number {
  const roleTokens: Record<string, string> = {
    desarrollador: "developer",
    desarrolladora: "developer",
    programador: "developer",
    programadora: "developer",
    engineer: "developer",
    ingeniero: "developer",
    ingeniera: "developer",
  };
  const comparableTokens = (value: string) => tokenize(value).map((token) => roleTokens[token] ?? token);
  const jobTokens = [...new Set(comparableTokens(jobTitle).filter((token) => token.length > 1 && !isStopWord(token, language)))];
  if (!jobTokens.length) return 0;
  const resumeTokens = comparableTokens(resumeTitle);
  const matched = jobTokens.filter((token) => resumeTokens.includes(token) || resumeTokens.some((candidate) => isApproximateSpellingMatch(token, candidate)));
  return matched.length / jobTokens.length;
}

function keywordAnalysis(jobTerms: ExtractedTerm[], resume: ResumeMatchInput) {
  const fullResume = resumeText(resume);
  const candidates = jobTerms.filter((term) => term.normalized.length >= 3);
  const matched: MatchEvidence[] = [];
  const unclassified: UnclassifiedTerm[] = [];
  let matchedWeight = 0;
  let totalWeight = 0;

  for (const term of candidates) {
    const weight = Math.max(1, term.frequency);
    totalWeight += weight;
    if (containsExactTerm(fullResume, term.normalized)) {
      matchedWeight += weight;
      matched.push({ jobTerm: term, resumeTerm: { ...term, source: "resume-summary" }, matchType: "exact", confidence: 1, explanationKey: "jobMatch.match.exactKeyword" });
      continue;
    }
    const jobTokens = tokenize(term.normalized);
    const approximate = jobTokens.length === 1 && tokenize(fullResume).find((candidate) => isApproximateSpellingMatch(term.normalized, candidate));
    if (approximate) {
      matchedWeight += weight * defaultMatchConfidence.approximate;
      matched.push({
        jobTerm: term,
        resumeTerm: { original: approximate, normalized: approximate, source: "resume-summary", frequency: 1 },
        matchType: "approximate",
        confidence: defaultMatchConfidence.approximate,
        explanationKey: "jobMatch.match.approximateSpelling",
      });
    } else {
      unclassified.push({ term, reason: "unknown-concept" });
    }
  }
  return { coverage: totalWeight ? matchedWeight / totalWeight : 0, matches: matched, unclassified };
}

function buildRecommendations(
  missing: LocatedConcept[],
  matches: MatchEvidence[],
  titleCoverage: number,
  resume: ResumeMatchInput,
): AnalysisRecommendation[] {
  const recommendations: AnalysisRecommendation[] = missing.slice(0, 8).map((item) => ({
    id: `review-${item.concept.id}`,
    kind: "review-skill",
    priority: item.term.requirementLevel === "required" ? "high" : item.term.requirementLevel === "preferred" ? "medium" : "low",
    messageKey: "jobMatch.recommendation.reviewMissingSkill",
    relatedTerms: [item.term.original],
  }));
  if (titleCoverage < 0.5) recommendations.push({ id: "review-title", kind: "review-title", priority: "medium", messageKey: "jobMatch.recommendation.reviewTitle", relatedTerms: [] });
  const withoutEvidence = matches.filter((match) => match.resumeTerm && match.resumeTerm.source !== "resume-experience" && match.conceptId);
  if (withoutEvidence.length) recommendations.push({ id: "add-evidence", kind: "add-evidence", priority: "medium", messageKey: "jobMatch.recommendation.addEvidence", relatedTerms: withoutEvidence.slice(0, 5).map((item) => item.jobTerm.original) });
  if (!resume.experience.some((item) => /\b\d+(?:[.,]\d+)?\s*(?:%|x|k|m|usd|eur|€|\$)?\b/i.test(item))) {
    recommendations.push({ id: "quantify-achievements", kind: "quantify-achievement", priority: "low", messageKey: "jobMatch.recommendation.quantifyAchievements", relatedTerms: [] });
  }
  return recommendations;
}

export function analyzeJobMatch(
  job: JobDescriptionInput,
  resume: ResumeMatchInput,
  options: AnalysisOptions = {},
): JobMatchAnalysis {
  const concepts = getConceptsForJobFamily(job.jobFamily);
  const jobConcepts = locateJobConcepts(job, concepts);
  const resumeConcepts = locateResumeConcepts(resume, concepts);
  const comparison = compareConcepts(jobConcepts, resumeConcepts);
  const extractedJobTerms = extractJobTerms(job);
  const keywordTerms = extractedJobTerms.filter((term) =>
    !jobConcepts.some((item) =>
      item.concept.aliases.some((alias) => containsExactTerm(term.normalized, alias.value)),
    ),
  ).filter((term) => tokenize(term.normalized).length <= 3 && !/^(?:experiencia|experience)\b/.test(term.normalized));
  const keywords = keywordAnalysis(keywordTerms, resume);
  const titleCoverage = meaningfulTitleCoverage(job.title, resume.title, job.language);
  const skillWeight = (level?: RequirementLevel) => level === "required" ? 1.5 : level === "preferred" ? 0.75 : 1;
  const skillTotal = jobConcepts.reduce((total, item) => total + skillWeight(item.term.requirementLevel), 0);
  const skillMatched = comparison.matches.reduce((total, match) => total + match.confidence * skillWeight(match.jobTerm.requirementLevel), 0);
  const evidenceMatches = comparison.matches.filter((match) => match.resumeTerm?.source === "resume-experience");
  const evidenceCoverage = comparison.matches.length ? evidenceMatches.length / comparison.matches.length : 0;
  const score = calculateJobMatchScore(
    {
      skills: skillTotal ? skillMatched / skillTotal : 0,
      keywords: keywords.coverage,
      title: titleCoverage,
      evidence: evidenceCoverage,
    },
    undefined,
    {
      skills: jobConcepts.length > 0,
      keywords: keywordTerms.length > 0,
      title: tokenize(job.title).length > 0 && tokenize(resume.title).length > 0,
      evidence: jobConcepts.length > 0 && resume.experience.some((item) => item.trim().length > 0),
    },
  );

  return {
    schemaVersion: JOB_MATCH_SCHEMA_VERSION,
    analyzedAt: (options.now?.() ?? new Date()).toISOString(),
    inputLanguage: job.language,
    jobFamily: job.jobFamily,
    score,
    matches: [...comparison.matches, ...keywords.matches],
    missingRequirements: comparison.missing.map((item) => ({
      term: item.term,
      level: item.term.requirementLevel ?? "unknown",
      recommendationKey: "jobMatch.recommendation.reviewMissingSkill",
    })),
    unclassifiedTerms: keywords.unclassified.slice(0, 20),
    recommendations: buildRecommendations(comparison.missing, comparison.matches, titleCoverage, resume),
  };
}
