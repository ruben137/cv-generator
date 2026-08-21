"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { BrandLogo } from "../brand-logo";
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

export function JobMatchClient() {
  const t = useTranslations("JobMatch");
  const locale = (useLocale() === "en" ? "en" : "es") as JobMatchLanguage;
  const homePath = `/${locale}`;
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [linkedResume, setLinkedResume] = useState<ResumeMatchInput | null>(null);
  const [loadedFromEditor, setLoadedFromEditor] = useState(false);
  const [resumeLanguage, setResumeLanguage] = useState<JobMatchLanguage>(locale);
  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    defaultValues: { jobFamily: "general", jobTitle: "", jobDescription: "", resumeTitle: "", resumeText: "" },
  });
  const jobLength = useWatch({ control, name: "jobDescription" }).length;
  const resumeLength = useWatch({ control, name: "resumeText" }).length;
  const faqItems = t.raw("faqItems") as Array<{ question: string; answer: string }>;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("source") !== "editor") return;
    const transfer = consumeJobMatchTransfer(window.localStorage);
    if (!transfer) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLinkedResume(transfer.resume);
      setLoadedFromEditor(true);
      setResumeLanguage(transfer.language);
      setValue("jobFamily", transfer.jobFamily);
      setValue("resumeTitle", transfer.resume.title);
      setValue("resumeText", resumeMatchInputToText(transfer.resume, transfer.language));
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

  const onSubmit = (values: FormValues) => {
    const resume = linkedResume ?? parsePastedResume(values.resumeTitle, values.resumeText, resumeLanguage);
    setAnalysis(analyzeJobMatch({
      title: values.jobTitle,
      text: values.jobDescription,
      language: locale,
      jobFamily: values.jobFamily,
    }, resume));
    requestAnimationFrame(() => document.querySelector("#job-match-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <main className="job-match-page">
      <header className="job-match-header">
        <BrandLogo />
        <nav aria-label={t("navigationLabel")}>
          <a href={homePath}><ArrowBackRoundedIcon fontSize="small" />{t("backToGenerator")}</a>
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
          <span>React</span><span>TypeScript</span><span>Git</span><span>SEO</span>
          <div><SearchRoundedIcon /><strong>{t("visualLabel")}</strong></div>
        </div>
      </section>

      <form className="job-match-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="job-match-input-card">
          <div className="job-match-card-heading"><span>01</span><div><h2>{t("jobSection")}</h2><p>{t("jobSectionHelp")}</p></div></div>
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

        <section className="job-match-input-card">
          <div className="job-match-card-heading"><span>02</span><div><h2>{t("resumeSection")}</h2><p>{t("resumeSectionHelp")}</p></div></div>
          {loadedFromEditor && <Alert severity="success" onClose={() => { setLoadedFromEditor(false); setLinkedResume(null); }}>{t("editorResumeLoaded")}</Alert>}
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
              <ol>{analysis.recommendations.map((recommendation) => <li key={recommendation.id}><strong>{t(`priorities.${recommendation.priority}`)}</strong><span>{t(`recommendations.${recommendation.kind}`)}{recommendation.relatedTerms.length ? `: ${recommendation.relatedTerms.join(", ")}` : ""}</span></li>)}</ol>
            </article>
          </div>

          {analysis.unclassifiedTerms.length > 0 && <details className="job-match-unclassified"><summary>{t("unclassifiedTitle", { count: analysis.unclassifiedTerms.length })}</summary><p>{t("unclassifiedHelp")}</p><div>{analysis.unclassifiedTerms.slice(0, 20).map((item, index) => <Chip key={`${item.term.normalized}-${index}`} label={item.term.original} variant="outlined" />)}</div></details>}
          <div className="job-match-result-actions">
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
        <Button component="a" href={homePath} variant="contained">{t("backToBuilderCta")}</Button>
      </section>
    </main>
  );
}
