export const coverLetterTones = ["professional", "direct", "warm"] as const;
export type CoverLetterTone = (typeof coverLetterTones)[number];

export type CoverLetterContent = {
  recipient: string;
  subject: string;
  greeting: string;
  opening: string;
  evidence: string;
  motivation: string;
  closing: string;
  signature: string;
};

export type CoverLetterDraft = {
  schemaVersion: 1;
  id: string;
  title: string;
  locale: "es" | "en";
  tone: CoverLetterTone;
  cvId: string;
  applicationId: string;
  content: CoverLetterContent;
  createdAt: string;
  updatedAt: string;
};

const asObject = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, max = 6_000) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function normalizeCoverLetter(value: unknown): CoverLetterDraft {
  const raw = asObject(value);
  const content = asObject(raw.content);
  const now = new Date().toISOString();
  const createdAt = typeof raw.createdAt === "string" && !Number.isNaN(Date.parse(raw.createdAt)) ? new Date(raw.createdAt).toISOString() : now;
  return {
    schemaVersion: 1,
    id: text(raw.id, 100) || crypto.randomUUID(),
    title: text(raw.title, 160),
    locale: raw.locale === "en" ? "en" : "es",
    tone: coverLetterTones.includes(raw.tone as CoverLetterTone) ? raw.tone as CoverLetterTone : "professional",
    cvId: text(raw.cvId, 100),
    applicationId: text(raw.applicationId, 100),
    content: {
      recipient: text(content.recipient, 160),
      subject: text(content.subject, 200),
      greeting: text(content.greeting, 240),
      opening: text(content.opening),
      evidence: text(content.evidence),
      motivation: text(content.motivation),
      closing: text(content.closing),
      signature: text(content.signature, 240),
    },
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" && !Number.isNaN(Date.parse(raw.updatedAt)) ? new Date(raw.updatedAt).toISOString() : createdAt,
  };
}
