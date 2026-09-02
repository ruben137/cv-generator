import { Box, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("App");
  const locale = useLocale();

  return (
    <Box component="a" href={locale === "en" ? "/en" : "/es"} className="brand-logo" aria-label={t("brandHomeLabel")}>
      <svg className="brand-logo-mark" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="4" width="34" height="40" rx="9" fill="#173B63" />
        <path d="M17 15h14M17 21h10" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="m17 31 4 4 10-11" fill="none" stroke="#78B6E8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <Box className="brand-logo-copy">
          <Typography component="span" className="brand-logo-name">CV Simple</Typography>
          <Typography component="span" className="brand-logo-tagline">{t("brandTagline")}</Typography>
        </Box>
      )}
    </Box>
  );
}
