import assert from "node:assert/strict";
import { analyzeJobMatch } from "../app/job-match/engine";
import { findConceptsByTerm, validateConceptDictionary } from "../app/job-match/concepts/registry";
import type { JobDescriptionInput, JobFamily, ResumeMatchInput } from "../app/job-match/model";

type Case = {
  area: JobFamily;
  source: string;
  job: JobDescriptionInput;
  strong: ResumeMatchInput;
  partial: ResumeMatchInput;
  unrelated: ResumeMatchInput;
};

const resume = (title: string, skills: string[], experience: string[]): ResumeMatchInput => ({
  title,
  summary: `Professional with experience in ${skills.join(", ")}.`,
  skills,
  experience,
  education: [],
  certifications: [],
  languages: ["English"],
});

const unrelated = resume(
  "Hospitality Assistant",
  ["food preparation", "cash handling"],
  ["Served customers and prepared daily orders."],
);

// Requirements are concise paraphrases of public vacancies, captured on 2026-08-21.
// The test stays deterministic and does not download or reproduce the postings.
const cases: Case[] = [
  {
    area: "software-development",
    source: "https://jobs.lever.co/intropic/6d0617f1-f846-438c-ab87-e958f6925a6f",
    job: { title: "Full-stack Engineer", language: "en", jobFamily: "software-development", text: "Requirements: Python backend services. React and TypeScript frontend applications. AWS deployments. Git, CI/CD, automated testing and Docker. Strong communication." },
    strong: resume("Full-stack Engineer", ["Python", "React", "TypeScript", "AWS", "Git", "CI/CD", "software testing", "Docker", "communication"], ["Built Python APIs and React TypeScript products; deployed them to AWS with Docker and CI/CD, improving release time by 40%."]),
    partial: resume("Frontend Developer", ["React", "TypeScript", "Git"], ["Built React interfaces and reviewed code with Git."]),
    unrelated,
  },
  {
    area: "industrial-engineering",
    source: "https://jobs.lever.co/brightmachines/47620a6b-a8d4-4e4d-bc87-8f3b276771fb",
    job: { title: "Continuous Improvement Engineer", language: "en", jobFamily: "industrial-engineering", text: "Requirements: Lean manufacturing, continuous improvement, Kaizen, 5S, value stream mapping, root cause analysis, manufacturing KPIs and Six Sigma. Communication and cross-functional leadership." },
    strong: resume("Continuous Improvement Engineer", ["Lean Manufacturing", "continuous improvement", "Kaizen", "5S", "value stream mapping", "root cause analysis", "KPI", "Six Sigma", "communication", "leadership"], ["Led cross-functional Lean Six Sigma, 5S and Kaizen improvements; communicated manufacturing KPIs and used value stream mapping and root cause analysis to reduce production waste by 18%."]),
    partial: resume("Industrial Engineer", ["continuous improvement", "KPI", "quality management"], ["Analyzed production processes and quality indicators."]),
    unrelated,
  },
  {
    area: "marketing",
    source: "https://jobs.lever.co/webfx/716efddf-dbb2-4c7c-a343-9cb023f59a13",
    job: { title: "Digital Marketing Specialist", language: "en", jobFamily: "marketing", text: "Requirements: digital marketing, SEO strategy, PPC campaigns, content strategy, email marketing, Google Analytics, campaign reporting and keyword research. Excel and communication." },
    strong: resume("Digital Marketing Specialist", ["digital marketing", "SEO", "campaign management", "content marketing", "email marketing", "Google Analytics", "Excel", "communication"], ["Managed SEO, paid and email campaigns in Google Analytics, increasing conversions by 25%."]),
    partial: resume("Content Marketer", ["content marketing", "SEO", "social media"], ["Created SEO content and social campaigns."]),
    unrelated,
  },
  {
    area: "accounting",
    source: "https://boards.greenhouse.io/embed/job_app?token=4928312008",
    job: { title: "Staff Accountant", language: "en", jobFamily: "accounting", text: "Requirements: accounting, journal and ledger entries, financial reporting, GAAP, bank and balance sheet reconciliations, payroll analysis, Excel, attention to detail and problem solving." },
    strong: resume("Staff Accountant", ["accounting", "bookkeeping", "GAAP", "financial reporting", "bank reconciliation", "account reconciliation", "payroll accounting", "Excel", "attention to detail", "problem solving"], ["Prepared journal entries and financial reports under GAAP; reconciled bank and balance sheet accounts and analyzed payroll, reducing discrepancies by 30%."]),
    partial: resume("Accounting Assistant", ["accounting", "bookkeeping", "Excel"], ["Recorded monthly accounting entries in Excel."]),
    unrelated,
  },
  {
    area: "sales",
    source: "https://jobs.lever.co/bigblue/c07d8efa-19b9-4a79-b191-3076fcdea654",
    job: { title: "Senior Account Executive", language: "en", jobFamily: "sales", text: "Requirements: B2B sales, account management, prospecting, full sales cycle, consultative selling, negotiation and closing, sales quotas, CRM pipeline, forecasting, communication and presentation." },
    strong: resume("Senior Account Executive", ["sales management", "account management", "customer prospecting", "negotiation", "sales quota", "CRM", "communication"], ["Owned full sales cycles, managed CRM pipeline and exceeded annual quota by 22%."]),
    partial: resume("Sales Representative", ["customer prospecting", "CRM", "communication"], ["Prospected customers and maintained CRM records."]),
    unrelated,
  },
  {
    area: "customer-service",
    source: "https://jobs.lever.co/fullscript/da2f1ff4-5110-4975-9aa7-e2a5f0892bd8",
    job: { title: "Customer Support Specialist", language: "en", jobFamily: "customer-service", text: "Requirements: customer support, issue resolution, ticket management, Zendesk, active listening, communication, teamwork and adaptability." },
    strong: resume("Customer Support Specialist", ["customer support", "issue resolution", "ticketing systems", "active listening", "communication", "teamwork", "adaptability"], ["Resolved support tickets in Zendesk and maintained 94% customer satisfaction."]),
    partial: resume("Customer Service Agent", ["customer service", "communication", "active listening"], ["Answered customer questions and escalated complex cases."]),
    unrelated,
  },
  {
    area: "administration",
    source: "https://jobs.lever.co/t5datacenters/3aced2af-2153-4430-8fb7-857382d24b02",
    job: { title: "Administrative Assistant", language: "en", jobFamily: "administration", text: "Requirements: administrative support, calendar management, scheduling, meeting coordination, document management, expense reports, Microsoft Office, Excel, organization, communication and time management." },
    strong: resume("Administrative Assistant", ["administrative support", "calendar management", "document management", "Microsoft Office", "Excel", "organization", "communication", "time management"], ["Managed executive calendars, meetings, documents and expense reports for two departments."]),
    partial: resume("Office Assistant", ["Microsoft Office", "document management", "organization"], ["Organized documents and updated Excel records."]),
    unrelated,
  },
  {
    area: "graphic-design",
    source: "https://jobs.lever.co/terrahq/cdaa5f52-8ff7-43c6-b0a2-2e651de90a8c",
    job: { title: "Senior Graphic Designer", language: "en", jobFamily: "graphic-design", text: "Requirements: graphic design portfolio, branding, Adobe Photoshop, Illustrator and InDesign, Figma, typography, color, layout and composition. Organization, attention to detail and communication." },
    strong: resume("Senior Graphic Designer", ["graphic design", "branding", "Adobe Photoshop", "Adobe Illustrator", "Figma", "typography", "layout design", "organization", "attention to detail", "communication"], ["Designed brand systems and digital campaigns in Photoshop, Illustrator and Figma, improving delivery time by 20%."]),
    partial: resume("Graphic Designer", ["graphic design", "Adobe Photoshop", "typography"], ["Created social media graphics in Photoshop."]),
    unrelated,
  },
  {
    area: "nursing",
    source: "curated bilingual nursing vacancy sample",
    job: { title: "Registered Nurse", language: "en", jobFamily: "nursing", text: "Requirements: registered nurse license, nursing care, patient assessment, vital signs monitoring, medication administration, clinical documentation, infection control, wound care, patient education, clinical handoff and CPR." },
    strong: resume("Registered Nurse", ["registered nurse", "nursing care", "patient assessment", "vital signs", "medication administration", "clinical records", "infection control", "wound care", "patient education", "CPR"], ["Provided nursing care, assessed patients, monitored vital signs and administered medications while maintaining accurate clinical records and infection control protocols."]),
    partial: resume("Nurse", ["nursing care", "vital signs", "patient education"], ["Provided daily patient care and monitored vital signs."]),
    unrelated,
  },
  {
    area: "reception",
    source: "curated bilingual receptionist vacancy sample",
    job: { title: "Receptionist", language: "en", jobFamily: "reception", text: "Requirements: front desk service, visitor registration, appointment scheduling, call handling, mail handling, office support, data entry, customer-facing service, confidential information handling, organization and communication." },
    strong: resume("Receptionist", ["front desk", "visitor management", "appointment scheduling", "call handling", "mail handling", "office support", "data entry", "customer-facing service", "confidential information", "organization", "communication"], ["Managed the front desk, greeted visitors, scheduled appointments, handled calls and correspondence, and entered confidential information accurately."]),
    partial: resume("Front Desk Assistant", ["front desk", "call handling", "organization"], ["Greeted visitors and answered phone calls."]),
    unrelated: resume("Warehouse Operator", ["inventory control", "forklift operation"], ["Prepared shipments and operated warehouse equipment."]),
  },
  {
    area: "teaching",
    source: "curated bilingual teacher vacancy sample",
    job: { title: "Teacher", language: "en", jobFamily: "teaching", text: "Requirements: lesson planning, classroom management, student assessment, curriculum development, curriculum adaptation, educational technology, inclusive education, student feedback, family communication and student support." },
    strong: resume("Teacher", ["lesson planning", "classroom management", "student assessment", "curriculum development", "curriculum adaptation", "educational technology", "inclusive education", "student feedback", "family communication", "student support"], ["Planned lessons, managed the classroom, assessed student progress and adapted curriculum while providing feedback and communicating with families."]),
    partial: resume("Teacher", ["lesson planning", "classroom management", "student assessment"], ["Planned lessons and assessed student progress."]),
    unrelated: resume("Retail Associate", ["cash handling", "inventory control"], ["Processed payments and organized store inventory."]),
  },
];

