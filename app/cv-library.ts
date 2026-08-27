import type { CvData } from "./types";
import { normalizeCvData } from "./cv-data";
import { CV_STORE_NAME, runStoreRequest } from "./local-database";

export type StoredCv = {
  id: string;
  title: string;
  locale: "es" | "en";
  createdAt: string;
  updatedAt: string;
  favorite?: boolean;
  data: CvData;
};

export async function listStoredCvs(): Promise<StoredCv[]> {
  const items = await runStoreRequest<StoredCv[]>(CV_STORE_NAME, "readonly", (store) => store.getAll());
  return items.map((item) => {
    const locale = item.locale === "en" ? "en" : "es";
    const data = normalizeCvData(item.data, locale);
    return { ...item, locale: data.documentLocale, favorite: item.favorite === true, data };
  }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getStoredCv(id: string): Promise<StoredCv | undefined> {
  return runStoreRequest<StoredCv | undefined>(CV_STORE_NAME, "readonly", (store) => store.get(id)).then((item) => {
    if (!item) return undefined;
    const locale = item.locale === "en" ? "en" : "es";
    const data = normalizeCvData(item.data, locale);
    return { ...item, locale: data.documentLocale, favorite: item.favorite === true, data };
  });
}

export function putStoredCv(cv: StoredCv): Promise<IDBValidKey> {
  return runStoreRequest<IDBValidKey>(CV_STORE_NAME, "readwrite", (store) => store.put(cv));
}

export function deleteStoredCv(id: string): Promise<undefined> {
  return runStoreRequest<undefined>(CV_STORE_NAME, "readwrite", (store) => store.delete(id));
}

export function createStoredCv(data: CvData, locale: "es" | "en", title?: string): StoredCv {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title?.trim() || data.name.trim() || (locale === "es" ? "Mi CV" : "My resume"),
    locale,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    data,
  };
}
