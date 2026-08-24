import assert from "node:assert/strict";

import { createJobApplication, normalizeJobApplication, updateJobApplication } from "../app/job-application";

assert.throws(() => createJobApplication({ company: "", role: "Developer" }), /company_and_role_required/);

const created = createJobApplication({
  company: "Example Company",
  role: "Frontend Developer",
  description: "Build accessible product interfaces.",
  jobFamily: "software-development",
  cvId: "cv-123",
  sourceCvId: "cv-original",
});
assert.equal(created.status, "saved");
assert.equal(created.cvId, "cv-123");
assert.equal(created.sourceCvId, "cv-original");
assert.equal(created.jobFamily, "software-development");
assert.equal(created.history[0]?.type, "created");

const normalized = normalizeJobApplication({
  ...created,
  status: "unknown",
  description: "x".repeat(20_000),
  selectedImprovements: ["React", "React", "TypeScript"],
  lastAnalysis: { analyzedAt: new Date().toISOString(), score: 140, matchingTerms: ["React"], missingTerms: ["CSS"] },
});
assert.equal(normalized.status, "saved");
assert.equal(normalized.description.length, 16_000);
assert.deepEqual(normalized.selectedImprovements, ["React", "TypeScript"]);
assert.equal(normalized.lastAnalysis?.score, 100);

const updated = updateJobApplication(created, { status: "applied", appliedAt: "2026-08-24" });
assert.equal(updated.id, created.id);
assert.equal(updated.createdAt, created.createdAt);
assert.equal(updated.status, "applied");
assert.equal(updated.appliedAt, "2026-08-24");
assert.ok(updated.updatedAt >= created.updatedAt);

const migrated = normalizeJobApplication({ ...created, schemaVersion: 1, sourceCvId: undefined, history: undefined });
assert.equal(migrated.sourceCvId, null);
assert.equal(migrated.schemaVersion, 3);
assert.equal(migrated.history[0]?.type, "created");

const withEvent = updateJobApplication(created, { status: "interview" }, { type: "status-changed", detail: "", metadata: { from: "saved", to: "interview" } });
assert.equal(withEvent.history.at(-1)?.type, "status-changed");
assert.equal(withEvent.history.at(-1)?.metadata.to, "interview");

const analyzed = updateJobApplication(withEvent, {
  lastAnalysis: { analyzedAt: new Date().toISOString(), score: 62, matchingTerms: ["Excel"], missingTerms: ["Power BI"] },
}, { type: "analysis", detail: "", metadata: { score: 62 } });
const improved = updateJobApplication(analyzed, { selectedImprovements: ["Power BI"] }, { type: "improvements", detail: "", metadata: { count: 1 } });
const adapted = updateJobApplication(improved, { sourceCvId: created.cvId, cvId: "cv-tailored" }, { type: "cv-adapted", detail: "", metadata: { cvId: "cv-tailored", title: "Tailored CV" } });
assert.equal(adapted.sourceCvId, "cv-123");
assert.equal(adapted.cvId, "cv-tailored");
assert.deepEqual(adapted.selectedImprovements, ["Power BI"]);
assert.deepEqual(adapted.history.slice(-3).map((event) => event.type), ["analysis", "improvements", "cv-adapted"]);

let limitedHistory = adapted;
for (let index = 0; index < 60; index += 1) {
  limitedHistory = updateJobApplication(limitedHistory, {}, { type: "note", detail: `Note ${index}`, metadata: {} });
}
assert.equal(limitedHistory.history.length, 50);
assert.equal(limitedHistory.history.at(-1)?.detail, "Note 59");

console.log("Job application model checks passed");
