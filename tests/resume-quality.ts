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

const weakCv = getInitialCv("es");
Object.assign(weakCv, { headline: "", summary: "Perfil.", phone: "", email: "", portfolio: "", skills: [{ name: "Excel" }], experiences: [] });
const weak = reviewResumeQuality(weakCv);
assert.ok(weak.percentage < strong.percentage);
assert.ok(weak.warnings >= 6);
console.log("Resume quality checks passed");
