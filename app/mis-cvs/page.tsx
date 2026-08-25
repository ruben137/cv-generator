"use client";

import {
  AddRounded,
  ArrowBackRounded,
  CheckBox,
  CloseOutlined,
  ContentCopyRounded,
  DeleteOutlineRounded,
  DescriptionRounded,
  DownloadRounded,
  EditRounded,
  LanguageRounded,
  WorkOutlineRounded,
  MoreHorizRounded,
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
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Menu,
  Pagination,
  Stack,
  TextField,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createStoredCv,
  deleteStoredCv,
  listStoredCvs,
  putStoredCv,
  type StoredCv,
} from "../cv-library";
import { BrandLogo } from "../brand-logo";
import { MobileNavigationMenu } from "../mobile-navigation-menu";
import {
  parseBackupFile,
  parseCvFile,
  serializeBackup,
  serializeCv,
} from "../cv-portability";
import { defaultDocumentLabels } from "../cv-data";
import type { CvData } from "../types";
import { exportDocx, exportPdf, type ExportLabels } from "../exporters";
import PreviewCvModal from "../PreviewCvModal";
import ConfirmModal from "../ConfirmModal";
import { writeResumeReviewTransfer } from "../resume-review/transfer";
import { writeJobMatchTransfer } from "../job-match/transfer";
import { jobFamilies, type JobFamily } from "../job-match/model";
import { listJobApplications, putJobApplication } from "../job-application-library";

const theme = createTheme({
  palette: {
    primary: { main: "#173B63", dark: "#0E2948" },
    background: { default: "#F4F6F8", paper: "#FFFFFF" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 700 },
  },
});

const CVS_PER_PAGE = 8;

