import type {
  ExtractedTerm,
  JobDescriptionInput,
  JobMatchLanguage,
  RequirementLevel,
  ResumeMatchInput,
  TermSource,
} from "./model";
import { countExactTermOccurrences, hasMeaningfulToken, isStopWord, normalizeText, tokenize } from "./normalization";

const requirementSignals: Record<JobMatchLanguage, { required: RegExp[]; preferred: RegExp[]; leading: RegExp }> = {
  es: {
    required: [/\bse requiere\b/i, /\brequisito(?:s)?\b/i, /\bindispensable\b/i, /\bobligatorio\b/i, /\bdebe(?:s|ra|rá)?\b/i],
    preferred: [/\bdeseable\b/i, /\bpreferible\b/i, /\bse valora\b/i, /\bseria un plus\b/i, /\bsería un plus\b/i],
    leading: /^(?:se requiere(?:n)?|requisitos?|indispensable|obligatorio|deseable|preferible|se valora|experiencia(?:\s+demostrable)?\s+(?:en|con)\b|conocimientos?\s+(?:de|en)\b|dominio\s+(?:de|en)\b|manejo\s+de\b)\s*:?\s*/i,
  },
  en: {
    required: [/\brequired\b/i, /\brequirement(?:s)?\b/i, /\bmust\b/i, /\bmandatory\b/i, /\bneed(?:ed|s)?\b/i],
    preferred: [/\bpreferred\b/i, /\bdesirable\b/i, /\bnice to have\b/i, /\ba plus\b/i, /\bbonus\b/i],
    leading: /^(?:required|requirements?|must have|mandatory|preferred|desirable|nice to have|experience\s+(?:in|with)\b|knowledge\s+(?:of|in)\b|proficiency\s+(?:in|with)\b|familiarity\s+with\b)\s*:?\s*/i,
  },
};

const conjunctions: Record<JobMatchLanguage, RegExp> = {
  es: /\s+(?:y|e|o|u)\s+/i,
  en: /\s+(?:and|or)\s+/i,
};

const repeatedTermNoise: Record<JobMatchLanguage, ReadonlySet<string>> = {
  es: new Set(["experiencia", "equipo", "equipos", "cliente", "clientes", "proyecto", "proyectos", "sistema", "sistemas", "plataforma", "plataformas", "estado", "estados", "construyendo", "buscamos", "trabajo", "puesto", "cargo", "context", "contexto", "otra", "otras"]),
  en: new Set(["experience", "team", "teams", "client", "clients", "project", "projects", "system", "systems", "platform", "platforms", "building", "work", "looking", "role", "position", "context", "other", "others"]),
};

const requirementSections: Record<JobMatchLanguage, { required: RegExp; preferred: RegExp; end: RegExp }> = {
  es: {
    required: /^(?:requerimientos?|requisitos?)(?:\s+del\s+cargo)?\s*:?$/i,
    preferred: /^(?:opcionales?|deseables?|ser[aá]\s+un\s+plus)\s*:?$/i,
    end: /^(?:condiciones|beneficios|funciones(?:\s+del\s+cargo)?|responsabilidades)\s*:?$/i,
  },
  en: {
    required: /^(?:requirements?|required qualifications?)\s*:?$/i,
    preferred: /^(?:preferred qualifications?|nice to have|optional)\s*:?$/i,
    end: /^(?:benefits|conditions|responsibilities|what you will do)\s*:?$/i,
  },
};

function requirementLevel(segment: string, language: JobMatchLanguage): RequirementLevel {
  const signals = requirementSignals[language];
  if (signals.preferred.some((pattern) => pattern.test(segment))) return "preferred";
  if (signals.required.some((pattern) => pattern.test(segment))) return "required";
  return "unknown";
}

function toExtractedTerm(
  original: string,
  source: TermSource,
  frequency: number,
  level?: RequirementLevel,
): ExtractedTerm | null {
  const cleaned = original.trim().replace(/^[-•*\d.)\s]+/, "").replace(/[.:]+$/, "").trim();
  const normalized = normalizeText(cleaned);
  if (!normalized) return null;
  return { original: cleaned, normalized, source, frequency, requirementLevel: level };
}

function splitRequirementSegment(segment: string, language: JobMatchLanguage): string[] {
  const withoutSignal = segment.replace(requirementSignals[language].leading, "");
  return withoutSignal
    .split(/[,;|]/)
    .flatMap((part) => part.split(conjunctions[language]))
    .map((part) => part.trim())
    .filter((part) => part.length >= 2
      && part.length <= 100
      && hasMeaningfulToken(part, language)
      && !repeatedTermNoise[language].has(normalizeText(part)));
}

