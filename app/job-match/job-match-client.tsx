"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { BrandLogo } from "../brand-logo";
import { listStoredCvs, type StoredCv } from "../cv-library";
import { getJobApplication, listJobApplications, putJobApplication } from "../job-application-library";
import { updateJobApplication, type JobApplication } from "../job-application";
import { createImprovementTarget, saveImprovementPlan, type ImprovementTarget } from "../improvement-plan";
import { cvDataToMatchInput } from "./cv-adapter";
import {
  analyzeJobMatch,
  consumeJobMatchTransfer,
  jobFamilies,
  parsePastedResume,
  resumeMatchInputToText,
  type JobFamily,
  type JobMatchAnalysis,
  type JobMatchLanguage,
  type MatchType,
  type ResumeMatchInput,
} from ".";

type FormValues = {
  jobFamily: JobFamily;
  jobTitle: string;
  jobDescription: string;
  resumeTitle: string;
  resumeText: string;
};

const componentIds = ["skills", "keywords", "title", "evidence"] as const;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_PDF_PAGES = 10;
const MAX_RESUME_CHARACTERS = 16000;

function normalizeExtractedPdfText(parts: string[]): string {
  return parts
    .join("\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function persistApplicationAnalysis(applicationId: string, result: JobMatchAnalysis) {
  const application = await getJobApplication(applicationId);
  if (!application) return;
  await putJobApplication(updateJobApplication(application, {
    lastAnalysis: {
      analyzedAt: result.analyzedAt,
      score: result.score.percentage,
      matchingTerms: [...new Set(result.matches.map((item) => item.jobTerm.original))],
      missingTerms: [...new Set(result.missingRequirements.map((item) => item.term.original))],
    },
  }, { type: "analysis", detail: "", metadata: { score: result.score.percentage } }));
}

async function persistSelectedImprovements(applicationId: string, selectedImprovements: string[]) {
  const application = await getJobApplication(applicationId);
  if (!application) return;
  await putJobApplication(updateJobApplication(application, { selectedImprovements }, {
    type: "improvements", detail: "", metadata: { count: selectedImprovements.length },
  }));
}

export function JobMatchClient() {
  const t = useTranslations("JobMatch");
  const visualTerms = t.raw("visualTerms") as string[];
  const locale = (useLocale() === "en" ? "en" : "es") as JobMatchLanguage;
  const homePath = `/${locale}`;
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [linkedResume, setLinkedResume] = useState<ResumeMatchInput | null>(null);
  const [improvementTarget, setImprovementTarget] = useState<ImprovementTarget | null>(null);
  const [loadedFromEditor, setLoadedFromEditor] = useState(false);
  const [linkedApplicationId, setLinkedApplicationId] = useState<string | null>(null);
  const [storedApplications, setStoredApplications] = useState<JobApplication[]>([]);
  const [storedApplicationsLoading, setStoredApplicationsLoading] = useState(true);
  const [applicationSelectorOpen, setApplicationSelectorOpen] = useState(false);
  const [selectedImprovementItems, setSelectedImprovementItems] = useState<string[]>([]);
  const [resumeLanguage, setResumeLanguage] = useState<JobMatchLanguage>(locale);
  const [jobLanguage, setJobLanguage] = useState<JobMatchLanguage>(locale);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfDragging, setPdfDragging] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ severity: "success" | "warning" | "error"; message: string } | null>(null);
  const [cvSelectorOpen, setCvSelectorOpen] = useState(false);
  const [storedCvs, setStoredCvs] = useState<StoredCv[]>([]);
  const [storedCvsLoading, setStoredCvsLoading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfDragDepthRef = useRef(0);
  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    defaultValues: { jobFamily: "general", jobTitle: "", jobDescription: "", resumeTitle: "", resumeText: "" },
  });
  const jobLength = useWatch({ control, name: "jobDescription" }).length;
  const resumeLength = useWatch({ control, name: "resumeText" }).length;
  const faqItems = t.raw("faqItems") as Array<{ question: string; answer: string }>;

  useEffect(() => {
    let active = true;
    void listJobApplications()
      .then((applications) => { if (active) setStoredApplications(applications); })
      .catch(() => { if (active) setStoredApplications([]); })
      .finally(() => { if (active) setStoredApplicationsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("source");
    if (!source || !["editor", "library", "application"].includes(source)) return;
    const transfer = consumeJobMatchTransfer(window.localStorage);
    if (!transfer) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLinkedResume(transfer.resume);
      setImprovementTarget(transfer.target);
      setLoadedFromEditor(true);
      setResumeLanguage(transfer.language);
      setValue("jobFamily", transfer.jobFamily);
      setValue("resumeTitle", transfer.resume.title);
      setValue("resumeText", resumeMatchInputToText(transfer.resume, transfer.language));
      if (transfer.job) {
        setLinkedApplicationId(transfer.job.applicationId);
        setJobLanguage(transfer.job.language);
        setValue("jobTitle", transfer.job.title);
        setValue("jobDescription", transfer.job.description);
        if (transfer.job.description.trim().length >= 80) {
          const result = analyzeJobMatch({
            title: transfer.job.title,
            text: transfer.job.description,
            language: transfer.job.language,
            jobFamily: transfer.jobFamily,
          }, transfer.resume);
          setAnalysis(result);
          void persistApplicationAnalysis(transfer.job.applicationId, result);
          requestAnimationFrame(() => document.querySelector("#job-match-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
      }
    });
    return () => { active = false; };
  }, [setValue]);

  const groupedMatches = useMemo(() => {
    if (!analysis) return { strong: [], related: [] };
    return {
      strong: analysis.matches.filter((match) => match.matchType === "exact" || match.matchType === "alias"),
      related: analysis.matches.filter((match) => match.matchType !== "exact" && match.matchType !== "alias"),
    };
  }, [analysis]);

  const groupedRecommendations = useMemo(() => {
    if (!analysis) return { missingTerms: [] as string[], general: [] };
    const skillReviews = analysis.recommendations.filter((item) => item.kind === "review-skill");
    return {
      missingTerms: [...new Set(skillReviews.flatMap((item) => item.relatedTerms))],
      general: analysis.recommendations.filter((item) => item.kind !== "review-skill"),
    };
  }, [analysis]);

  const onSubmit = (values: FormValues) => {
    const resume = linkedResume ?? parsePastedResume(values.resumeTitle, values.resumeText, resumeLanguage);
    const result = analyzeJobMatch({
      title: values.jobTitle,
      text: values.jobDescription,
      language: jobLanguage,
      jobFamily: values.jobFamily,
    }, resume);
    setAnalysis(result);
    if (linkedApplicationId) void persistApplicationAnalysis(linkedApplicationId, result);
    setSelectedImprovementItems([]);
    requestAnimationFrame(() => document.querySelector("#job-match-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const selectStoredApplication = (applicationId: string) => {
    if (!applicationId) {
      setLinkedApplicationId(null);
      setApplicationSelectorOpen(false);
      return;
    }
    const application = storedApplications.find((item) => item.id === applicationId);
    if (!application) return;
    setLinkedApplicationId(application.id);
    setJobLanguage(application.language);
    setValue("jobFamily", application.jobFamily, { shouldDirty: true, shouldValidate: true });
    setValue("jobTitle", application.role, { shouldDirty: true, shouldValidate: true });
    setValue("jobDescription", application.description, { shouldDirty: true, shouldValidate: true });
    setAnalysis(null);
    setApplicationSelectorOpen(false);
  };

  const openStoredCvSelector = async () => {
    setCvSelectorOpen(true);
    setStoredCvsLoading(true);
    try { setStoredCvs(await listStoredCvs()); }
    finally { setStoredCvsLoading(false); }
  };

  const selectStoredCv = (stored: StoredCv) => {
    const resume = cvDataToMatchInput(stored.data);
    setLinkedResume(resume);
    setImprovementTarget(createImprovementTarget(stored.data, stored.id));
    setLoadedFromEditor(true);
    setResumeLanguage(stored.locale);
    setValue("resumeTitle", resume.title, { shouldDirty: true });
    setValue("resumeText", resumeMatchInputToText(resume, stored.locale), { shouldDirty: true });
    setAnalysis(null);
    setPdfNotice(null);
    setCvSelectorOpen(false);
  };

  const importResumePdf = async (file?: File) => {
    if (!file) return;
    setPdfNotice(null);

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfNotice({ severity: "error", message: t("pdfInvalidType") });
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setPdfNotice({ severity: "error", message: t("pdfTooLarge") });
      return;
    }

    setPdfImporting(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      }
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await loadingTask.promise;
      if (pdf.numPages > MAX_PDF_PAGES) {
        await loadingTask.destroy();
        setPdfNotice({ severity: "error", message: t("pdfTooManyPages") });
        return;
      }

      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        let pageText = "";
        for (const item of content.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          pageText += `${item.str}${"hasEOL" in item && item.hasEOL ? "\n" : " "}`;
        }
        pages.push(pageText.trim());
        page.cleanup();
      }
      await loadingTask.destroy();

      const extractedText = normalizeExtractedPdfText(pages);
      if (extractedText.length < 20) {
        setPdfNotice({ severity: "error", message: t("pdfNoText") });
        return;
      }

      const truncated = extractedText.length > MAX_RESUME_CHARACTERS;
      setValue("resumeText", extractedText.slice(0, MAX_RESUME_CHARACTERS), { shouldDirty: true, shouldValidate: true });
      setLinkedResume(null);
      setImprovementTarget(null);
      setLoadedFromEditor(false);
      setAnalysis(null);
      setPdfNotice({ severity: truncated ? "warning" : "success", message: t(truncated ? "pdfImportedTruncated" : "pdfImported", { name: file.name }) });
    } catch {
      setPdfNotice({ severity: "error", message: t("pdfReadError") });
    } finally {
      setPdfImporting(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const sendImprovementsToGenerator = async () => {
    if (!analysis || !improvementTarget) return;
    if (linkedApplicationId) {
      await persistSelectedImprovements(linkedApplicationId, selectedImprovementDescriptions);
      const applicationsPath = locale === "en" ? "/en/applications" : "/es/mis-postulaciones";
      window.location.assign(`${applicationsPath}?adapt=${encodeURIComponent(linkedApplicationId)}`);
      return;
    }
    const missingTerms = [...new Set(analysis.missingRequirements.map((item) => item.term.original))];
    const suggestions = [
      ...(missingTerms.length ? [{
        id: "job-missing-skills",
        kind: "add-skill" as const,
        section: "skills" as const,
        terms: missingTerms,
        title: t("planMissingSkillsTitle"),
        detail: t("planMissingSkillsDetail"),
      }] : []),
      ...groupedRecommendations.general.map((recommendation) => ({
        id: `job-${recommendation.id}`,
        kind: "review-section" as const,
        section: recommendation.kind === "review-title" ? "headline" as const : recommendation.kind === "add-evidence" || recommendation.kind === "quantify-achievement" ? "experience" as const : "general" as const,
        title: t(`recommendations.${recommendation.kind}`),
        detail: recommendation.relatedTerms.length ? recommendation.relatedTerms.join(", ") : t("planGeneralDetail"),
      })),
    ];
    if (!suggestions.length) return;
    saveImprovementPlan(window.localStorage, { source: "job-match", target: improvementTarget, suggestions });
    window.location.assign(`${homePath}?openEditor=1#generator`);
  };

  const toggleImprovementItem = (id: string) => {
    setSelectedImprovementItems((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const selectedImprovementDescriptions = analysis ? [
    ...groupedRecommendations.missingTerms
      .filter((term) => selectedImprovementItems.includes(`skill:${term}`))
      .map((term) => t("selectedSkillImprovement", { term })),
    ...groupedRecommendations.general
      .filter((recommendation) => selectedImprovementItems.includes(`general:${recommendation.id}`))
      .map((recommendation) => `${t(`recommendations.${recommendation.kind}`)}${recommendation.relatedTerms.length ? `: ${recommendation.relatedTerms.join(", ")}` : ""}`),
  ] : [];
  const selectedImprovementsKey = JSON.stringify(selectedImprovementDescriptions);
  useEffect(() => {
    if (!linkedApplicationId || !analysis) return;
    const timeout = window.setTimeout(() => {
      void persistSelectedImprovements(linkedApplicationId, JSON.parse(selectedImprovementsKey) as string[]);
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [analysis, linkedApplicationId, selectedImprovementsKey]);

  return (
    <main className="job-match-page">
      <header className="job-match-header">
        <BrandLogo />
        <nav aria-label={t("navigationLabel")}>
          <a href={`${homePath}?openEditor=1#generator`} rel="noopener noreferrer">
            <ArrowBackRoundedIcon fontSize="small" />{t("backToGenerator")}
          </a>
        </nav>
      </header>

      <section className="job-match-hero">
        <div>
          <span className="job-match-eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
          <div className="job-match-trust"><LockOutlinedIcon />{t("privacyShort")}</div>
        </div>
        <div className="job-match-hero-card" aria-hidden="true">
          {visualTerms.map((term) => <span key={term}>{term}</span>)}
          <div><SearchRoundedIcon /><strong>{t("visualLabel")}</strong></div>
        </div>
      </section>

      <form className="job-match-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="job-match-input-card">
          <div className="job-match-card-heading"><span>01</span><div><h2>{t("jobSection")}</h2><p>{t("jobSectionHelp")}</p></div></div>
          <div className="job-match-source-choice saved-application-choice">
            <div>
              <strong>{linkedApplicationId ? t("selectedStoredApplication") : t("storedApplicationTitle")}</strong>
              <span>{storedApplications.find((item) => item.id === linkedApplicationId) ? `${storedApplications.find((item) => item.id === linkedApplicationId)?.role} · ${storedApplications.find((item) => item.id === linkedApplicationId)?.company}` : t("storedApplicationHelp")}</span>
            </div>
            <Button type="button" variant="outlined" startIcon={<FolderOpenRoundedIcon />} disabled={storedApplicationsLoading} onClick={() => setApplicationSelectorOpen(true)}>
              {linkedApplicationId ? t("changeStoredApplication") : t("chooseStoredApplication")}
            </Button>
          </div>
          <Controller name="jobFamily" control={control} render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="job-family-label">{t("jobFamily")}</InputLabel>
              <Select {...field} labelId="job-family-label" label={t("jobFamily")}>
                {jobFamilies.map((family) => <MenuItem key={family} value={family}>{t(`families.${family}`)}</MenuItem>)}
              </Select>
            </FormControl>
          )} />
          <Controller name="jobTitle" control={control} rules={{ required: t("required"), maxLength: { value: 100, message: t("tooLong") } }} render={({ field }) => (
            <TextField {...field} label={t("jobTitle")} fullWidth error={Boolean(errors.jobTitle)} helperText={errors.jobTitle?.message ?? `${field.value.length}/100`} inputProps={{ maxLength: 100 }} />
          )} />
          <Controller name="jobDescription" control={control} rules={{ required: t("required"), minLength: { value: 80, message: t("jobMinLength") }, maxLength: { value: 12000, message: t("tooLong") } }} render={({ field }) => (
            <TextField {...field} label={t("jobDescription")} placeholder={t("jobPlaceholder")} multiline minRows={12} fullWidth error={Boolean(errors.jobDescription)} helperText={errors.jobDescription?.message ?? `${jobLength}/12000`} inputProps={{ maxLength: 12000 }} />
          )} />
        </section>

        <section
          className={`job-match-input-card pdf-drop-card${pdfDragging ? " is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            pdfDragDepthRef.current += 1;
            setPdfDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            pdfDragDepthRef.current = Math.max(0, pdfDragDepthRef.current - 1);
            if (pdfDragDepthRef.current === 0) setPdfDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            pdfDragDepthRef.current = 0;
            setPdfDragging(false);
            void importResumePdf(event.dataTransfer.files?.[0]);
          }}
        >
          <div className="job-match-card-heading"><span>02</span><div><h2>{t("resumeSection")}</h2><p>{t("resumeSectionHelp")}</p></div></div>
          {loadedFromEditor && <Alert severity="success" onClose={() => { setLoadedFromEditor(false); setLinkedResume(null); }}>{t("editorResumeLoaded")}</Alert>}
          <div className="job-match-source-choice">
            <div><strong>{t("savedCvTitle")}</strong><span>{t("savedCvHelp")}</span></div>
            <Button type="button" variant="outlined" startIcon={<FolderOpenRoundedIcon />} onClick={() => void openStoredCvSelector()}>{t("chooseSavedCv")}</Button>
          </div>
          <div
            className={`job-match-pdf-import${pdfDragging ? " is-dragging" : ""}`}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(event) => void importResumePdf(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outlined"
              startIcon={<PictureAsPdfRoundedIcon />}
              disabled={pdfImporting}
              onClick={() => pdfInputRef.current?.click()}
            >
              {pdfImporting ? t("pdfReading") : t("importPdf")}
            </Button>
            <span><strong>{t(pdfDragging ? "dropPdfActive" : "dropPdfTitle")}</strong>{t("importPdfHelp")}</span>
          </div>
          {pdfNotice && <Alert severity={pdfNotice.severity} onClose={() => setPdfNotice(null)}>{pdfNotice.message}</Alert>}
          <Controller name="resumeTitle" control={control} rules={{ maxLength: { value: 100, message: t("tooLong") } }} render={({ field }) => (
            <TextField {...field} onChange={(event) => { field.onChange(event); setLinkedResume(null); setLoadedFromEditor(false); }} label={t("resumeTitle")} fullWidth error={Boolean(errors.resumeTitle)} helperText={errors.resumeTitle?.message ?? t("resumeTitleHelp")} inputProps={{ maxLength: 100 }} />
          )} />
          <Controller name="resumeText" control={control} rules={{ required: t("required"), minLength: { value: 80, message: t("resumeMinLength") }, maxLength: { value: 16000, message: t("tooLong") } }} render={({ field }) => (
            <TextField {...field} onChange={(event) => { field.onChange(event); setLinkedResume(null); setLoadedFromEditor(false); }} label={t("resumeText")} placeholder={t("resumePlaceholder")} multiline minRows={16} fullWidth error={Boolean(errors.resumeText)} helperText={errors.resumeText?.message ?? `${resumeLength}/16000`} inputProps={{ maxLength: 16000 }} />
          )} />
        </section>

        <div className="job-match-submit-row">
          <Alert severity="info" icon={<LockOutlinedIcon />}>{t("privacyNotice")}</Alert>
          <Button type="submit" variant="contained" size="large" startIcon={<SearchRoundedIcon />}>{t("analyze")}</Button>
        </div>
      </form>

      {analysis && (
        <section id="job-match-results" className="job-match-results" aria-live="polite">
          <div className="job-match-result-header">
            <div className="job-match-score-ring" style={{ "--score": `${analysis.score.percentage * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{analysis.score.percentage}%</strong><span>{t("match")}</span></div>
            </div>
            <div><span className="job-match-eyebrow">{t("resultEyebrow")}</span><h2>{t("resultTitle")}</h2><p>{t("scoreDisclaimer")}</p></div>
          </div>

          <div className="job-match-components">
            {componentIds.map((id) => {
              const component = analysis.score.components.find((item) => item.id === id)!;
              return <article key={id} className={!component.available ? "unavailable" : ""}>
                <div><strong>{t(`components.${id}`)}</strong><span>{component.available ? `${Math.round(component.coverage * 100)}%` : t("notEvaluated")}</span></div>
                <LinearProgress variant="determinate" value={component.available ? component.coverage * 100 : 0} />
              </article>;
            })}
          </div>

          <div className="job-match-result-grid">
            <article className="job-match-result-card">
              <div className="result-card-title success"><CheckCircleRoundedIcon /><div><h3>{t("matchesTitle")}</h3><p>{t("matchesHelp")}</p></div></div>
              {groupedMatches.strong.length ? <ul className="job-match-term-list">{groupedMatches.strong.map((match, index) => <li key={`${match.jobTerm.normalized}-${index}`}><span>{match.jobTerm.original}</span><Chip size="small" label={t(`matchTypes.${match.matchType as MatchType}`)} /></li>)}</ul> : <p className="empty-result">{t("noMatches")}</p>}
              {groupedMatches.related.length > 0 && <><h4>{t("relatedTitle")}</h4><ul className="job-match-term-list muted">{groupedMatches.related.map((match, index) => <li key={`${match.jobTerm.normalized}-${index}`}><span>{match.jobTerm.original}{match.resumeTerm ? ` → ${match.resumeTerm.original}` : ""}</span><Chip size="small" label={`${Math.round(match.confidence * 100)}%`} /></li>)}</ul></>}
            </article>

            <article className="job-match-result-card">
              <div className="result-card-title warning"><WarningAmberRoundedIcon /><div><h3>{t("missingTitle")}</h3><p>{t("missingHelp")}</p></div></div>
              {analysis.missingRequirements.length ? <ul className="job-match-term-list">{analysis.missingRequirements.map((item) => <li key={item.term.conceptId ?? item.term.normalized}><span>{item.term.original}</span><Chip size="small" color={item.level === "required" ? "warning" : "default"} label={t(`levels.${item.level}`)} /></li>)}</ul> : <p className="empty-result">{t("noMissing")}</p>}
            </article>

            <article className="job-match-result-card recommendations">
              <div className="result-card-title"><TipsAndUpdatesOutlinedIcon /><div><h3>{t("recommendationsTitle")}</h3><p>{t("recommendationsHelp")}</p></div></div>
              {groupedRecommendations.missingTerms.length > 0 && (
                <div className="job-match-missing-callout">
                  <div>
                    <strong>{t("termsToAddTitle")}</strong>
                    <p>{t("termsToAddHelp")}</p>
                  </div>
                  <div className="job-match-missing-chips">
                    {groupedRecommendations.missingTerms.map((term) => {
                      const selected = selectedImprovementItems.includes(`skill:${term}`);
                      return (
                        <Chip
                          key={term}
                          label={term}
                          variant={selected ? "filled" : "outlined"}
                          color={selected ? "warning" : "default"}
                          clickable={Boolean(improvementTarget)}
                          onClick={improvementTarget ? () => toggleImprovementItem(`skill:${term}`) : undefined}
                          icon={selected ? <CheckCircleRoundedIcon fontSize="small" /> : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {groupedRecommendations.general.length > 0 && (
                <>
                  <h4 className="job-match-other-adjustments">{t("otherAdjustmentsTitle")}</h4>
                  <ol>{groupedRecommendations.general.map((recommendation) => {
                    const selected = selectedImprovementItems.includes(`general:${recommendation.id}`);
                    return <li key={recommendation.id} className={`priority-${recommendation.priority}${selected ? " selected-for-adaptation" : ""}`}>
                      {improvementTarget && <Checkbox checked={selected} onChange={() => toggleImprovementItem(`general:${recommendation.id}`)} inputProps={{ "aria-label": t("selectImprovementRecommendation", { recommendation: t(`recommendations.${recommendation.kind}`) }) }} />}
                      <strong>{t(`priorities.${recommendation.priority}`)}</strong>
                      <span>{t(`recommendations.${recommendation.kind}`)}{recommendation.relatedTerms.length ? `: ${recommendation.relatedTerms.join(", ")}` : ""}</span>
                    </li>;
                  })}</ol>
                </>
              )}
              {improvementTarget && (groupedRecommendations.missingTerms.length > 0 || groupedRecommendations.general.length > 0) && (
                <Alert severity="info" className="analysis-selection-help">{t("improvementSelectionHelp")}</Alert>
              )}
            </article>
          </div>

          {analysis.unclassifiedTerms.length > 0 && <details className="job-match-unclassified"><summary>{t("unclassifiedTitle", { count: analysis.unclassifiedTerms.length })}</summary><p>{t("unclassifiedHelp")}</p><div>{analysis.unclassifiedTerms.slice(0, 20).map((item, index) => <Chip key={`${item.term.normalized}-${index}`} label={item.term.original} variant="outlined" />)}</div></details>}
          <div className="job-match-result-actions">
            {improvementTarget && <Button className="job-match-send-improvements" variant="contained" onClick={() => void sendImprovementsToGenerator()} startIcon={<TipsAndUpdatesOutlinedIcon />}>{t(linkedApplicationId ? "createAdaptedVersion" : "sendToGenerator")}</Button>}
            <Button variant="outlined" onClick={() => document.querySelector(".job-match-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>{t("editInputs")}</Button>
            <Button variant="text" onClick={() => { setAnalysis(null); requestAnimationFrame(() => document.querySelector(".job-match-form")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>{t("clearResult")}</Button>
          </div>
        </section>
      )}

      <section className="job-match-methodology" aria-labelledby="job-match-methodology-title">
        <div className="job-match-section-heading"><span className="job-match-eyebrow">{t("methodologyEyebrow")}</span><h2 id="job-match-methodology-title">{t("methodologyTitle")}</h2><p>{t("methodologyDescription")}</p></div>
        <div className="job-match-method-grid">
          <article><SearchRoundedIcon /><h3>{t("method1Title")}</h3><p>{t("method1Description")}</p></article>
          <article><TipsAndUpdatesOutlinedIcon /><h3>{t("method2Title")}</h3><p>{t("method2Description")}</p></article>
          <article><LockOutlinedIcon /><h3>{t("method3Title")}</h3><p>{t("method3Description")}</p></article>
        </div>
        <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>{t("methodologyLimit")}</Alert>
      </section>

      <section className="job-match-faq" aria-labelledby="job-match-faq-title">
        <div className="job-match-section-heading"><span className="job-match-eyebrow">FAQ</span><h2 id="job-match-faq-title">{t("faqTitle")}</h2></div>
        <div>{faqItems.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
      </section>

      <section className="job-match-final-cta">
        <div><h2>{t("finalTitle")}</h2><p>{t("finalDescription")}</p></div>
        <Button
          component="a"
          href={`${homePath}?openEditor=1#generator`}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
        >
          {t("backToBuilderCta")}
        </Button>
      </section>
      <Dialog open={cvSelectorOpen} onClose={() => setCvSelectorOpen(false)} fullWidth className="quality-selector-dialog">
        <DialogTitle>{t("savedCvSelectorTitle")}<IconButton className="quality-dialog-close" aria-label={t("closeSavedCvSelector")} onClick={() => setCvSelectorOpen(false)}><CloseRoundedIcon /></IconButton></DialogTitle>
        <DialogContent>
          <p className="quality-selector-help">{t("savedCvSelectorHelp")}</p>
          {storedCvsLoading ? <p>{t("loadingSavedCvs")}</p> : storedCvs.length ? <div className="quality-cv-list">{storedCvs.map((cv) => <button type="button" key={cv.id} onClick={() => selectStoredCv(cv)}><div className="quality-cv-thumbnail" style={{ "--library-primary": cv.data.primaryColor } as React.CSSProperties}><i />{cv.data.photo ? <img src={cv.data.photo} alt="" /> : <DescriptionRoundedIcon />}</div><span><strong>{cv.title}</strong><small>{cv.data.headline || t("noProfessionalTitle")}</small><em>{cv.locale.toUpperCase()}</em></span></button>)}</div> : <Alert severity="info" className="saved-cv-tip"><strong>{t("noSavedCvs")}</strong><span>{t("saveCvTip")}</span></Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setCvSelectorOpen(false)}>{t("cancel")}</Button><Button component="a" href={`${homePath}?openEditor=1#generator`}>{t("createCv")}</Button></DialogActions>
      </Dialog>
      <Dialog open={applicationSelectorOpen} onClose={() => setApplicationSelectorOpen(false)} fullWidth className="quality-selector-dialog application-selector-dialog">
        <DialogTitle>{t("storedApplicationSelectorTitle")}<IconButton className="quality-dialog-close" aria-label={t("closeStoredApplicationSelector")} onClick={() => setApplicationSelectorOpen(false)}><CloseRoundedIcon /></IconButton></DialogTitle>
        <DialogContent>
          <p className="quality-selector-help">{t("storedApplicationSelectorHelp")}</p>
          {storedApplicationsLoading ? <p>{t("loadingStoredApplications")}</p> : storedApplications.length ? (
            <div className="quality-cv-list application-selector-list">
              {storedApplications.map((application) => (
                <button type="button" key={application.id} onClick={() => selectStoredApplication(application.id)}>
                  <div className="quality-cv-thumbnail application-selector-thumbnail" style={{ "--library-primary": "#674787" } as React.CSSProperties}><i /><DescriptionRoundedIcon /></div>
                  <span><strong>{application.role}</strong><small>{application.company}</small><em>{t(`applicationStatuses.${application.status}`)}</em></span>
                </button>
              ))}
            </div>
          ) : <Alert severity="info">{t("noStoredApplications")}</Alert>}
        </DialogContent>
        <DialogActions>
          {linkedApplicationId ? <Button onClick={() => selectStoredApplication("")}>{t("storedApplicationManual")}</Button> : null}
          <Button onClick={() => setApplicationSelectorOpen(false)}>{t("cancel")}</Button>
          <Button component="a" href={locale === "en" ? "/applications" : "/mis-postulaciones"}>{t("manageStoredApplications")}</Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
