import assert from "node:assert/strict";

import { createStoredCv } from "../app/cv-library";
import { parseBackupFile, serializeBackup } from "../app/cv-portability";
import { createJobApplication } from "../app/job-application";
import { getInitialCv } from "../app/types";

const originalCv = { ...createStoredCv(getInitialCv("es"), "es", "CV original"), id: "cv-original" };
const adaptedCv = { ...createStoredCv(getInitialCv("es"), "es", "CV adaptado"), id: "cv-adapted" };
const application = createJobApplication({
  company: "Empresa Ejemplo",
  role: "Analista",
  cvId: adaptedCv.id,
  sourceCvId: originalCv.id,
});

const restored = parseBackupFile(serializeBackup([originalCv, adaptedCv], [application]), "es");
assert.equal(restored.cvs.length, 2);
assert.equal(restored.applications.length, 1);
assert.equal(restored.missingCvLinks, 0);
assert.notEqual(restored.cvs[0]?.id, originalCv.id);
assert.ok(restored.cvs.some((cv) => cv.id === restored.applications[0]?.cvId));
assert.ok(restored.cvs.some((cv) => cv.id === restored.applications[0]?.sourceCvId));

const legacy = parseBackupFile(JSON.stringify({ format: "cv-simple-backup", version: 1, resumes: [originalCv] }), "es");
assert.equal(legacy.cvs.length, 1);
assert.equal(legacy.applications.length, 0);

const missing = parseBackupFile(serializeBackup([], [{ ...application, cvId: "missing", sourceCvId: null }]), "es");
assert.equal(missing.applications[0]?.cvId, null);
assert.equal(missing.missingCvLinks, 1);

console.log("Backup portability checks passed");
