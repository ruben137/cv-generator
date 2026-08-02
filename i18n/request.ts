import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

function isLocale(value?: string): value is Locale {
  return locales.includes(value as Locale);
}

function localeFromHeader(acceptLanguage: string): Locale {
  for (const item of acceptLanguage.toLowerCase().split(",")) {
    const language = item.trim().split(";")[0].split("-")[0];
    if (isLocale(language)) return language;
  }
  return "es";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("locale")?.value;
  const locale = isLocale(savedLocale)
    ? savedLocale
    : localeFromHeader((await headers()).get("accept-language") ?? "");

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