const rows = cases.map((testCase) => {
  const strong = analyzeJobMatch(testCase.job, testCase.strong, { now: () => new Date(0) });
  const partial = analyzeJobMatch(testCase.job, testCase.partial, { now: () => new Date(0) });
  const low = analyzeJobMatch(testCase.job, testCase.unrelated, { now: () => new Date(0) });
  assert.ok(strong.score.percentage > partial.score.percentage, `${testCase.area}: strong must score above partial`);
  assert.ok(partial.score.percentage > low.score.percentage, `${testCase.area}: partial must score above unrelated`);
  assert.ok(strong.score.percentage >= 70, `${testCase.area}: representative strong resume should score at least 70`);
  assert.ok(low.score.percentage <= 10, `${testCase.area}: unrelated resume should not exceed 10`);
  assert.ok(strong.unclassifiedTerms.length <= 1, `${testCase.area}: public vacancy leaves too many terms for manual review`);
  return {
    area: testCase.area,
    strong: strong.score.percentage,
    partial: partial.score.percentage,
    unrelated: low.score.percentage,
    recognized: new Set([
      ...strong.matches.map((item) => item.jobTerm.conceptId),
      ...strong.missingRequirements.map((item) => item.term.conceptId),
    ].filter(Boolean)).size,
    manualReview: strong.unclassifiedTerms.length,
    manualTerms: strong.unclassifiedTerms.map((item) => item.term.original).join(" | "),
    source: testCase.source,
  };
});

