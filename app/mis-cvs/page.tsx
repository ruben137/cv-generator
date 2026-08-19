"use client";

import {
  AddRounded,
  ArrowBackRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  EditRounded,
  LanguageRounded,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  IconButton,
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createStoredCv, deleteStoredCv, listStoredCvs, putStoredCv, type StoredCv } from "../cv-library";
import { BrandLogo } from "../brand-logo";

const theme = createTheme({
  palette: {
    primary: { main: "#173B63", dark: "#0E2948" },
    background: { default: "#F4F6F8", paper: "#FFFFFF" },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "var(--font-geist-sans), Arial, sans-serif", button: { textTransform: "none", fontWeight: 700 } },
});

export default function MyCvsPage() {
  const t = useTranslations("App");
  const locale = useLocale();
  const [items, setItems] = useState<StoredCv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setItems(await listStoredCvs());
      setError("");
    } catch {
      setError(t("libraryLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => { void refresh(); });
  }, [refresh]);

  const openCv = (cv: StoredCv) => {
    Reflect.set(document, "cookie", `locale=${cv.locale};path=/;max-age=31536000;samesite=lax`);
    window.location.assign(`/?cv=${encodeURIComponent(cv.id)}`);
  };

  const createNew = (nextLocale: "es" | "en") => {
    Reflect.set(document, "cookie", `locale=${nextLocale};path=/;max-age=31536000;samesite=lax`);
    window.location.assign("/?new=1");
  };

  const duplicateCv = async (cv: StoredCv) => {
    const copy = createStoredCv(structuredClone(cv.data), cv.locale, `${cv.title} · ${t("copy")}`);
    await putStoredCv(copy);
    await refresh();
  };

  const removeCv = async (cv: StoredCv) => {
    if (!window.confirm(t("confirmDeleteCv", { title: cv.title }))) return;
    await deleteStoredCv(cv.id);
    await refresh();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="inherit" elevation={0} className="topbar">
        <Toolbar className="topbar-inner" sx={{ minHeight: 76, gap: 2 }}>
          <BrandLogo />
          <Box sx={{ flexGrow: 1 }} />
          <Button component="a" href="/" startIcon={<ArrowBackRounded />}>{t("backToEditor")}</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} mb={3}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={800}>{t("myCvs")}</Typography>
            <Typography color="text.secondary" mt={0.5}>{t("myCvsDescription")}</Typography>
          </Box>
          <ButtonGroup variant="contained" sx={{ alignSelf: { sm: "center" } }}>
            <Button startIcon={<AddRounded />} onClick={() => createNew("es")}>{t("newCvEs")}</Button>
            <Button startIcon={<LanguageRounded />} onClick={() => createNew("en")}>{t("newCvEn")}</Button>
          </ButtonGroup>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="grid" sx={{ placeItems: "center", py: 10 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <DescriptionRounded color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h6" mt={1}>{t("noSavedCvs")}</Typography>
            <Typography color="text.secondary" mb={2}>{t("noSavedCvsHelp")}</Typography>
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => createNew(locale as "es" | "en")}>{t("createFirstCv")}</Button>
          </Card>
        ) : (
          <Box className="cv-library-grid">
            {items.map((cv) => (
              <Card variant="outlined" key={cv.id} className="cv-library-card">
                <Box className="cv-library-preview" sx={{ "--library-primary": cv.data.primaryColor } as React.CSSProperties}>
                  <span />
                  {cv.data.photo ? <img src={cv.data.photo} alt="" /> : <DescriptionRounded />}
                </Box>
                <CardContent sx={{ pb: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} noWrap title={cv.title}>{cv.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{cv.data.headline || t("untitledCv")}</Typography>
                    </Box>
                    <Chip size="small" label={cv.locale.toUpperCase()} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                    {t("updatedAt", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(cv.updatedAt)) })}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button variant="contained" startIcon={<EditRounded />} onClick={() => openCv(cv)}>{t("openCv")}</Button>
                  <Tooltip title={t("duplicateCv")}><IconButton onClick={() => duplicateCv(cv)}><ContentCopyRounded /></IconButton></Tooltip>
                  <Tooltip title={t("deleteCv")}><IconButton color="error" onClick={() => removeCv(cv)}><DeleteOutlineRounded /></IconButton></Tooltip>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}