export function extractExplicitRequirements(input: JobDescriptionInput): ExtractedTerm[] {
  const segments = input.text.split(/(?:\n+|[!?]+|\.(?=\s|$))/).map((segment) => segment.trim()).filter(Boolean);
  const results = new Map<string, ExtractedTerm>();

  for (const segment of segments) {
    const signals = requirementSignals[input.language];
    const hasSignal = [...signals.required, ...signals.preferred].some((pattern) => pattern.test(segment))
      || signals.leading.test(segment);
    if (!hasSignal) continue;
    const level = requirementLevel(segment, input.language);
    for (const candidate of splitRequirementSegment(segment, input.language)) {
      const term = toExtractedTerm(candidate, "job-description", 1, level);
      if (!term) continue;
      const existing = results.get(term.normalized);
      if (!existing || (existing.requirementLevel !== "required" && level === "required")) results.set(term.normalized, term);
    }
  }

  let sectionLevel: RequirementLevel | null = null;
  for (const line of input.text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    const sections = requirementSections[input.language];
    if (sections.required.test(line)) { sectionLevel = "required"; continue; }
    if (sections.preferred.test(line)) { sectionLevel = "preferred"; continue; }
    if (sections.end.test(line)) { sectionLevel = null; continue; }
    if (!sectionLevel) continue;
    for (const candidate of splitRequirementSegment(line, input.language)) {
      const term = toExtractedTerm(candidate, "job-description", 1, sectionLevel);
      if (!term) continue;
      const existing = results.get(term.normalized);
      if (!existing || (existing.requirementLevel !== "required" && sectionLevel === "required")) results.set(term.normalized, term);
    }
  }

  return [...results.values()];
}

export type RepeatedTermOptions = {
  language: JobMatchLanguage;
  source?: TermSource;
  minimumFrequency?: number;
  maximumWords?: 1 | 2 | 3;
  limit?: number;
};

export function extractRepeatedTerms(text: string, options: RepeatedTermOptions): ExtractedTerm[] {
  const source = options.source ?? "job-description";
  const minimumFrequency = options.minimumFrequency ?? 2;
  const maximumWords = options.maximumWords ?? 3;
  const limit = options.limit ?? 30;
  const tokens = tokenize(text);
  const counts = new Map<string, number>();

  for (let size = 1; size <= maximumWords; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const phraseTokens = tokens.slice(index, index + size);
      if (size === 1 && repeatedTermNoise[options.language].has(phraseTokens[0])) continue;
      if (phraseTokens.every((token) => isStopWord(token, options.language) || /^\d+$/.test(token))) continue;
      if (size > 1 && (isStopWord(phraseTokens[0], options.language) || isStopWord(phraseTokens.at(-1) ?? "", options.language))) continue;
      const phrase = phraseTokens.join(" ");
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, frequency]) => frequency >= minimumFrequency)
    .sort(([leftTerm, leftFrequency], [rightTerm, rightFrequency]) => rightFrequency - leftFrequency || rightTerm.split(" ").length - leftTerm.split(" ").length)
    .slice(0, limit)
    .map(([normalized, frequency]) => ({ original: normalized, normalized, source, frequency }));
}

function extractFieldTerms(values: string[], source: TermSource): ExtractedTerm[] {
  const results = new Map<string, ExtractedTerm>();
  for (const value of values) {
    const term = toExtractedTerm(value, source, 1);
    if (!term) continue;
    const existing = results.get(term.normalized);
    results.set(term.normalized, { ...term, frequency: (existing?.frequency ?? 0) + 1 });
  }
  return [...results.values()];
}

export function extractResumeTerms(resume: ResumeMatchInput): ExtractedTerm[] {
  return [
    ...extractFieldTerms([resume.title], "resume-title"),
    ...extractFieldTerms([resume.summary], "resume-summary"),
    ...extractFieldTerms(resume.skills, "resume-skill"),
    ...extractFieldTerms(resume.experience, "resume-experience"),
    ...extractFieldTerms(resume.education, "resume-education"),
    ...extractFieldTerms(resume.certifications, "resume-certification"),
    ...extractFieldTerms(resume.languages, "resume-language"),
  ];
}

export function extractJobTerms(input: JobDescriptionInput): ExtractedTerm[] {
  const title = toExtractedTerm(input.title, "job-title", 1);
  const explicit = extractExplicitRequirements(input);
  const repeated = extractRepeatedTerms(input.text, { language: input.language, minimumFrequency: 3, limit: 20 });
  const results = new Map<string, ExtractedTerm>();
  for (const term of [title, ...explicit, ...repeated]) {
    if (!term) continue;
    const existing = results.get(term.normalized);
    results.set(term.normalized, existing
      ? { ...existing, frequency: Math.max(existing.frequency, countExactTermOccurrences(input.text, term.normalized)), requirementLevel: existing.requirementLevel === "required" ? "required" : term.requirementLevel }
      : term);
  }
  return [...results.values()];
}
