import { COVER_LETTER_STORE_NAME, runStoreRequest } from "./local-database";
import { normalizeCoverLetter, type CoverLetterDraft } from "./cover-letter";

export async function listCoverLetters(): Promise<CoverLetterDraft[]> {
  const items = await runStoreRequest<unknown[]>(COVER_LETTER_STORE_NAME, "readonly", (store) => store.getAll());
  return items.map(normalizeCoverLetter).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function putCoverLetter(draft: CoverLetterDraft): Promise<IDBValidKey> {
  return runStoreRequest<IDBValidKey>(COVER_LETTER_STORE_NAME, "readwrite", (store) => store.put(normalizeCoverLetter(draft)));
}

export function deleteCoverLetter(id: string): Promise<undefined> {
  return runStoreRequest<undefined>(COVER_LETTER_STORE_NAME, "readwrite", (store) => store.delete(id));
}