assert.deepEqual(validateConceptDictionary(), []);
for (const variant of ["Node.js", "NodeJS", "Node JS", "node-js"]) {
  assert.equal(
    findConceptsByTerm(variant, "en", "software-development")[0]?.id,
    "nodejs",
    `${variant} should resolve to the Node.js concept`,
  );
}

const frontendVocabularyRegression = analyzeJobMatch(
  {
    title: "Desarrollador Frontend",
    language: "es",
    jobFamily: "software-development",
    text: [
      "Requisitos:",
      "JavaScript moderno (ES6+)",
      "Node.js",
      "Zustand u otras",
      "herramientas de construcción",
      "npm/yarn",
      "ecosistema relacionado (Hooks)",
      "Context",
      "librerías como SASS",
      "Styled Components",
      "diseño responsive",
      "código testeable",
      "puesto",
    ].join("\n"),
  },
  resume("Desarrollador Frontend", ["JavaScript", "Zustand", "npm", "React Hooks", "Sass", "Styled Components", "diseño responsive", "testing"], ["Construí interfaces responsive y testeables con JavaScript, Zustand, Sass y Styled Components."]),
  { now: () => new Date(0) },
);
assert.deepEqual(
  frontendVocabularyRegression.unclassifiedTerms.map((item) => item.term.normalized),
  [],
  "known frontend vocabulary and generic noise should not require manual review",
);

const expandedFrontendVocabularyRegression = analyzeJobMatch(
  {
    title: "Senior Frontend Developer",
    language: "es",
    jobFamily: "software-development",
    text: "Requisitos: aplicaciones multi-locale, monedas, librerías de dashboards, visualización de datos, consideraciones de distribución, plataformas empresariales, Vue, Angular, componentes reutilizables, UX UI, desarrollar, fidelidad, GraphQL, interfaces, diferentes, usuario y multi.",
  },
  resume("Frontend Developer", ["React"], ["Desarrollé interfaces con React."]),
  { now: () => new Date(0) },
);
assert.deepEqual(
  expandedFrontendVocabularyRegression.unclassifiedTerms.map((item) => item.term.normalized),
  [],
  "common frontend architecture vocabulary should be recognized while isolated generic words are ignored",
);

const commonMarketingTermsRegression = analyzeJobMatch(
  {
    title: "Especialista en Marketing Digital",
    language: "es",
    jobFamily: "marketing",
    text: "Requisitos: Google Ads, Excel y análisis de datos.",
  },
  resume("Especialista en Contenidos", ["marketing digital"], ["Creé contenidos para campañas digitales."]),
  { now: () => new Date(0) },
);
assert.deepEqual(
  commonMarketingTermsRegression.unclassifiedTerms.map((item) => item.term.normalized),
  [],
  "common marketing and cross-functional concepts should not require manual review",
);
assert.deepEqual(
  new Set(commonMarketingTermsRegression.missingRequirements.map((item) => item.term.conceptId)),
  new Set(["google-ads", "microsoft-excel", "data-analysis"]),
  "recognized but absent concepts should be presented as missing requirements",
);
console.table(rows);
