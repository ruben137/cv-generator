import type { ConceptAlias, ConceptRelation, JobFamily, MatchConcept, TermCategory } from "../model";

type AliasInput = string | [value: string, kind: ConceptAlias["kind"]];

export type ConceptInput = {
  id: string;
  category: TermCategory;
  es: string;
  en: string;
  families: JobFamily[];
  esAliases?: AliasInput[];
  enAliases?: AliasInput[];
  relations?: Array<[targetConceptId: string, kind: ConceptRelation["kind"], confidence: number]>;
};

function aliases(locale: "es" | "en", canonical: string, values: AliasInput[]): ConceptAlias[] {
  return [[canonical, "name"] as AliasInput, ...values].map((entry) => {
    const [value, kind] = typeof entry === "string" ? [entry, "name" as const] : entry;
    return { value, locale, kind };
  });
}

export function concept(input: ConceptInput): MatchConcept {
  return {
    id: input.id,
    category: input.category,
    labels: { es: input.es, en: input.en },
    aliases: [
      ...aliases("es", input.es, input.esAliases ?? []),
      ...aliases("en", input.en, input.enAliases ?? []),
    ],
    relations: (input.relations ?? []).map(([targetConceptId, kind, confidence]) => ({ targetConceptId, kind, confidence })),
    jobFamilies: input.families,
  };
}
