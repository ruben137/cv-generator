"use client";

import {
  ArticleOutlined,
  CheckCircleRounded,
  DeleteOutlineRounded,
  DescriptionOutlined,
  EditOutlined,
  PictureAsPdfOutlined,
  SaveRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { type CoverLetterContent, type CoverLetterDraft, type CoverLetterTone } from "../cover-letter";
import { downloadCoverLetterDocx, downloadCoverLetterPdf } from "../cover-letter-exporters";
import { deleteCoverLetter, listCoverLetters, putCoverLetter } from "../cover-letter-library";
import ConfirmModal from "../ConfirmModal";
import { listStoredCvs, type StoredCv } from "../cv-library";
import { listJobApplications } from "../job-application-library";
import type { JobApplication } from "../job-application";
import { SiteHeader } from "../site-header";
import { SiteContent } from "../site-content";

const theme = createTheme({
  palette: { primary: { main: "#173B63", dark: "#0E2948" }, background: { default: "#F4F6F8", paper: "#FFFFFF" } },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "var(--font-geist-sans), Arial, sans-serif", button: { textTransform: "none", fontWeight: 750 } },
});

function buildContent(cv: StoredCv, application: JobApplication, tone: CoverLetterTone): CoverLetterContent {
  const isEnglish = application.language === "en";
  const summary = cv.data.summary.trim();
  const experience = cv.data.experiences.find((item) => item.role.trim() || item.company.trim());
  const evidence = experience
    ? [experience.role && experience.company ? `${experience.role} · ${experience.company}` : experience.role || experience.company, ...experience.bullets.slice(0, 2)].filter(Boolean).join(". ")
    : summary;
  const company = application.company.trim();
  const role = application.role.trim();
  const openings = isEnglish ? {
    professional: `I am writing to express my interest in the ${role} position at ${company}.`,
    direct: `I would like to apply for the ${role} position at ${company}.`,
    warm: `I was excited to learn about the ${role} opportunity at ${company}.`,
  } : {
    professional: `Me dirijo a ustedes para expresar mi interés en el puesto de ${role} en ${company}.`,
    direct: `Quiero postular al puesto de ${role} en ${company}.`,
    warm: `Me entusiasmó conocer la oportunidad para el puesto de ${role} en ${company}.`,
  };
  return {
    recipient: isEnglish ? `Hiring team at ${company}` : `Equipo de selección de ${company}`,
    subject: isEnglish ? `Application for ${role}` : `Postulación al puesto de ${role}`,
    greeting: isEnglish ? "Dear hiring team," : "Estimado equipo de selección:",
    opening: openings[tone],
    evidence: summary && evidence !== summary ? `${summary}\n\n${evidence}.` : evidence,
    motivation: isEnglish
      ? `I am interested in contributing my experience to the challenges and responsibilities described for this role.`
      : `Me interesa aportar mi experiencia a los retos y responsabilidades descritos para este puesto.`,
    closing: isEnglish
      ? "Thank you for considering my application. I would welcome the opportunity to discuss how my experience could contribute to your team."
      : "Gracias por considerar mi postulación. Quedo disponible para conversar sobre cómo mi experiencia puede contribuir al equipo.",
    signature: cv.data.name.trim(),
  };
}