export default function MyCvsPage() {
  const t = useTranslations("App");
  const jobT = useTranslations("JobMatch");
  const locale = useLocale();
  const [items, setItems] = useState<StoredCv[]>([]);
  const [selectedItems, setSelectedItems] = useState<StoredCv[]>([]);
  const [disablePreview, setDisablePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [exportingCvId, setExportingCvId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "docx" | null>(null);
  const [jobMatchCv, setJobMatchCv] = useState<StoredCv | null>(null);
  const [jobFamily, setJobFamily] = useState<JobFamily>("general");
  const [libraryMenuAnchor, setLibraryMenuAnchor] = useState<HTMLElement | null>(null);
  const [deleteCandidates, setDeleteCandidates] = useState<StoredCv[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [bulkExporting, setBulkExporting] = useState(false);
  const importCvInputRef = useRef<HTMLInputElement>(null);
  const restoreBackupInputRef = useRef<HTMLInputElement>(null);
  const [languageFilter, setLanguageFilter] = useState<"all" | "es" | "en">(
    "all",
  );

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
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const openCv = (cv: StoredCv) => {
    window.location.assign(
      `/${locale}?cv=${encodeURIComponent(cv.id)}#generator`,
    );
  };

  const createNew = (nextLocale: "es" | "en") => {
    window.location.assign(
      `/${locale}?new=1&documentLocale=${nextLocale}#generator`,
    );
  };

  const duplicateCv = async (cv: StoredCv) => {
    const copy = createStoredCv(
      structuredClone(cv.data),
      cv.locale,
      `${cv.title} · ${t("copy")}`,
    );
    await putStoredCv(copy);
    await refresh();
  };

  const downloadJson = (contents: string, filename: string) => {
    const url = URL.createObjectURL(
      new Blob([contents], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const safeFilename = (title: string) =>
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cv";

  const exportCvJson = (cv: StoredCv) =>
    downloadJson(serializeCv(cv), `${safeFilename(cv.title)}.cv-simple.json`);

const downloadCvPdf = async (cv: StoredCv, exportData: CvData = cv.data) => {
  try {
    setExportingCvId(cv.id);
    setExportingFormat("pdf");
    setError("");
    setNotice("");

    await exportPdf(exportData, getExportLabels({ ...cv, data: exportData }), cv.title);
  } catch {
    setError(t("pdfDownloadError"));
  } finally {
    setExportingCvId(null);
    setExportingFormat(null);
  }
};
const downloadCvDocx = async (cv: StoredCv, exportData: CvData = cv.data) => {
  try {
    setExportingCvId(cv.id);
    setExportingFormat("docx");
    setError("");
    setNotice("");
    await exportDocx(exportData, getExportLabels({ ...cv, data: exportData }), cv.title);
  } catch {
    setError(t("docxDownloadError"));
  } finally {
    setExportingCvId(null);
    setExportingFormat(null);
  }
};
const downloadCv = (cv: StoredCv, format: "pdf" | "docx", exportData: CvData = cv.data) => format === "pdf" ? downloadCvPdf(cv, exportData) : downloadCvDocx(cv, exportData);

const reviewCvQuality = (cv: StoredCv) => {
  try {
    writeResumeReviewTransfer(window.localStorage, cv.data, cv.id);
    window.location.assign(locale === "en" ? "/en/resume-review?source=library" : "/es/revisar-cv?source=library");
  } catch {
    setError(t("resumeReviewTransferError"));
  }
};

const openJobMatchSetup = (cv: StoredCv) => {
  setJobMatchCv(cv);
  setJobFamily("general");
};

const analyzeCvAgainstJob = () => {
  if (!jobMatchCv) return;
  try {
    writeJobMatchTransfer(window.localStorage, jobMatchCv.data, jobFamily, jobMatchCv.id);
    window.location.assign(locale === "en" ? "/en/job-match?source=library" : "/es/analizar-vacante?source=library");
  } catch {
    setError(t("jobMatchTransferError"));
  }
};
const downloadSelectedPdfs = async () => {
  if (!selectedItems.length) return;

  try {
    setBulkExporting(true);
    setError("");
    setNotice("");

    for (const cv of selectedItems) {
      await exportPdf(cv.data, getExportLabels(cv), cv.title);

      // Pequeña pausa para evitar que algunos navegadores
      // ignoren descargas disparadas demasiado rápido.
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } catch {
    setError(t("pdfDownloadError"));
  } finally {
    setBulkExporting(false);
  }
};
const confirmDeleteCvs = async () => {
  if (!deleteCandidates.length) return;
  try {
    setDeleting(true);
    await Promise.all(deleteCandidates.map((cv) => deleteStoredCv(cv.id)));
    setSelectedItems([]);
    setDisablePreview(false);
    setNotice(t("cvsDeleted", { count: deleteCandidates.length }));
    setDeleteCandidates([]);
    await refresh();
  } catch {
    setError(t("libraryLoadError"));
  } finally {
    setDeleting(false);
  }
};
  const exportBackup = async () => {
    try {
      const applications = await listJobApplications();
      downloadJson(
      serializeBackup(items, applications),
      `cv-simple-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
      setNotice(t("backupExported", { cvs: items.length, applications: applications.length }));
    } catch {
      setError(t("backupExportError"));
    }
  };

  const importFile = async (file: File | undefined, backup: boolean) => {
    if (!file) return;
    try {
      const source = await file.text();
      const parsedBackup = backup ? parseBackupFile(source, locale as "es" | "en") : null;
      const imported = parsedBackup?.cvs ?? [parseCvFile(source, locale as "es" | "en")];
      await Promise.all([
        ...imported.map((cv) => putStoredCv(cv)),
        ...(parsedBackup?.applications ?? []).map((application) => putJobApplication(application)),
      ]);
      await refresh();
      setError("");
      setNotice(
        backup
          ? t("backupImported", { count: imported.length, applications: parsedBackup?.applications.length ?? 0, missing: parsedBackup?.missingCvLinks ?? 0 })
          : t("cvImported", { count: imported.length }),
      );
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "invalid_resume";
      setNotice("");
      setError(
        t(
          code === "unsupported_version"
            ? "importUnsupportedVersion"
            : code === "file_too_large"
              ? "importTooLarge"
              : "importInvalid",
        ),
      );
    }
  };

  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale);
    return items.filter(
      (cv) =>
        (languageFilter === "all" || cv.locale === languageFilter) &&
        (!term ||
          `${cv.title} ${cv.data.name} ${cv.data.headline}`
            .toLocaleLowerCase(locale)
            .includes(term)),
    );
  }, [items, languageFilter, locale, search]);
  const pageCount = Math.ceil(visibleItems.length / CVS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const paginatedItems = useMemo(
    () => visibleItems.slice((currentPage - 1) * CVS_PER_PAGE, currentPage * CVS_PER_PAGE),
    [currentPage, visibleItems],
  );

const handleSelect = () => {
  setDisablePreview((prev) => {
    const next = !prev;

    if (!next) {
      setSelectedItems([]);
    }

    return next;
  });
};

const handleSelectItem = (id: string, checked: boolean) => {
  const currentItem = items.find((item) => item.id === id);

  if (!currentItem) return;

  setSelectedItems((current) => {
    if (checked) {
      if (current.some((item) => item.id === id)) {
        return current;
      }

      return [...current, currentItem];
    }

    return current.filter((item) => item.id !== id);
  });
};

const allVisibleSelected =
  visibleItems.length > 0 &&
  visibleItems.every((cv) =>
    selectedItems.some((selected) => selected.id === cv.id),
  );

const handleSelectAll = () => {
  if (allVisibleSelected) {
    const visibleIds = new Set(visibleItems.map((cv) => cv.id));

    setSelectedItems((current) =>
      current.filter((cv) => !visibleIds.has(cv.id)),
    );

    return;
  }

  setSelectedItems((current) => {
    const ids = new Set(current.map((cv) => cv.id));

    return [...current, ...visibleItems.filter((cv) => !ids.has(cv.id))];
  });
};


const getExportLabels = (cv: StoredCv): ExportLabels => {
  const defaults = defaultDocumentLabels[cv.data.documentLocale];

  return {
    summary: cv.data.sectionTitles.summary?.trim() || defaults.summary,

    experience: cv.data.sectionTitles.experience?.trim() || defaults.experience,

    skills: cv.data.sectionTitles.skills?.trim() || defaults.skills,

    contact: cv.data.sectionTitles.contact?.trim() || defaults.contact,

    languages: cv.data.sectionTitles.languages?.trim() || defaults.languages,

    education: cv.data.sectionTitles.education?.trim() || defaults.education,

    certifications:
      cv.data.sectionTitles.certifications?.trim() || defaults.certifications,

    location: cv.data.sectionTitles.location?.trim() || defaults.location,

    phone: cv.data.sectionTitles.phone?.trim() || defaults.phone,

    email: cv.data.sectionTitles.email?.trim() || defaults.email,

    portfolio: cv.data.sectionTitles.portfolio?.trim() || defaults.portfolio,
  };
};
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        className="topbar"
      >
        <Toolbar className="topbar-inner" sx={{ minHeight: 76, gap: 2 }}>
          <BrandLogo />
          <Box sx={{ flexGrow: 1 }} />
          <Box className="desktop-page-actions">
            <Button component="a" href="/" startIcon={<ArrowBackRounded />}>
              {t("backToEditor")}
            </Button>
            <Button component="a" href={locale === "en" ? "/en/applications" : "/es/mis-postulaciones"} startIcon={<WorkOutlineRounded />}>
              {t("myApplications")}
            </Button>
          </Box>
          <MobileNavigationMenu locale={locale} active="cvs" />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight={800}>
              {t("myCvs")}
            </Typography>
            <Typography color="text.secondary" mt={0.5}>
              {t("myCvsDescription")}
            </Typography>
          </Box>
          <ButtonGroup className="library-create-actions" variant="contained" sx={{ alignSelf: { sm: "center" } }}>
            <Button startIcon={<AddRounded />} onClick={() => createNew("es")}>
              {t("newCvEs")}
            </Button>
            <Button
              startIcon={<LanguageRounded />}
              onClick={() => createNew("en")}
            >
              {t("newCvEn")}
            </Button>
          </ButtonGroup>
        </Stack>
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
          >
            {/* Buscar + filtro */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.5}
              sx={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <TextField
                size="small"
                label={t("searchCvs")}
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                sx={{
                  minWidth: {
                    sm: 220,
                  },
                  flex: {
                    xs: 1,
                    sm: "0 1 280px",
                  },
                }}
              />

              <TextField
                select
                size="small"
                label={t("filterByLanguage")}
                value={languageFilter}
                onChange={(event) => { setLanguageFilter(event.target.value as "all" | "es" | "en"); setPage(1); }}
                sx={{
                  minWidth: 190,
                }}
              >
                <MenuItem value="all">{t("allLanguages")}</MenuItem>

                <MenuItem value="es">ES</MenuItem>

                <MenuItem value="en">EN</MenuItem>
              </TextField>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              justifyContent={{
                xs: "space-between",
                md: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<MoreHorizRounded />}
                onClick={(event) => setLibraryMenuAnchor(event.currentTarget)}
              >
                {t("dataAndBackup")}
              </Button>
              <Button
                variant={disablePreview ? "contained" : "outlined"}
                disabled={!items.length}
                onClick={handleSelect}
                startIcon={disablePreview ? <CloseOutlined /> : <CheckBox />}
              >
                {disablePreview ? t("cancelSelection") : t("selectCvs")}
              </Button>
            </Stack>
            <Menu className="library-data-menu" anchorEl={libraryMenuAnchor} open={Boolean(libraryMenuAnchor)} onClose={() => setLibraryMenuAnchor(null)}>
              <MenuItem onClick={() => { setLibraryMenuAnchor(null); importCvInputRef.current?.click(); }}>
                <UploadFileRounded fontSize="small" />{t("importCvJson")}
              </MenuItem>
              <MenuItem onClick={() => { setLibraryMenuAnchor(null); restoreBackupInputRef.current?.click(); }}>
                <SaveAltRounded fontSize="small" />{t("restoreBackup")}
              </MenuItem>
              <MenuItem onClick={() => { void exportBackup(); setLibraryMenuAnchor(null); }}>
                <DownloadRounded fontSize="small" />{t("downloadBackup")}
              </MenuItem>
            </Menu>
            <input
              ref={importCvInputRef}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importFile(event.target.files?.[0], false);
                event.target.value = "";
              }}
            />
            <input
              ref={restoreBackupInputRef}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importFile(event.target.files?.[0], true);
                event.target.value = "";
              }}
            />
          </Stack>
        </Box>
        {disablePreview && (
          <Box className="library-selection-bar">
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography fontWeight={700} color="primary.main">
                  {selectedItems.length === 0
                    ? t("selectionEmpty")
                    : t("selectedCvsCount", { count: selectedItems.length })}
                </Typography>

                <Button size="small" onClick={handleSelectAll}>
                  {allVisibleSelected
                    ? t("deselectAll")
                    : t("selectAll")}
                </Button>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                justifyContent={{
                  xs: "flex-start",
                  sm: "flex-end",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={
                    bulkExporting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PictureAsPdfRounded />
                    )
                  }
                  disabled={!selectedItems.length || bulkExporting}
                  onClick={() => void downloadSelectedPdfs()}
                >
                  {bulkExporting ? t("downloading") : t("downloadSelectedPdf")}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineRounded />}
                  disabled={!selectedItems.length || bulkExporting}
                  onClick={() => setDeleteCandidates(selectedItems)}
                >
                  {t("deleteSelected")}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setNotice("")}
          >
            {notice}
          </Alert>
        )}
        {loading ? (
          <Box display="grid" sx={{ placeItems: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <DescriptionRounded color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h6" mt={1}>
              {t("noSavedCvs")}
            </Typography>
            <Typography color="text.secondary" mb={2}>
              {t("noSavedCvsHelp")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => createNew(locale as "es" | "en")}
            >
              {t("createFirstCv")}
            </Button>
          </Card>
        ) : (
          <>
            {visibleItems.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t("noMatchingCvs")}
              </Alert>
            )}
            <Box className="cv-library-grid">
              {paginatedItems.map((cv) => (
                <Card
                  variant="outlined"
                  key={cv.id}
                  className={`cv-library-card relative${selectedItems.some((selected) => selected.id === cv.id) ? " selected" : ""}${disablePreview ? " selection-enabled" : ""}`}
                  role={disablePreview ? "checkbox" : undefined}
                  tabIndex={disablePreview ? 0 : undefined}
                  aria-checked={disablePreview ? selectedItems.some((selected) => selected.id === cv.id) : undefined}
                  onClick={disablePreview ? () => handleSelectItem(cv.id, !selectedItems.some((selected) => selected.id === cv.id)) : undefined}
                  onKeyDown={disablePreview ? (event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    handleSelectItem(cv.id, !selectedItems.some((selected) => selected.id === cv.id));
                  } : undefined}
                >
                  {disablePreview && (
                    <div className="absolute top-2 right-2 z-10">
                      <Checkbox
                        checked={selectedItems.some(
                          (selected) => selected.id === cv.id,
                        )}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(e) => handleSelectItem(cv.id, e.target.checked)}
                      />
                    </div>
                  )}

                  <PreviewCvModal
                    cv={cv.data}
                    title={cv.title}
                    disabledPreview={disablePreview}
                    exporting={exportingCvId === cv.id ? exportingFormat : null}
                    onOpenCv={() => openCv(cv)}
                    onDownload={(format, previewCv) => void downloadCv(cv, format, previewCv)}
                    onReviewQuality={() => reviewCvQuality(cv)}
                    onAnalyzeJob={() => openJobMatchSetup(cv)}
                  >
                    <Box
                      className="cv-library-preview"
                      sx={
                        {
                          "--library-primary": cv.data.primaryColor,
                        } as React.CSSProperties
                      }
                    >
                      <span />
                      {cv.data.photo ? (
                        <img src={cv.data.photo} alt="" />
                      ) : (
                        <DescriptionRounded />
                      )}
                    </Box>
                  </PreviewCvModal>
                  <CardContent sx={{ pb: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      gap={1}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} noWrap title={cv.title}>
                          {cv.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {cv.data.headline || t("untitledCv")}
                        </Typography>
                      </Box>
                      <Chip size="small" label={cv.locale.toUpperCase()} />
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mt={1.5}
                    >
                      {t("updatedAt", {
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(cv.updatedAt)),
                      })}
                    </Typography>
                  </CardContent>
                  {!disablePreview && <CardActions sx={{ px: 2, pb: 1.5, pt: 1, display: "block" }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={
                        exportingCvId === cv.id && exportingFormat === "pdf" ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <PictureAsPdfRounded />
                        )
                      }
                      disabled={exportingCvId !== null}
                      onClick={() => {
                        void downloadCvPdf(cv);
                      }}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {exportingCvId === cv.id && exportingFormat === "pdf"
                        ? t("generating")
                        : t("downloadPdf")}
                    </Button>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={0.5}
                      sx={{
                        mt: 1.25,
                        pt: 1,
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Button
                        size="small"
                        startIcon={<EditRounded />}
                        onClick={() => openCv(cv)}
                      >
                        {t("openCv")}
                      </Button>
                      <Stack direction="row" spacing={0.25}>
                        <Tooltip title={t("exportCvJson")}>
                          <IconButton
                            size="small"
                            aria-label={t("exportCvJson")}
                            onClick={() => exportCvJson(cv)}
                          >
                            <DownloadRounded />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("duplicateCv")}>
                          <IconButton
                            size="small"
                            aria-label={t("duplicateCv")}
                            onClick={() => duplicateCv(cv)}
                          >
                            <ContentCopyRounded />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("deleteCv")}>
                          <IconButton size="small" color="error" aria-label={t("deleteCv")} onClick={() => setDeleteCandidates([cv])}><DeleteOutlineRounded /></IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </CardActions>}
                </Card>
              ))}
            </Box>
            {pageCount > 1 ? <Box className="library-pagination"><Pagination page={currentPage} count={pageCount} color="primary" showFirstButton showLastButton siblingCount={0} boundaryCount={1} aria-label={t("cvPaginationLabel")} onChange={(_, nextPage) => { setPage(nextPage); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></Box> : null}
          </>
        )}
        <ConfirmModal
          open={deleteCandidates.length > 0}
          title={t(deleteCandidates.length === 1 ? "deleteCvTitle" : "deleteMultipleCvsTitle", { count: deleteCandidates.length })}
          warning={t("deleteIrreversible")}
          message={deleteCandidates.length === 1 ? t("confirmDeleteCv", { title: deleteCandidates[0]?.title ?? "" }) : t("confirmDeleteMultipleCvs", { count: deleteCandidates.length })}
          cancelLabel={t("cancel")}
          confirmLabel={t(deleteCandidates.length === 1 ? "deleteCv" : "deleteSelected")}
          closeLabel={t("closeDeleteConfirmation")}
          loading={deleting}
          onClose={() => setDeleteCandidates([])}
          onConfirm={() => void confirmDeleteCvs()}
        />
        <Dialog className="library-analysis-dialog" open={Boolean(jobMatchCv)} onClose={() => setJobMatchCv(null)} fullWidth maxWidth="sm">
          <DialogTitle>{t("jobMatchAreaTitle")}</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" sx={{ mb: 2 }}>{t("jobMatchAreaHelp")}</Typography>
            <TextField
              select
              fullWidth
              label={t("jobMatchAreaLabel")}
              value={jobFamily}
              onChange={(event) => setJobFamily(event.target.value as JobFamily)}
            >
              {jobFamilies.map((family) => <MenuItem key={family} value={family}>{jobT(`families.${family}`)}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setJobMatchCv(null)}>{t("cancel")}</Button>
            <Button variant="contained" onClick={analyzeCvAgainstJob}>{t("continueToJobMatch")}</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}
