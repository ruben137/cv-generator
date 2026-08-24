import type { CvData } from "../types";
import { normalizeCvData } from "../cv-data";
import { createImprovementTarget, type ImprovementTarget } from "../improvement-plan";
import { cvDataToMatchInput } from "./cv-adapter";
import { jobFamilies, type JobFamily, type JobMatchLanguage, type ResumeMatchInput } from "./model";

export const JOB_MATCH_TRANSFER_KEY = "cv-simple-job-match-transfer";
const TRANSFER_VERSION = 5;

export type JobMatchTransferJob = {
  applicationId: string;
  title: string;
  description: string;
  language: JobMatchLanguage;
};

type JobMatchTransfer = {
  version: typeof TRANSFER_VERSION;
  createdAt: string;
  language: JobMatchLanguage;
  jobFamily: JobFamily;
  resume: ResumeMatchInput;
  cv: CvData;
  target: ImprovementTarget;
  job?: JobMatchTransferJob;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResumeInput(value: unknown): value is ResumeMatchInput {
  if (!value || typeof value !== "object") return false;
  const resume = value as Partial<ResumeMatchInput>;
  return typeof resume.title === "string"
    && typeof resume.summary === "string"
    && isStringArray(resume.skills)
    && isStringArray(resume.experience)
    && isStringArray(resume.education)
    && isStringArray(resume.certifications)
    && isStringArray(resume.languages)
    && (resume.experienceContext === undefined || isStringArray(resume.experienceContext))
    && (resume.customSections === undefined || isStringArray(resume.customSections))
    && (resume.source === undefined || resume.source === "structured" || resume.source === "text");
}

export function createJobMatchTransfer(cv: CvData, jobFamily: JobFamily, cvId?: string | null, job?: JobMatchTransferJob): JobMatchTransfer {
  return {
    version: TRANSFER_VERSION,
    createdAt: new Date().toISOString(),
    language: cv.documentLocale,
    jobFamily,
    resume: cvDataToMatchInput(cv),
    cv,
    target: createImprovementTarget(cv, cvId),
    job,
  };
}

export function writeJobMatchTransfer(storage: Storage, cv: CvData, jobFamily: JobFamily, cvId?: string | null, job?: JobMatchTransferJob): void {
  storage.setItem(JOB_MATCH_TRANSFER_KEY, JSON.stringify(createJobMatchTransfer(cv, jobFamily, cvId, job)));
}

export function consumeJobMatchTransfer(storage: Storage): JobMatchTransfer | null {
  const raw = storage.getItem(JOB_MATCH_TRANSFER_KEY);
  storage.removeItem(JOB_MATCH_TRANSFER_KEY);
  if (!raw) return null;
  try {
    const transfer = JSON.parse(raw) as Partial<JobMatchTransfer>;
    if (transfer.version !== TRANSFER_VERSION || !isResumeInput(transfer.resume) || !transfer.cv || !transfer.target || typeof transfer.target.fingerprint !== "string") return null;
    if (transfer.language !== "es" && transfer.language !== "en") return null;
    if (!jobFamilies.includes(transfer.jobFamily as JobFamily)) return null;
    if (transfer.job && (typeof transfer.job.applicationId !== "string" || typeof transfer.job.title !== "string" || typeof transfer.job.description !== "string" || !["es", "en"].includes(transfer.job.language))) return null;
    return { ...transfer, cv: normalizeCvData(transfer.cv) } as JobMatchTransfer;
  } catch {
    return null;
  }
}

export function resumeMatchInputToText(resume: ResumeMatchInput, language: JobMatchLanguage): string {
  const labels = language === "en"
    ? { summary: "SUMMARY", skills: "SKILLS", experience: "EXPERIENCE", education: "EDUCATION", certifications: "CERTIFICATIONS", languages: "LANGUAGES" }
    : { summary: "RESUMEN", skills: "HABILIDADES", experience: "EXPERIENCIA", education: "FORMACIÓN ACADÉMICA", certifications: "CERTIFICACIONES", languages: "IDIOMAS" };
  const sections: Array<[string, string[]]> = [
    [labels.summary, resume.summary ? [resume.summary] : []],
    [labels.skills, resume.skills],
    [labels.experience, [...(resume.experienceContext ?? []), ...resume.experience]],
    [labels.education, resume.education],
    [labels.certifications, resume.certifications],
    [labels.languages, resume.languages],
    [language === "en" ? "ADDITIONAL SECTIONS" : "SECCIONES ADICIONALES", resume.customSections ?? []],
  ];
  return sections.filter(([, items]) => items.length).map(([label, items]) => `${label}\n${items.join("\n")}`).join("\n\n");
}
