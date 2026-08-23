import assert from "node:assert/strict";
import { cvDataToMatchInput } from "../app/job-match/cv-adapter";
import { analyzeJobMatch } from "../app/job-match/engine";
import { getInitialCv } from "../app/types";

const cv = getInitialCv("es");
cv.headline = "Desarrollador frontend";
cv.skills = [{ name: "React" }, { name: "TypeScript" }];
cv.experiences = [{ company: "Empresa", role: "Desarrollador frontend", location: "Remoto", start: "2023", end: "Actualidad", bullets: ["Coordiné entregas con el equipo de producto."] }];
const resume = cvDataToMatchInput(cv);
assert.equal(resume.source, "structured");
assert.ok(resume.experienceContext?.some((item) => item.includes("Empresa")));
assert.ok(!resume.experience.some((item) => item.includes("Empresa")), "Company metadata must not be treated as achievement evidence");

const job = { title: "Desarrollador React", text: "Buscamos experiencia obligatoria con React y TypeScript para desarrollar aplicaciones web.", language: "es" as const, jobFamily: "software-development" as const };
const analysisWithoutEvidence = analyzeJobMatch(job, resume, { now: () => new Date("2026-01-01") });
const reactWithoutEvidence = analysisWithoutEvidence.matches.find((match) => match.conceptId === "react");
assert.equal(reactWithoutEvidence?.resumeTerm?.source, "resume-skill");

cv.experiences[0].bullets.push("Desarrollé interfaces en React y TypeScript para aplicaciones web.");
const analysisWithEvidence = analyzeJobMatch(job, cvDataToMatchInput(cv), { now: () => new Date("2026-01-01") });
const reactWithEvidence = analysisWithEvidence.matches.find((match) => match.conceptId === "react");
assert.equal(reactWithEvidence?.resumeTerm?.source, "resume-experience");
assert.ok(analysisWithEvidence.score.components.find((item) => item.id === "evidence")!.coverage > analysisWithoutEvidence.score.components.find((item) => item.id === "evidence")!.coverage);
console.log("Structured job match checks passed");
