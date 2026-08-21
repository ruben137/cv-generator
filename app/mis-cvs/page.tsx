"use client";

import {
  AddRounded,
  ArrowBackRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  DownloadRounded,
  EditRounded,
  LanguageRounded,
  PictureAsPdfRounded,
  SaveAltRounded,
  UploadFileRounded,
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
  MenuItem,
  Stack,
  TextField,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createStoredCv, deleteStoredCv, listStoredCvs, putStoredCv, type StoredCv } from "../cv-library";
import { BrandLogo } from "../brand-logo";
import { parseBackupFile, parseCvFile, serializeBackup, serializeCv } from "../cv-portability";
import { defaultDocumentLabels } from "../cv-data";
import { exportPdf, type ExportLabels } from "../exporters";

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
  const [notice, setNotice] = useState("");
  const [exportingCvId, setExportingCvId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<"all" | "es" | "en">("all");

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
    window.location.assign(`/${locale}?cv=${encodeURIComponent(cv.id)}#generator`);
  };

  const createNew = (nextLocale: "es" | "en") => {
    window.location.assign(`/${locale}?new=1&documentLocale=${nextLocale}#generator`);
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

  const downloadJson = (contents: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const safeFilename = (title: string) => title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "cv";

  const exportCvJson = (cv: StoredCv) => downloadJson(serializeCv(cv), `${safeFilename(cv.title)}.cv-simple.json`);

  const downloadCvPdf = async (cv: StoredCv) => {
    try {
      setExportingCvId(cv.id);
      setError("");
      setNotice("");
      const defaults = defaultDocumentLabels[cv.data.documentLocale];
      const labels: ExportLabels = {
        summary: cv.data.sectionTitles.summary?.trim() || defaults.summary,
        experience: cv.data.sectionTitles.experience?.trim() || defaults.experience,
        skills: cv.data.sectionTitles.skills?.trim() || defaults.skills,
        contact: cv.data.sectionTitles.contact?.trim() || defaults.contact,
        languages: cv.data.sectionTitles.languages?.trim() || defaults.languages,
        education: cv.data.sectionTitles.education?.trim() || defaults.education,
        certifications: cv.data.sectionTitles.certifications?.trim() || defaults.certifications,
        location: cv.data.sectionTitles.location?.trim() || defaults.location,
        phone: cv.data.sectionTitles.phone?.trim() || defaults.phone,
        email: cv.data.sectionTitles.email?.trim() || defaults.email,
        portfolio: cv.data.sectionTitles.portfolio?.trim() || defaults.portfolio,
      };
      await exportPdf(cv.data, labels, cv.title);
    } catch {
      setError(t("pdfDownloadError"));
    } finally {
      setExportingCvId(null);
    }
  };

  const exportBackup = () => {
    downloadJson(serializeBackup(items), `cv-simple-backup-${new Date().toISOString().slice(0, 10)}.json`);
    setNotice(t("backupExported"));
  };

  const importFile = async (file: File | undefined, backup: boolean) => {
    if (!file) return;
    try {
      const source = await file.text();
      const imported = backup
        ? parseBackupFile(source, locale as "es" | "en")
        : [parseCvFile(source, locale as "es" | "en")];
      await Promise.all(imported.map((cv) => putStoredCv(cv)));
      await refresh();
      setError("");
      setNotice(t(backup ? "backupImported" : "cvImported", { count: imported.length }));
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "invalid_resume";
      setNotice("");
      setError(t(code === "unsupported_version" ? "importUnsupportedVersion" : code === "file_too_large" ? "importTooLarge" : "importInvalid"));
    }
  };

  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale);
    return items.filter((cv) => (languageFilter === "all" || cv.locale === languageFilter)
      && (!term || `${cv.title} ${cv.data.name} ${cv.data.headline}`.toLocaleLowerCase(locale).includes(term)));
  }, [items, languageFilter, locale, search]);

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

        <Box className="library-toolbar">
          <TextField size="small" label={t("searchCvs")} value={search} onChange={(event) => setSearch(event.target.value)} />
          <TextField select size="small" label={t("filterByLanguage")} value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value as "all" | "es" | "en")}>
            <MenuItem value="all">{t("allLanguages")}</MenuItem>
            <MenuItem value="es">ES</MenuItem>
            <MenuItem value="en">EN</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button component="label" variant="outlined" startIcon={<UploadFileRounded />}>
            {t("importCvJson")}<input hidden type="file" accept="application/json,.json" onChange={(event) => { void importFile(event.target.files?.[0], false); event.target.value = ""; }} />
          </Button>
          <Button component="label" variant="outlined" startIcon={<SaveAltRounded />}>
            {t("restoreBackup")}<input hidden type="file" accept="application/json,.json" onChange={(event) => { void importFile(event.target.files?.[0], true); event.target.value = ""; }} />
          </Button>
          <Button variant="outlined" startIcon={<DownloadRounded />} disabled={!items.length} onClick={exportBackup}>{t("downloadBackup")}</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}
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
          <>
          {visibleItems.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>{t("noMatchingCvs")}</Alert>}
          <Box className="cv-library-grid">
            {visibleItems.map((cv) => (
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
                <CardActions sx={{ px: 2, pb: 1.5, pt: 1, display: "block" }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={exportingCvId === cv.id ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfRounded />}
                    disabled={exportingCvId !== null}
                    onClick={() => { void downloadCvPdf(cv); }}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {exportingCvId === cv.id ? t("generating") : t("downloadPdf")}
                  </Button>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ mt: 1.25, pt: 1, borderTop: "1px solid", borderColor: "divider" }}
                  >
                    <Button size="small" startIcon={<EditRounded />} onClick={() => openCv(cv)}>{t("openCv")}</Button>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title={t("exportCvJson")}><IconButton size="small" aria-label={t("exportCvJson")} onClick={() => exportCvJson(cv)}><DownloadRounded /></IconButton></Tooltip>
                      <Tooltip title={t("duplicateCv")}><IconButton size="small" aria-label={t("duplicateCv")} onClick={() => duplicateCv(cv)}><ContentCopyRounded /></IconButton></Tooltip>
                      <Tooltip title={t("deleteCv")}><IconButton size="small" aria-label={t("deleteCv")} color="error" onClick={() => removeCv(cv)}><DeleteOutlineRounded /></IconButton></Tooltip>
                    </Stack>
                  </Stack>
                </CardActions>
              </Card>
            ))}
          </Box>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}
