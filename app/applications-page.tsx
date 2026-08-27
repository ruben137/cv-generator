"use client";

import {
  AddRounded,
  ArticleOutlined,
  ArrowBackRounded,
  AssignmentTurnedInRounded,
  BusinessRounded,
  CalendarMonthRounded,
  DescriptionRounded,
  DeleteOutlineRounded,
  EditRounded,
  FilterAltOffRounded,
  LocationOnOutlined,
  OpenInNewRounded,
  ManageSearchRounded,
  AutoFixHighRounded,
  HistoryRounded,
  NoteAddRounded,
  PictureAsPdfRounded,
  SaveAltRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "./site-header";
import ConfirmModal from "./ConfirmModal";
import { listCoverLetters } from "./cover-letter-library";
import type { CoverLetterDraft } from "./cover-letter";
import { createStoredCv, listStoredCvs, putStoredCv, type StoredCv } from "./cv-library";
import { defaultDocumentLabels } from "./cv-data";
import { exportPdf, type ExportLabels } from "./exporters";
import { jobApplicationStatuses, updateJobApplication, type JobApplication, type JobApplicationEvent, type JobApplicationStatus, type NewJobApplicationEvent } from "./job-application";
import { addJobApplication, deleteJobApplication, listJobApplications, putJobApplication } from "./job-application-library";
import { jobFamilies, type JobFamily } from "./job-match/model";
import { writeJobMatchTransfer } from "./job-match/transfer";
import { createImprovementTarget, saveImprovementPlan } from "./improvement-plan";

const theme = createTheme({
  palette: { primary: { main: "#173B63", dark: "#0E2948" }, background: { default: "#F4F6F8", paper: "#FFFFFF" } },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "var(--font-geist-sans), Arial, sans-serif", button: { textTransform: "none", fontWeight: 700 } },
});

const APPLICATIONS_PER_PAGE = 6;

type StatusFilter = "all" | JobApplicationStatus;
type SortMode = "updated-desc" | "applied-desc" | "company-asc";
type DateRangeFilter = "all" | "today" | "7-days" | "30-days" | "90-days";
type ApplicationEditor = {
  id: string | null;
  company: string;
  role: string;
  url: string;
  location: string;
  description: string;
  language: "es" | "en";
  jobFamily: JobFamily;
  status: JobApplicationStatus;
  appliedAt: string;
  notes: string;
  cvId: string;
};

const LAST_JOB_FAMILY_KEY = "cv-simple-last-job-family";
const toCalendarDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyEditor = (language: "es" | "en", jobFamily: JobFamily = "general"): ApplicationEditor => ({
  id: null, company: "", role: "", url: "", location: "", description: "", language,
  jobFamily, status: "saved", appliedAt: toCalendarDate(), notes: "", cvId: "",
});

