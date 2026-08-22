import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findConceptsByTerm, jobMatchConcepts, validateConceptDictionary } from "../app/job-match/concepts/registry";

assert.deepEqual(validateConceptDictionary(), []);

const sourced = jobMatchConcepts.filter((concept) => concept.sources.length > 0);
assert.equal(sourced.length, 19, "the first ESCO expansion must remain intentionally small");
assert.equal(new Set(sourced.flatMap((concept) => concept.sources.map((source) => source.uri))).size, 19, "ESCO URIs must not be duplicated");

const escoSnapshot = JSON.parse(readFileSync("data/job-match/esco-candidates.json", "utf8")) as {
  candidates: Array<{ status: string; uri?: string }>;
};
assert.equal(escoSnapshot.candidates.length, 19, "the reviewed ESCO snapshot must match the curated expansion");
assert.ok(escoSnapshot.candidates.every((candidate) => candidate.status === "exact" && candidate.uri), "ESCO snapshot candidates must be exact and traceable");

const expectedTerms = [
  ["Java", "en", "software-development", "java"],
  ["gestión de la cadena de suministro", "es", "industrial-engineering", "supply-chain-management"],
  ["organización de viajes", "es", "administration", "travel-arrangements"],
  ["market research", "en", "marketing", "market-research"],
  ["manage contracts", "en", "sales", "contract-management"],
  ["análisis financiero", "es", "accounting", "financial-analysis"],
  ["case escalation", "en", "customer-service", "escalation-procedure"],
  ["motion graphics", "en", "graphic-design", "motion-graphics"],
  ["JavaScript moderno (ES6+)", "es", "software-development", "javascript"],
  ["Zustand", "es", "software-development", "zustand"],
  ["npm/yarn", "es", "software-development", "javascript-package-management"],
  ["librerías como SASS", "es", "software-development", "sass"],
  ["Styled Components", "es", "software-development", "styled-components"],
  ["diseño responsive", "es", "software-development", "responsive-web-design"],
  ["testeable", "es", "software-development", "software-testing"],
] as const;

for (const [term, language, family, expectedId] of expectedTerms) {
  const matches = findConceptsByTerm(term, language, family);
  assert.ok(matches.some((concept) => concept.id === expectedId), `${term} should resolve to ${expectedId}`);
}

console.log(`Validated ${jobMatchConcepts.length} concepts (${sourced.length} sourced from ESCO).`);
