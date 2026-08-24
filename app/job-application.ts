import { jobFamilies, type JobFamily } from "./job-match/model";

export const JOB_APPLICATION_SCHEMA_VERSION = 3;
export const jobApplicationStatuses = ["saved", "preparing", "applied", "interview", "offer", "rejected"] as const;
export type JobApplicationStatus = (typeof jobApplicationStatuses)[number];

export type JobApplicationAnalysis = {
  analyzedAt: string;
  score: number;
  matchingTerms: string[];
  missingTerms: string[];
};

export const jobApplicationEventTypes = ["created", "updated", "status-changed", "cv-linked", "cv-adapted", "analysis", "improvements", "note"] as const;
export type JobApplicationEventType = (typeof jobApplicationEventTypes)[number];
export type JobApplicationEvent = {
  id: string;
  type: JobApplicationEventType;
  createdAt: string;
  detail: string;
  metadata: Record<string, string | number>;
};
export type NewJobApplicationEvent = Omit<JobApplicationEvent, "id" | "createdAt"> & { createdAt?: string };

export type JobApplication = {
  schemaVersion: typeof JOB_APPLICATION_SCHEMA_VERSION;
  id: string;
  company: string;
  role: string;
  url: string;
  location: string;
  description: string;
  language: "es" | "en";
  jobFamily: JobFamily;
  status: JobApplicationStatus;
  appliedAt: string;
  notes: string;
  cvId: string | null;
  sourceCvId: string | null;
  lastAnalysis: JobApplicationAnalysis | null;
  selectedImprovements: string[];
  history: JobApplicationEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CreateJobApplicationInput = Pick<JobApplication, "company" | "role"> & Partial<Omit<JobApplication, "schemaVersion" | "id" | "company" | "role" | "createdAt" | "updatedAt">>;

const asObject = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const isoDateTime = (value: unknown, fallback: string) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return new Date(value).toISOString();
};
const calendarDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
const uniqueTextList = (value: unknown, maxItems: number, maxLength: number) => Array.isArray(value)
  ? [...new Set(value.map((item) => text(item, maxLength)).filter(Boolean))].slice(0, maxItems)
  : [];

function normalizeAnalysis(value: unknown): JobApplicationAnalysis | null {
  const raw = asObject(value);
  if (!Object.keys(raw).length) return null;
  const analyzedAt = isoDateTime(raw.analyzedAt, "");
  if (!analyzedAt) return null;
  const rawScore = typeof raw.score === "number" && Number.isFinite(raw.score) ? raw.score : 0;
  return {
    analyzedAt,
    score: Math.round(Math.min(100, Math.max(0, rawScore))),
    matchingTerms: uniqueTextList(raw.matchingTerms, 30, 100),
    missingTerms: uniqueTextList(raw.missingTerms, 30, 100),
  };
}

function normalizeHistory(value: unknown, fallbackCreatedAt: string): JobApplicationEvent[] {
  const items = Array.isArray(value) ? value : [];
  const history = items.flatMap((item) => {
    const raw = asObject(item);
    if (!jobApplicationEventTypes.includes(raw.type as JobApplicationEventType)) return [];
    const rawMetadata = asObject(raw.metadata);
    const metadata = Object.fromEntries(Object.entries(rawMetadata).filter(([, entry]) => typeof entry === "string" || typeof entry === "number")) as Record<string, string | number>;
    return [{
      id: text(raw.id, 100) || crypto.randomUUID(),
      type: raw.type as JobApplicationEventType,
      createdAt: isoDateTime(raw.createdAt, fallbackCreatedAt),
      detail: text(raw.detail, 500),
      metadata,
    }];
  }).slice(-50);
  return history.length ? history : [{ id: crypto.randomUUID(), type: "created", createdAt: fallbackCreatedAt, detail: "", metadata: {} }];
}

export function normalizeJobApplication(value: unknown): JobApplication {
  const raw = asObject(value);
  const now = new Date().toISOString();
  const createdAt = isoDateTime(raw.createdAt, now);
  const status = jobApplicationStatuses.includes(raw.status as JobApplicationStatus) ? raw.status as JobApplicationStatus : "saved";
  const jobFamily = jobFamilies.includes(raw.jobFamily as JobFamily) ? raw.jobFamily as JobFamily : "general";
  const history = normalizeHistory(raw.history, createdAt);
  return {
    schemaVersion: JOB_APPLICATION_SCHEMA_VERSION,
    id: text(raw.id, 100) || crypto.randomUUID(),
    company: text(raw.company, 100),
    role: text(raw.role, 100),
    url: text(raw.url, 500),
    location: text(raw.location, 120),
    description: text(raw.description, 16_000),
    language: raw.language === "en" ? "en" : "es",
    jobFamily,
    status,
    appliedAt: calendarDate(raw.appliedAt),
    notes: text(raw.notes, 4_000),
    cvId: text(raw.cvId, 100) || null,
    sourceCvId: text(raw.sourceCvId, 100) || null,
    lastAnalysis: normalizeAnalysis(raw.lastAnalysis),
    selectedImprovements: uniqueTextList(raw.selectedImprovements, 30, 120),
    history,
    createdAt,
    updatedAt: isoDateTime(raw.updatedAt, createdAt),
  };
}

export function createJobApplication(input: CreateJobApplicationInput): JobApplication {
  const company = input.company.trim().slice(0, 100);
  const role = input.role.trim().slice(0, 100);
  if (!company || !role) throw new Error("company_and_role_required");
  const now = new Date().toISOString();
  return normalizeJobApplication({ ...input, company, role, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
}

export function updateJobApplication(application: JobApplication, changes: Partial<Omit<JobApplication, "schemaVersion" | "id" | "createdAt">>, event?: NewJobApplicationEvent): JobApplication {
  const now = new Date().toISOString();
  const history = event ? [...application.history, {
    id: crypto.randomUUID(), type: event.type, createdAt: event.createdAt ?? now,
    detail: event.detail, metadata: event.metadata,
  }] : application.history;
  return normalizeJobApplication({ ...application, ...changes, history, id: application.id, createdAt: application.createdAt, updatedAt: now });
}