const getExportLabels = (cv: StoredCv): ExportLabels => {
  const defaults = defaultDocumentLabels[cv.data.documentLocale];
  return {
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
};

export function ApplicationsPage() {
  const t = useTranslations("Applications");
  const jobT = useTranslations("JobMatch");
  const locale = useLocale();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [cvs, setCvs] = useState<StoredCv[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetterDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [sort, setSort] = useState<SortMode>("updated-desc");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<ApplicationEditor | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<JobApplication | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [exportingCvId, setExportingCvId] = useState<string | null>(null);
  const [adaptationCandidate, setAdaptationCandidate] = useState<{ application: JobApplication; cv: StoredCv } | null>(null);
  const [adaptedCvTitle, setAdaptedCvTitle] = useState("");
  const [adapting, setAdapting] = useState(false);
  const [historyApplication, setHistoryApplication] = useState<JobApplication | null>(null);
  const [timelineNote, setTimelineNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const automaticAdaptationHandled = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [nextApplications, nextCvs, nextCoverLetters] = await Promise.all([listJobApplications(), listStoredCvs(), listCoverLetters()]);
      setApplications(nextApplications);
      setCvs(nextCvs);
      setCoverLetters(nextCoverLetters);
      setError("");
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
    const handlePageShow = () => void refresh();
    const handleVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  const cvById = useMemo(() => new Map(cvs.map((cv) => [cv.id, cv])), [cvs]);
  const coverLetterByApplication = useMemo(() => {
    const result = new Map<string, CoverLetterDraft>();
    for (const letter of coverLetters) if (!result.has(letter.applicationId)) result.set(letter.applicationId, letter);
    return result;
  }, [coverLetters]);
  const dateFilteredApplications = useMemo(() => {
    if (dateRange === "all") return applications;
    const days = dateRange === "today" ? 1 : dateRange === "7-days" ? 7 : dateRange === "30-days" ? 30 : 90;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const startDate = toCalendarDate(start);
    const today = toCalendarDate();
    return applications.filter((application) => {
      const applicationDate = application.appliedAt || toCalendarDate(new Date(application.createdAt));
      return applicationDate >= startDate && applicationDate <= today;
    });
  }, [applications, dateRange]);
  const counts = useMemo(() => {
    const result = Object.fromEntries(jobApplicationStatuses.map((item) => [item, 0])) as Record<JobApplicationStatus, number>;
    for (const application of dateFilteredApplications) result[application.status] += 1;
    return result;
  }, [dateFilteredApplications]);

  const visibleApplications = useMemo(() => {
    const term = deferredSearch.trim().toLocaleLowerCase(locale);
    const filtered = dateFilteredApplications.filter((application) => {
      if (status !== "all" && application.status !== status) return false;
      if (!term) return true;
      return `${application.company} ${application.role} ${application.location} ${application.notes}`
        .toLocaleLowerCase(locale)
        .includes(term);
    });
    return filtered.toSorted((left, right) => {
      if (sort === "company-asc") return left.company.localeCompare(right.company, locale);
      if (sort === "applied-desc") return (right.appliedAt || right.createdAt).localeCompare(left.appliedAt || left.createdAt);
      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [dateFilteredApplications, deferredSearch, locale, sort, status]);
  const pageCount = Math.ceil(visibleApplications.length / APPLICATIONS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const paginatedApplications = useMemo(
    () => visibleApplications.slice((currentPage - 1) * APPLICATIONS_PER_PAGE, currentPage * APPLICATIONS_PER_PAGE),
    [currentPage, visibleApplications],
  );

  const openCreate = () => {
    const storedFamily = window.localStorage.getItem(LAST_JOB_FAMILY_KEY);
    const jobFamily = jobFamilies.includes(storedFamily as JobFamily) ? storedFamily as JobFamily : "general";
    setEditor(emptyEditor(locale === "en" ? "en" : "es", jobFamily));
  };
  const openEdit = (application: JobApplication) => setEditor({
    id: application.id, company: application.company, role: application.role, url: application.url,
    location: application.location, description: application.description, language: application.language,
    jobFamily: application.jobFamily, status: application.status, appliedAt: application.appliedAt,
    notes: application.notes, cvId: application.cvId ?? "",
  });
  const updateEditor = <Key extends keyof ApplicationEditor>(key: Key, value: ApplicationEditor[Key]) =>
    setEditor((current) => current ? { ...current, [key]: value } : current);
  const updateJobFamily = (jobFamily: JobFamily) => {
    window.localStorage.setItem(LAST_JOB_FAMILY_KEY, jobFamily);
    updateEditor("jobFamily", jobFamily);
  };

  const saveApplication = async () => {
    if (!editor?.company.trim() || !editor.role.trim()) return;
    try {
      setSaving(true);
      const changes = {
        company: editor.company, role: editor.role, url: editor.url, location: editor.location,
        description: editor.description, language: editor.language, jobFamily: editor.jobFamily,
        status: editor.status, appliedAt: editor.appliedAt, notes: editor.notes, cvId: editor.cvId || null,
      };
      if (editor.id) {
        const existing = applications.find((application) => application.id === editor.id);
        if (existing) {
          const event: NewJobApplicationEvent = existing.status !== changes.status
            ? { type: "status-changed" as const, detail: "", metadata: { from: existing.status, to: changes.status } }
            : existing.cvId !== changes.cvId
              ? { type: "cv-linked" as const, detail: "", metadata: { cvId: changes.cvId ?? "" } }
              : { type: "updated" as const, detail: "", metadata: {} };
          await putJobApplication(updateJobApplication(existing, changes, event));
        }
      } else {
        await addJobApplication(changes);
      }
      setEditor(null);
      await refresh();
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (application: JobApplication) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
    .format(new Date(application.appliedAt ? `${application.appliedAt}T12:00:00` : application.updatedAt));

  const clearFilters = () => { setSearch(""); setStatus("all"); setDateRange("all"); setSort("updated-desc"); setPage(1); };
  const safeExternalUrl = (value: string) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch { return ""; }
  };
  const editorUrlIsValid = !editor?.url.trim() || Boolean(safeExternalUrl(editor.url));
  const changeStatus = async (application: JobApplication, nextStatus: JobApplicationStatus) => {
    try {
      setUpdatingStatusId(application.id);
      const appliedAt = nextStatus === "applied" && !application.appliedAt
        ? new Date().toISOString().slice(0, 10)
        : application.appliedAt;
      await putJobApplication(updateJobApplication(application, { status: nextStatus, appliedAt }, {
        type: "status-changed", detail: "", metadata: { from: application.status, to: nextStatus },
      }));
      await refresh();
    } catch { setError(t("saveError")); }
    finally { setUpdatingStatusId(null); }
  };
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      await deleteJobApplication(deleteCandidate.id);
      setDeleteCandidate(null);
      await refresh();
    } catch { setError(t("deleteError")); }
    finally { setDeleting(false); }
  };
  const analyzeApplication = (application: JobApplication, linkedCv: StoredCv) => {
    writeJobMatchTransfer(window.localStorage, linkedCv.data, application.jobFamily, linkedCv.id, {
      applicationId: application.id,
      title: application.role,
      description: application.description,
      language: application.language,
    });
    window.location.assign(locale === "en" ? "/en/job-match?source=application" : "/es/analizar-vacante?source=application");
  };
  const downloadApplicationCv = async (cv: StoredCv) => {
    try {
      setExportingCvId(cv.id);
      setError("");
      await exportPdf(cv.data, getExportLabels(cv), cv.title);
    } catch {
      setError(t("downloadCvError"));
    } finally {
      setExportingCvId(null);
    }
  };
  const openAdaptation = (application: JobApplication, cv: StoredCv) => {
    setAdaptationCandidate({ application, cv });
    setAdaptedCvTitle(`${application.role} · ${application.company}`.slice(0, 120));
  };
  useEffect(() => {
    if (loading || automaticAdaptationHandled.current) return;
    const applicationId = new URLSearchParams(window.location.search).get("adapt");
    if (!applicationId) return;
    automaticAdaptationHandled.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    const application = applications.find((item) => item.id === applicationId);
    const linkedCv = application?.cvId ? cvById.get(application.cvId) : undefined;
    if (application && linkedCv) {
      queueMicrotask(() => {
        setAdaptationCandidate({ application, cv: linkedCv });
        setAdaptedCvTitle(`${application.role} · ${application.company}`.slice(0, 120));
      });
    } else queueMicrotask(() => setError(t("missingCv")));
  }, [applications, cvById, loading, t]);
  const adaptCv = async () => {
    if (!adaptationCandidate || !adaptedCvTitle.trim()) return;
    const { application, cv } = adaptationCandidate;
    try {
      setAdapting(true);
      const copy = createStoredCv(structuredClone(cv.data), cv.locale, adaptedCvTitle);
      await putStoredCv(copy);
      if (application.selectedImprovements.length) {
        saveImprovementPlan(window.localStorage, {
          source: "job-match",
          target: createImprovementTarget(copy.data, copy.id),
          suggestions: application.selectedImprovements.map((improvement, index) => ({
            id: `application-${application.id}-${index}`,
            kind: "review-section" as const,
            section: "general" as const,
            title: improvement,
            detail: t("adaptImprovementDetail"),
          })),
        });
      }
      await putJobApplication(updateJobApplication(application, {
        sourceCvId: application.sourceCvId ?? application.cvId,
        cvId: copy.id,
        status: application.status === "saved" ? "preparing" : application.status,
      }, { type: "cv-adapted", detail: "", metadata: { cvId: copy.id, title: copy.title, sourceCvId: application.sourceCvId ?? application.cvId ?? "" } }));
      setAdaptationCandidate(null);
      window.location.assign(`/${locale}?cv=${encodeURIComponent(copy.id)}#generator`);
    } catch { setError(t("adaptError")); }
    finally { setAdapting(false); }
  };
  const eventDescription = (event: JobApplicationEvent) => {
    if (event.type === "status-changed") return t("historyStatus", {
      from: t(`statuses.${String(event.metadata.from)}`), to: t(`statuses.${String(event.metadata.to)}`),
    });
    if (event.type === "analysis") return t("historyAnalysis", { score: Number(event.metadata.score) || 0 });
    if (event.type === "improvements") return t("historyImprovements", { count: Number(event.metadata.count) || 0 });
    if (event.type === "cv-adapted") return t("historyAdapted", { title: String(event.metadata.title ?? "") });
    if (event.type === "cv-linked") return t("historyLinked");
    if (event.type === "note") return event.detail;
    return t(`historyTypes.${event.type}`);
  };
  const addTimelineNote = async () => {
    if (!historyApplication || !timelineNote.trim()) return;
    try {
      setAddingNote(true);
      const updated = updateJobApplication(historyApplication, {}, {
        type: "note", detail: timelineNote, metadata: {},
      });
      await putJobApplication(updated);
      setHistoryApplication(updated);
      setTimelineNote("");
      await refresh();
    } catch { setError(t("saveError")); }
    finally { setAddingNote(false); }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SiteHeader locale={locale} active="applications" actions={
        <Box className="desktop-page-actions">
            <Button component="a" href="/mis-cvs" startIcon={<ArrowBackRounded />}>{t("backToCvs")}</Button>
        </Box>
      } />

      <Container maxWidth={false} disableGutters className="site-content" sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2} mb={3}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="h1" fontWeight={800}>{t("title")}</Typography>
            <Typography color="text.secondary" mt={0.5}>{t("description")}</Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} flexShrink={0}>
            <Button sx={{ whiteSpace: "nowrap" }} variant="outlined" component="a" href="/mis-cvs" startIcon={<SaveAltRounded />}>{t("manageBackup")}</Button>
            <Button sx={{ whiteSpace: "nowrap" }} variant="contained" startIcon={<AddRounded />} onClick={openCreate}>{t("newApplication")}</Button>
          </Stack>
        </Stack>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Alert severity="info" className="applications-privacy-notice">{t("privacyNotice")}</Alert>

        <Box className="applications-summary" aria-label={t("summaryLabel")} role="group">
          {jobApplicationStatuses.map((item) => (
            <button key={item} type="button" className={`application-summary-card status-${item}${status === item ? " active" : ""}`} onClick={() => { setStatus(status === item ? "all" : item); setPage(1); }} aria-pressed={status === item}>
              <span>{t(`statuses.${item}`)}</span><strong>{counts[item]}</strong>
            </button>
          ))}
        </Box>

        <Card variant="outlined" className="applications-toolbar">
          <TextField
            size="small"
            label={t("search")}
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }}
          />
          <TextField select size="small" label={t("filterDateRangeCount", { count: dateFilteredApplications.length })} value={dateRange} onChange={(event) => { setDateRange(event.target.value as DateRangeFilter); setPage(1); }}>
            <MenuItem value="all">{t("dateRanges.all")}</MenuItem>
            <MenuItem value="today">{t("dateRanges.today")}</MenuItem>
            <MenuItem value="7-days">{t("dateRanges.sevenDays")}</MenuItem>
            <MenuItem value="30-days">{t("dateRanges.thirtyDays")}</MenuItem>
            <MenuItem value="90-days">{t("dateRanges.ninetyDays")}</MenuItem>
          </TextField>
          <TextField select size="small" label={t("filterStatus")} value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }}>
            <MenuItem value="all">{t("allStatuses")}</MenuItem>
            {jobApplicationStatuses.map((item) => <MenuItem key={item} value={item}>{t(`statuses.${item}`)}</MenuItem>)}
          </TextField>
          <TextField select size="small" label={t("sortBy")} value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setPage(1); }}>
            <MenuItem value="updated-desc">{t("sortUpdated")}</MenuItem>
            <MenuItem value="applied-desc">{t("sortApplied")}</MenuItem>
            <MenuItem value="company-asc">{t("sortCompany")}</MenuItem>
          </TextField>
          {(search || status !== "all" || dateRange !== "all" || sort !== "updated-desc") ? <Button startIcon={<FilterAltOffRounded />} onClick={clearFilters}>{t("clearFilters")}</Button> : null}
        </Card>

        {loading ? (
          <Box display="grid" sx={{ placeItems: "center", py: 10 }}><CircularProgress /></Box>
        ) : applications.length === 0 ? (
          <Card variant="outlined" className="applications-empty">
            <AssignmentTurnedInRounded color="primary" sx={{ fontSize: 52 }} />
            <Typography variant="h6" fontWeight={800}>{t("emptyTitle")}</Typography>
            <Typography color="text.secondary">{t("emptyDescription")}</Typography>
            <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate}>{t("createFirst")}</Button>
          </Card>
        ) : visibleApplications.length === 0 ? (
          <Alert severity="info" action={<Button size="small" onClick={clearFilters}>{t("clearFilters")}</Button>}>{t("noResults")}</Alert>
        ) : (
          <>
          <Box className="applications-grid">
            {paginatedApplications.map((application) => {
              const linkedCv = application.cvId ? cvById.get(application.cvId) : undefined;
              const sourceCv = application.sourceCvId ? cvById.get(application.sourceCvId) : undefined;
              const downloadableCv = linkedCv ?? sourceCv;
              const coverLetter = coverLetterByApplication.get(application.id);
              const jobUrl = safeExternalUrl(application.url);
              return (
                <Card variant="outlined" key={application.id} className={`application-card status-${application.status}`}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={800}>{application.company}</Typography>
                        <Typography variant="h6" fontWeight={800}>{application.role}</Typography>
                      </Box>
                      <Chip size="small" className={`application-status status-${application.status}`} label={t(`statuses.${application.status}`)} />
                    </Stack>
                    <Stack className="application-meta" mt={2} gap={0.75}>
                      {application.location ? <span><LocationOnOutlined fontSize="small" />{application.location}</span> : null}
                      <span><CalendarMonthRounded fontSize="small" />{application.appliedAt ? t("appliedOn", { date: formatDate(application) }) : t("updatedOn", { date: formatDate(application) })}</span>
                      <span><DescriptionRounded fontSize="small" />{linkedCv ? t("linkedCv", { title: linkedCv.title }) : t(application.cvId ? "missingCv" : "noLinkedCv")}</span>
                      {coverLetter ? <span><ArticleOutlined fontSize="small" />{t("coverLetterSaved")}</span> : null}
                    </Stack>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      className="application-quick-status"
                      label={t("quickStatus")}
                      value={application.status}
                      disabled={updatingStatusId === application.id}
                      onChange={(event) => void changeStatus(application, event.target.value as JobApplicationStatus)}
                    >
                      {jobApplicationStatuses.map((item) => <MenuItem key={item} value={item}>{t(`statuses.${item}`)}</MenuItem>)}
                    </TextField>
                    {application.lastAnalysis ? <Box className="application-score"><strong>{application.lastAnalysis.score}%</strong><span>{t("lastMatch")}</span></Box> : null}
                    {application.selectedImprovements.length ? <Box className="application-improvements">
                      <Typography variant="caption" fontWeight={800}>{t("savedImprovements")}</Typography>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {application.selectedImprovements.slice(0, 3).map((item) => <Chip key={item} size="small" label={item} />)}
                        {application.selectedImprovements.length > 3 ? <Chip size="small" label={`+${application.selectedImprovements.length - 3}`} /> : null}
                      </Stack>
                    </Box> : null}
                    <Stack className="application-card-actions" direction="row" gap={0.75} flexWrap="wrap">
                      <Button variant="outlined" size="small" startIcon={<EditRounded />} onClick={() => openEdit(application)}>{t("edit")}</Button>
                      {downloadableCv ? <Button className="application-download-action" variant="outlined" size="small" startIcon={exportingCvId === downloadableCv.id ? <CircularProgress size={15} color="inherit" /> : <PictureAsPdfRounded />} disabled={Boolean(exportingCvId)} onClick={() => void downloadApplicationCv(downloadableCv)}>{t(exportingCvId === downloadableCv.id ? "downloadingCv" : "downloadCv")}</Button> : null}
                      {linkedCv ? <Button className="application-analyze-action" size="small" startIcon={<ManageSearchRounded />} onClick={() => analyzeApplication(application, linkedCv)}>{t("analyzeApplication")}</Button> : null}
                      {linkedCv ? <Button className="application-adapt-action" size="small" startIcon={<AutoFixHighRounded />} onClick={() => openAdaptation(application, linkedCv)}>{t(application.sourceCvId ? "createAnotherVersion" : "adaptCv")}</Button> : null}
                      {coverLetter ? <Button className="application-cover-letter-action" size="small" component="a" href={`${locale === "en" ? "/en/cover-letter" : "/es/carta-presentacion"}?draft=${encodeURIComponent(coverLetter.id)}`} startIcon={<ArticleOutlined />}>{t("openCoverLetter")}</Button> : linkedCv ? <Button className="application-cover-letter-action" size="small" component="a" href={`${locale === "en" ? "/en/cover-letter" : "/es/carta-presentacion"}?application=${encodeURIComponent(application.id)}`} startIcon={<ArticleOutlined />}>{t("createCoverLetter")}</Button> : null}
                      {linkedCv ? <Button size="small" component="a" href={`/${locale}?cv=${encodeURIComponent(linkedCv.id)}#generator`} startIcon={<DescriptionRounded />}>{t(application.sourceCvId ? "openAdaptedCv" : "openLinkedCv")}</Button> : null}
                      {sourceCv && sourceCv.id !== linkedCv?.id ? <Button size="small" component="a" href={`/${locale}?cv=${encodeURIComponent(sourceCv.id)}#generator`}>{t("openOriginalCv")}</Button> : null}
                      {jobUrl ? <Button size="small" component="a" href={jobUrl} target="_blank" rel="noreferrer" endIcon={<OpenInNewRounded />}>{t("openJob")}</Button> : null}
                      <Button size="small" startIcon={<HistoryRounded />} onClick={() => setHistoryApplication(application)}>{t("history")}</Button>
                      <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => setDeleteCandidate(application)}>{t("delete")}</Button>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          {pageCount > 1 ? <Box className="library-pagination"><Pagination page={currentPage} count={pageCount} color="primary" showFirstButton showLastButton siblingCount={0} boundaryCount={1} aria-label={t("paginationLabel")} onChange={(_, nextPage) => { setPage(nextPage); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></Box> : null}
          </>
        )}
      </Container>

      <Dialog open={Boolean(editor)} onClose={() => !saving && setEditor(null)} fullWidth maxWidth="md" className="application-editor-dialog">
        <DialogTitle>{t(editor?.id ? "editTitle" : "createTitle")}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{t("createHelp")}</Typography>
          {editor ? <Box className="application-editor-grid">
            <TextField autoFocus required label={t("company")} value={editor.company} onChange={(event) => updateEditor("company", event.target.value)} inputProps={{ maxLength: 100 }} />
            <TextField required label={t("role")} value={editor.role} onChange={(event) => updateEditor("role", event.target.value)} inputProps={{ maxLength: 100 }} />
            <TextField label={t("location")} value={editor.location} onChange={(event) => updateEditor("location", event.target.value)} inputProps={{ maxLength: 120 }} />
            <TextField label={t("url")} type="url" value={editor.url} onChange={(event) => updateEditor("url", event.target.value)} error={!editorUrlIsValid} helperText={!editorUrlIsValid ? t("invalidUrl") : t("urlHelp")} inputProps={{ maxLength: 500 }} />
            <TextField select label={t("statusLabel")} value={editor.status} onChange={(event) => updateEditor("status", event.target.value as JobApplicationStatus)}>
              {jobApplicationStatuses.map((item) => <MenuItem key={item} value={item}>{t(`statuses.${item}`)}</MenuItem>)}
            </TextField>
            <TextField label={t("appliedAt")} type="date" value={editor.appliedAt} onChange={(event) => updateEditor("appliedAt", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField select label={t("professionalArea")} value={editor.jobFamily} onChange={(event) => updateJobFamily(event.target.value as JobFamily)}>
              {jobFamilies.map((family) => <MenuItem key={family} value={family}>{jobT(`families.${family}`)}</MenuItem>)}
            </TextField>
            <TextField select label={t("language")} value={editor.language} onChange={(event) => updateEditor("language", event.target.value as "es" | "en")}>
              <MenuItem value="es">Español</MenuItem><MenuItem value="en">English</MenuItem>
            </TextField>
            <TextField select label={t("linkedResume")} value={editor.cvId} onChange={(event) => updateEditor("cvId", event.target.value)}>
              <MenuItem value="">{t("noLinkedCv")}</MenuItem>
              {cvs.map((cv) => <MenuItem key={cv.id} value={cv.id}>{cv.title} · {cv.locale.toUpperCase()}</MenuItem>)}
            </TextField>
            <TextField className="application-editor-wide" multiline minRows={5} label={t("jobDescription")} value={editor.description} onChange={(event) => updateEditor("description", event.target.value)} helperText={`${editor.description.length}/16000`} inputProps={{ maxLength: 16000 }} />
            <TextField className="application-editor-wide" multiline minRows={3} label={t("notes")} value={editor.notes} onChange={(event) => updateEditor("notes", event.target.value)} helperText={`${editor.notes.length}/4000`} inputProps={{ maxLength: 4000 }} />
          </Box> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditor(null)} disabled={saving}>{t("cancel")}</Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <BusinessRounded />} disabled={saving || !editor?.company.trim() || !editor.role.trim() || !editorUrlIsValid} onClick={() => void saveApplication()}>{t("save")}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmModal
        open={Boolean(deleteCandidate)}
        title={t("deleteTitle")}
        warning={t("deleteWarning")}
        message={t("deleteMessage", { role: deleteCandidate?.role ?? "", company: deleteCandidate?.company ?? "" })}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        closeLabel={t("closeDelete")}
        loading={deleting}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => void confirmDelete()}
      />
      <Dialog open={Boolean(adaptationCandidate)} onClose={() => !adapting && setAdaptationCandidate(null)} fullWidth maxWidth="sm" className="application-adapt-dialog">
        <DialogTitle>{t("adaptTitle")}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>{t("adaptSafety")}</Alert>
          <TextField fullWidth autoFocus label={t("adaptedCvName")} value={adaptedCvTitle} onChange={(event) => setAdaptedCvTitle(event.target.value)} inputProps={{ maxLength: 120 }} helperText={t("adaptNameHelp")} />
          <Box className="application-adapt-summary">
            <Typography fontWeight={800}>{t("adaptIncludedTitle")}</Typography>
            {adaptationCandidate?.application.selectedImprovements.length ? <Stack direction="row" gap={0.5} flexWrap="wrap">
              {adaptationCandidate.application.selectedImprovements.map((item) => <Chip key={item} size="small" label={item} />)}
            </Stack> : <Typography color="text.secondary" variant="body2">{t("adaptNoImprovements")}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={adapting} onClick={() => setAdaptationCandidate(null)}>{t("cancel")}</Button>
          <Button variant="contained" disabled={adapting || !adaptedCvTitle.trim()} startIcon={adapting ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighRounded />} onClick={() => void adaptCv()}>{t("createAdaptedCv")}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(historyApplication)} onClose={() => !addingNote && setHistoryApplication(null)} fullWidth maxWidth="sm" className="application-history-dialog">
        <DialogTitle>{t("historyTitle")}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{historyApplication ? t("historyHelp", { role: historyApplication.role, company: historyApplication.company }) : ""}</Typography>
          <Box className="application-timeline">
            {historyApplication?.history.toReversed().map((event) => <article key={event.id} className={`timeline-event event-${event.type}`}>
              <i aria-hidden="true" />
              <div><strong>{eventDescription(event)}</strong><time dateTime={event.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}</time></div>
            </article>)}
          </Box>
          <Box className="application-note-composer">
            <TextField fullWidth multiline minRows={2} label={t("newTimelineNote")} value={timelineNote} onChange={(event) => setTimelineNote(event.target.value)} inputProps={{ maxLength: 500 }} helperText={`${timelineNote.length}/500`} />
            <Button variant="outlined" startIcon={addingNote ? <CircularProgress size={16} /> : <NoteAddRounded />} disabled={addingNote || !timelineNote.trim()} onClick={() => void addTimelineNote()}>{t("addNote")}</Button>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryApplication(null)}>{t("closeHistory")}</Button></DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
