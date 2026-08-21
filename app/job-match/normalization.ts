import type { JobMatchLanguage } from "./model";

const orthographicVariants: Array<[RegExp, string]> = [
  [/\bnode[.\s-]?js\b/gi, "nodejs"],
  [/\breact[.\s-]?js\b/gi, "react"],
  [/\bnext[.\s-]?js\b/gi, "nextjs"],
  [/\bvue[.\s-]?js\b/gi, "vuejs"],
  [/\bpower[\s-]?bi\b/gi, "power bi"],
  [/\bfull[\s-]?stack\b/gi, "fullstack"],
  [/\bfront[\s-]?end\b/gi, "frontend"],
  [/\bback[\s-]?end\b/gi, "backend"],
  [/\btypescript\b/gi, "typescript"],
  [/\bc\s*sharp\b/gi, "c#"],
  [/\bdot[\s-]?net\b/gi, ".net"],
];

const stopWords: Record<JobMatchLanguage, ReadonlySet<string>> = {
  es: new Set([
    "a", "al", "ante", "bajo", "cada", "como", "con", "contra", "de", "del", "desde", "durante", "e", "el", "ella",
    "en", "entre", "es", "esta", "este", "ha", "la", "las", "lo", "los", "mas", "muy", "o", "para", "por", "que", "se",
    "sin", "sobre", "su", "sus", "un", "una", "uno", "y", "ya",
  ]),
  en: new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "in", "is", "it", "of", "on", "or",
    "our", "that", "the", "their", "this", "to", "with", "will", "you", "your",
  ]),
};

function applyOrthographicVariants(value: string): string {
  return orthographicVariants.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}

export function normalizeText(value: string): string {
  return applyOrthographicVariants(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ") : [];
}

export function isStopWord(value: string, language: JobMatchLanguage): boolean {
  return stopWords[language].has(normalizeText(value));
}

export function hasMeaningfulToken(value: string, language: JobMatchLanguage): boolean {
  return tokenize(value).some((token) => token.length > 1 && !stopWords[language].has(token) && !/^\d+$/.test(token));
}

/** Exact token-window matching prevents false positives such as `java` inside `javascript`. */
export function countExactTermOccurrences(text: string, term: string): number {
  const haystack = tokenize(text);
  const needle = tokenize(term);
  if (!needle.length || needle.length > haystack.length) return 0;
  let count = 0;
  for (let index = 0; index <= haystack.length - needle.length; index += 1) {
    if (needle.every((token, offset) => haystack[index + offset] === token)) count += 1;
  }
  return count;
}

export function containsExactTerm(text: string, term: string): boolean {
  return countExactTermOccurrences(text, term) > 0;
}
