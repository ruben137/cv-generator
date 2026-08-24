import assert from "node:assert/strict";
import { reviewResumeQuality } from "../app/resume-review/engine";
import { getInitialCv } from "../app/types";

const strongCv = getInitialCv("es");
strongCv.headline = "Analista de marketing digital";
strongCv.summary = "Profesional de marketing digital con experiencia en campañas de adquisición, medición de resultados y coordinación de contenidos. Me especializo en convertir datos de rendimiento en mejoras concretas para el negocio, colaborando con equipos comerciales y creativos para alcanzar objetivos medibles de crecimiento.";
strongCv.skills = ["Google Ads", "SEO", "Excel", "Análisis de datos", "Marketing digital"].map((name) => ({ name }));
strongCv.experiences = [{ company: "Empresa", role: "Analista", location: "Remoto", start: "2022", end: "2026", bullets: ["Aumenté en 24% las conversiones mediante la optimización de campañas en Google Ads.", "Implementé análisis de datos en Excel para mejorar los reportes de marketing digital y SEO."] }];
const strong = reviewResumeQuality(strongCv);
assert.ok(strong.percentage >= 70, `Expected a useful resume to pass most checks, received ${strong.percentage}`);
assert.equal(strong.checks.find((check) => check.id === "metrics")?.status, "passed");
assert.equal(strong.checks.find((check) => check.id === "actionVerbs")?.status, "passed");

const contextualMetricsCv = getInitialCv("es");
contextualMetricsCv.experiences = [{
  company: "Empresa",
  role: "Coordinador",
  location: "Remoto",
  start: "2022",
  end: "2026",
  bullets: [
    "Coordiné 5 proyectos para clientes de distintos mercados.",
    "Reduje el tiempo de respuesta a menos de 3 días.",
    "Documenté procesos internos para facilitar el trabajo del equipo.",
  ],
}];
const contextualMetrics = reviewResumeQuality(contextualMetricsCv);
const metricsCheck = contextualMetrics.checks.find((check) => check.id === "metrics");
const verbsCheck = contextualMetrics.checks.find((check) => check.id === "actionVerbs");
assert.equal(metricsCheck?.status, "passed");
assert.equal(metricsCheck?.matched, 2);
assert.equal(verbsCheck?.status, "passed");
assert.equal(verbsCheck?.matched, 3);

const groupedSkillsCv = getInitialCv("en");
groupedSkillsCv.skills = [
  { name: "Frontend: React, Next.js, JavaScript, TypeScript" },
  { name: "Backend: Node.js, PostgreSQL" },
];
groupedSkillsCv.experiences = [{
  company: "Company",
  role: "Developer",
  location: "Remote",
  start: "2022",
  end: "2026",
  bullets: [
    "Developed interfaces with ReactJS, NextJS, JavaScript and TypeScript.",
    "Built services with NodeJS and PostgreSQL.",
  ],
}];
const groupedSkillsReview = reviewResumeQuality(groupedSkillsCv);
const groupedSkillsEvidence = groupedSkillsReview.checks.find((check) => check.id === "skillEvidence");
assert.equal(groupedSkillsEvidence?.matched, 6);
assert.equal(groupedSkillsEvidence?.total, 6);
assert.deepEqual(groupedSkillsEvidence?.values, []);
assert.equal(groupedSkillsEvidence?.status, "passed");

const weakCv = getInitialCv("es");
Object.assign(weakCv, { headline: "", summary: "Perfil.", phone: "", email: "", portfolio: "", skills: [{ name: "Excel" }], experiences: [] });
const weak = reviewResumeQuality(weakCv);
assert.ok(weak.percentage < strong.percentage);
assert.ok(weak.warnings >= 6);
console.log("Resume quality checks passed");
