import { normalizeCvData } from "../cv-data";
import type { CvData } from "../types";
import { createImprovementTarget, type ImprovementTarget } from "../improvement-plan";

const KEY = "cv-simple-resume-review-transfer";
const VERSION = 2;

export type ResumeReviewTransfer = { cv: CvData; target: ImprovementTarget };

export function writeResumeReviewTransfer(storage: Storage, cv: CvData, cvId?: string | null) {
  storage.setItem(KEY, JSON.stringify({ version: VERSION, createdAt: new Date().toISOString(), cv, target: createImprovementTarget(cv, cvId) }));
}

export function consumeResumeReviewTransfer(storage: Storage): ResumeReviewTransfer | null {
  const raw = storage.getItem(KEY);
  storage.removeItem(KEY);
  if (!raw) return null;
  try {
    const transfer = JSON.parse(raw) as { version?: number; cv?: unknown; target?: ImprovementTarget };
    return transfer.version === VERSION && transfer.target?.fingerprint
      ? { cv: normalizeCvData(transfer.cv), target: transfer.target }
      : null;
  } catch { return null; }
}
