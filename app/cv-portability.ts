import { normalizeCvData } from "./cv-data";
import type { StoredCv } from "./cv-library";
import { normalizeJobApplication, type JobApplication } from "./job-application";

export const CV_FILE_VERSION = 1;
export const BACKUP_FILE_VERSION = 2;
const FORMAT = "cv-simple";
const BACKUP_FORMAT = "cv-simple-backup";

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function serializeCv(cv: StoredCv): string {
  return JSON.stringify({ format: FORMAT, version: CV_FILE_VERSION, exportedAt: new Date().toISOString(), resume: cv }, null, 2);
}

export function serializeBackup(cvs: StoredCv[], applications: JobApplication[] = []): string {
  return JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_FILE_VERSION, exportedAt: new Date().toISOString(), resumes: cvs, applications }, null, 2);
}

function normalizeStoredCv(value: unknown, fallbackLocale: "es" | "en", preserveId = false): StoredCv {
  if (!isObject(value)) throw new Error("invalid_resume");
  const rawData = isObject(value.data) ? value.data : value;
  if (!("name" in rawData || "experiences" in rawData || "skills" in rawData || "summary" in rawData)) throw new Error("invalid_resume");
  const locale = value.locale === "en" || value.locale === "es"
    ? value.locale
    : rawData.documentLocale === "en" ? "en" : fallbackLocale;
  const now = new Date().toISOString();
  const data = normalizeCvData(rawData, locale);
  return {
    id: preserveId && typeof value.id === "string" ? value.id : crypto.randomUUID(),
    title: typeof value.title === "string" && value.title.trim() ? value.title.slice(0, 100) : data.name || (locale === "es" ? "CV importado" : "Imported resume"),
    locale: data.documentLocale,
    createdAt: preserveId && typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: now,
    favorite: value.favorite === true,
    data,
  };
}

export function parseCvFile(source: string, fallbackLocale: "es" | "en"): StoredCv {
  if (source.length > 8_000_000) throw new Error("file_too_large");
  const parsed: unknown = JSON.parse(source);
  if (!isObject(parsed)) throw new Error("invalid_resume");
  if (parsed.format === FORMAT) {
    if (typeof parsed.version !== "number" || parsed.version > CV_FILE_VERSION) throw new Error("unsupported_version");
    return normalizeStoredCv(parsed.resume, fallbackLocale);
  }
  if (parsed.format === BACKUP_FORMAT) throw new Error("backup_instead_of_resume");
  return normalizeStoredCv(parsed, fallbackLocale);
}

export type ParsedBackup = { cvs: StoredCv[]; applications: JobApplication[]; missingCvLinks: number };

export function parseBackupFile(source: string, fallbackLocale: "es" | "en"): ParsedBackup {
  if (source.length > 25_000_000) throw new Error("file_too_large");
  const parsed: unknown = JSON.parse(source);
  if (!isObject(parsed)) throw new Error("invalid_backup");
  if (parsed.format !== BACKUP_FORMAT || !Array.isArray(parsed.resumes)) throw new Error("invalid_backup");
  if (typeof parsed.version !== "number" || parsed.version > BACKUP_FILE_VERSION) throw new Error("unsupported_version");
  if (parsed.resumes.length > 100) throw new Error("too_many_resumes");
  if (parsed.applications !== undefined && (!Array.isArray(parsed.applications) || parsed.applications.length > 500)) throw new Error("too_many_applications");

  const sourceCvs = parsed.resumes.map((cv) => normalizeStoredCv(cv, fallbackLocale, true));
  const idMap = new Map(sourceCvs.map((cv) => [cv.id, crypto.randomUUID()]));
  const now = new Date().toISOString();
  const cvs = sourceCvs.map((cv) => ({ ...cv, id: idMap.get(cv.id)!, updatedAt: now }));
  let missingCvLinks = 0;
  const applications = (Array.isArray(parsed.applications) ? parsed.applications : []).map((value) => {
    const application = normalizeJobApplication(value);
    const mapLink = (id: string | null) => {
      if (!id) return null;
      const mapped = idMap.get(id);
      if (!mapped) missingCvLinks += 1;
      return mapped ?? null;
    };
    return normalizeJobApplication({
      ...application,
      id: crypto.randomUUID(),
      cvId: mapLink(application.cvId),
      sourceCvId: mapLink(application.sourceCvId),
      updatedAt: now,
    });
  });
  return { cvs, applications, missingCvLinks };
}