export function CoverLetterClient() {
  const t = useTranslations("CoverLetter");
  const locale = useLocale() === "en" ? "en" : "es";
  const [cvs, setCvs] = useState<StoredCv[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [letters, setLetters] = useState<CoverLetterDraft[]>([]);
  const [cvId, setCvId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [draft, setDraft] = useState<CoverLetterDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CoverLetterDraft | null>(null);
  const [deleting, setDeleting] = useState(false);
  const editorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listStoredCvs(), listJobApplications(), listCoverLetters()])
      .then(([storedCvs, storedApplications, storedLetters]) => {
        if (!active) return;
        setCvs(storedCvs);
        setApplications(storedApplications);
        setLetters(storedLetters);
        const params = new URLSearchParams(window.location.search);
        const requestedDraft = storedLetters.find((item) => item.id === params.get("draft"));
        if (requestedDraft) {
          setDraft(requestedDraft);
          setCvId(requestedDraft.cvId);
          setApplicationId(requestedDraft.applicationId);
          setTone(requestedDraft.tone);
          setSaved(true);
          window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
          return;
        }
        const requestedApplication = storedApplications.find((item) => item.id === params.get("application"));
        if (requestedApplication) {
          setApplicationId(requestedApplication.id);
          if (requestedApplication.cvId && storedCvs.some((cv) => cv.id === requestedApplication.cvId)) setCvId(requestedApplication.cvId);
          window.setTimeout(() => document.querySelector(".cover-letter-setup")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        }
      })
      .catch(() => {
        if (active) setError(t("loadError"));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [t]);

  const selectedCv = useMemo(() => cvs.find((item) => item.id === cvId), [cvs, cvId]);
  const selectedApplication = useMemo(() => applications.find((item) => item.id === applicationId), [applications, applicationId]);
  const languageMismatch = Boolean(
    selectedCv && selectedApplication && selectedCv.data.documentLocale !== selectedApplication.language,
  );

  const chooseApplication = (application: JobApplication) => {
    setApplicationId(application.id);
    if (application.cvId && cvs.some((cv) => cv.id === application.cvId)) setCvId(application.cvId);
    setDraft(null);
  };

  const prepareDraft = () => {
    if (!selectedCv || !selectedApplication || languageMismatch) return;
    const now = new Date().toISOString();
    setDraft({
      schemaVersion: 1,
      id: crypto.randomUUID(),
      title: `${selectedApplication.role} · ${selectedApplication.company}`,
      locale: selectedApplication.language,
      tone,
      cvId: selectedCv.id,
      applicationId: selectedApplication.id,
      content: buildContent(selectedCv, selectedApplication, tone),
      createdAt: now,
      updatedAt: now,
    });
    setSaved(false);
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const updateContent = (field: keyof CoverLetterContent, value: string) => {
    setDraft((current) => current ? { ...current, content: { ...current.content, [field]: value }, updatedAt: new Date().toISOString() } : current);
    setSaved(false);
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const updatedDraft = { ...draft, updatedAt: new Date().toISOString() };
      await putCoverLetter(updatedDraft);
      setDraft(updatedDraft);
      setLetters((current) => [updatedDraft, ...current.filter((item) => item.id !== updatedDraft.id)]);
      setSaved(true);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const openSavedLetter = (letter: CoverLetterDraft) => {
    setDraft(letter);
    setCvId(letter.cvId);
    setApplicationId(letter.applicationId);
    setTone(letter.tone);
    setSaved(true);
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const confirmDeleteLetter = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    setError("");
    try {
      await deleteCoverLetter(deleteCandidate.id);
      setLetters((current) => current.filter((item) => item.id !== deleteCandidate.id));
      if (draft?.id === deleteCandidate.id) {
        setDraft(null);
        setSaved(false);
      }
      setDeleteCandidate(null);
    } catch {
      setError(t("deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  const exportDraft = async (format: "pdf" | "docx") => {
    if (!draft) return;
    setExporting(format);
    setError("");
    try {
      if (format === "pdf") await downloadCoverLetterPdf(draft);
      else await downloadCoverLetterDocx(draft);
    } catch {
      setError(t("exportError"));
    } finally {
      setExporting(null);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <SiteHeader locale={locale} active="tools" />
      <SiteContent className="cover-letter-page">

        <section className="cover-letter-hero">
          <div>
            <span className="job-match-eyebrow">{t("eyebrow")}</span>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
            <div className="job-match-trust"><CheckCircleRounded />{t("privacy")}</div>
          </div>
          <div className="cover-letter-visual" aria-hidden="true">
            <ArticleOutlined />
            <i /><i /><i /><i />
          </div>
        </section>

        {error ? <Alert severity="error" onClose={() => setError("")}>{error}</Alert> : null}

        {!loading && letters.length ? <section className="cover-letter-library">
          <div className="cover-letter-library-heading"><div><span className="job-match-eyebrow">{t("libraryEyebrow")}</span><h2>{t("libraryTitle")}</h2><p>{t("libraryHelp")}</p></div><Chip label={t("libraryCount", { count: letters.length })} /></div>
          <div className="cover-letter-library-grid">{letters.map((letter) => {
            const application = applications.find((item) => item.id === letter.applicationId);
            return <article key={letter.id}>
              <div className="cover-letter-library-main"><ArticleOutlined /><span><strong>{letter.title}</strong><small>{application ? `${application.company} · ${application.role}` : t("sourceUnavailable")}</small></span></div>
              <time>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(letter.updatedAt))}</time>
              <div className="cover-letter-library-actions"><Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => openSavedLetter(letter)}>{t("openDraft")}</Button><Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => setDeleteCandidate(letter)}>{t("deleteDraft")}</Button></div>
            </article>;
          })}</div>
        </section> : null}

        {loading ? <Box className="cover-letter-loading"><CircularProgress size={28} />{t("loading")}</Box> : (
          <section className="cover-letter-setup">
            <article className="cover-letter-source-card">
              <div className="job-match-card-heading"><span>01</span><div><h2>{t("cvTitle")}</h2><p>{t("cvHelp")}</p></div></div>
              {cvs.length ? <div className="cover-letter-choice-list">{cvs.map((cv) => (
                <button key={cv.id} type="button" className={cvId === cv.id ? "selected" : ""} onClick={() => { setCvId(cv.id); setDraft(null); }}>
                  <DescriptionOutlined /><span><strong>{cv.title}</strong><small>{cv.data.headline || t("noHeadline")}</small></span><Chip size="small" label={cv.locale.toUpperCase()} />
                </button>
              ))}</div> : <Alert severity="info">{t("noCvs")}</Alert>}
            </article>

            <article className="cover-letter-source-card">
              <div className="job-match-card-heading"><span>02</span><div><h2>{t("jobTitle")}</h2><p>{t("jobHelp")}</p></div></div>
              {applications.length ? <div className="cover-letter-choice-list">{applications.map((application) => (
                <button key={application.id} type="button" className={applicationId === application.id ? "selected" : ""} onClick={() => chooseApplication(application)}>
                  <WorkOutlineRounded /><span><strong>{application.role}</strong><small>{application.company}</small></span><Chip size="small" label={t(`status.${application.status}`)} />
                </button>
              ))}</div> : <Alert severity="info">{t("noApplications")}</Alert>}
            </article>

            <article className="cover-letter-tone-card">
              <div className="job-match-card-heading"><span>03</span><div><h2>{t("toneTitle")}</h2><p>{t("toneHelp")}</p></div></div>
              <div className="cover-letter-tone-list">
                {(["professional", "direct", "warm"] as const).map((item) => <button key={item} type="button" className={tone === item ? "selected" : ""} onClick={() => { setTone(item); setDraft(null); }}><strong>{t(`tones.${item}.title`)}</strong><span>{t(`tones.${item}.description`)}</span></button>)}
              </div>
              {languageMismatch ? <Alert severity="warning">{t("languageMismatch")}</Alert> : null}
              <Button variant="contained" size="large" onClick={prepareDraft} disabled={!selectedCv || !selectedApplication || languageMismatch}>{t("prepare")}</Button>
            </article>
          </section>
        )}

        {draft ? <section className="cover-letter-editor" ref={editorRef}>
          <div className="cover-letter-editor-heading"><div><span className="job-match-eyebrow">{t("editorEyebrow")}</span><h2>{t("editorTitle")}</h2><p>{t("editorHelp")}</p></div><div className="cover-letter-editor-actions"><Button variant="outlined" startIcon={exporting === "docx" ? <CircularProgress size={16} /> : <ArticleOutlined />} onClick={() => exportDraft("docx")} disabled={Boolean(exporting)}>{t("downloadDocx")}</Button><Button variant="outlined" startIcon={exporting === "pdf" ? <CircularProgress size={16} /> : <PictureAsPdfOutlined />} onClick={() => exportDraft("pdf")} disabled={Boolean(exporting)}>{t("downloadPdf")}</Button><Button variant="contained" startIcon={<SaveRounded />} onClick={saveDraft} disabled={saving}>{saving ? t("saving") : t("save")}</Button></div></div>
          {saved ? <Alert severity="success">{t("saved")}</Alert> : null}
          <div className="cover-letter-editor-grid">
            <Stack spacing={2}>
              <TextField label={t("fields.recipient")} value={draft.content.recipient} onChange={(event) => updateContent("recipient", event.target.value)} inputProps={{ maxLength: 160 }} />
              <TextField label={t("fields.subject")} value={draft.content.subject} onChange={(event) => updateContent("subject", event.target.value)} inputProps={{ maxLength: 200 }} />
              <TextField label={t("fields.greeting")} value={draft.content.greeting} onChange={(event) => updateContent("greeting", event.target.value)} inputProps={{ maxLength: 240 }} />
              {(["opening", "evidence", "motivation", "closing"] as const).map((field) => <TextField key={field} label={t(`fields.${field}`)} value={draft.content[field]} onChange={(event) => updateContent(field, event.target.value)} multiline minRows={field === "evidence" ? 5 : 3} inputProps={{ maxLength: 6_000 }} />)}
              <TextField label={t("fields.signature")} value={draft.content.signature} onChange={(event) => updateContent("signature", event.target.value)} inputProps={{ maxLength: 240 }} />
            </Stack>
            <aside className="cover-letter-preview-wrap">
              <div className="cover-letter-preview-label"><span>{t("previewTitle")}</span><small>{t("previewFormat")}</small></div>
              <article className="cover-letter-preview">
                <header><strong>{draft.content.signature || draft.title}</strong><time>{new Intl.DateTimeFormat(draft.locale, { dateStyle: "long" }).format(new Date(draft.updatedAt))}</time></header>
                {draft.content.recipient ? <b>{draft.content.recipient}</b> : null}
                {draft.content.subject ? <h3>{draft.locale === "en" ? "Subject" : "Asunto"}: {draft.content.subject}</h3> : null}
                {[draft.content.greeting, draft.content.opening, draft.content.evidence, draft.content.motivation, draft.content.closing].filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                {draft.content.signature ? <footer>{draft.content.signature}</footer> : null}
              </article>
            </aside>
          </div>
        </section> : null}
        <ConfirmModal open={Boolean(deleteCandidate)} title={t("deleteDialogTitle")} warning={t("deleteDialogWarning")} message={t("deleteDialogMessage", { title: deleteCandidate?.title ?? "" })} cancelLabel={t("cancelDelete")} confirmLabel={t("confirmDelete")} closeLabel={t("closeDelete")} loading={deleting} onClose={() => !deleting && setDeleteCandidate(null)} onConfirm={() => void confirmDeleteLetter()} />
      </SiteContent>
    </ThemeProvider>
  );
}
