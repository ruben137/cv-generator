import type { JobMatchScore, JobMatchScoreComponentId } from "./model";

export const defaultScoreWeights: Record<JobMatchScoreComponentId, number> = {
  skills: 0.45,
  keywords: 0.25,
  title: 0.15,
  evidence: 0.15,
};

export type JobMatchCoverage = Record<JobMatchScoreComponentId, number>;
export type JobMatchAvailability = Record<JobMatchScoreComponentId, boolean>;

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function calculateJobMatchScore(
  coverage: JobMatchCoverage,
  weights: Record<JobMatchScoreComponentId, number> = defaultScoreWeights,
  availability: JobMatchAvailability = {
    skills: true,
    keywords: true,
    title: true,
    evidence: true,
  },
): JobMatchScore {
  const ids = Object.keys(defaultScoreWeights) as JobMatchScoreComponentId[];
  const totalWeight = ids.reduce(
    (total, id) => total + (availability[id] ? Math.max(0, weights[id]) : 0),
    0,
  );

  const components = ids.map((id) => {
    const available = availability[id];
    const normalizedWeight = available && totalWeight > 0 ? Math.max(0, weights[id]) / totalWeight : 0;
    const normalizedCoverage = clamp(coverage[id]);
    return {
      id,
      available,
      coverage: normalizedCoverage,
      weight: normalizedWeight,
      weightedPoints: normalizedCoverage * normalizedWeight * 100,
    };
  });

  return {
    percentage: Math.round(components.reduce((total, component) => total + component.weightedPoints, 0)),
    components,
    disclaimerKey: "jobMatch.scoreDisclaimer",
  };
}
