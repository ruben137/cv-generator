import { normalizeCvData } from "../cv-data";
import type { CvData } from "../types";

const KEY = "cv-simple-resume-review-transfer";
const VERSION = 1;

export function writeResumeReviewTransfer(storage: Storage, cv: CvData) {
  storage.setItem(KEY, JSON.stringify({ version: VERSION, createdAt: new Date().toISOString(), cv }));
}

export function consumeResumeReviewTransfer(storage: Storage): CvData | null {
  const raw = storage.getItem(KEY);
  storage.removeItem(KEY);
  if (!raw) return null;
  try {
    const transfer = JSON.parse(raw) as { version?: number; cv?: unknown };
    return transfer.version === VERSION ? normalizeCvData(transfer.cv) : null;
  } catch { return null; }
}
