"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { putStoredCv, type StoredCv } from "./cv-library";
import { parseCvFile } from "./cv-portability";

export function PromptJsonDropzone() {
  const t = useTranslations("App");
  const locale = useLocale() === "en" ? "en" : "es";
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [candidate, setCandidate] = useState<StoredCv | null>(null);
  const [savedCv, setSavedCv] = useState<StoredCv | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const readFile = async (file?: File) => {
    if (!file) return;
    setError("");
    setSavedCv(null);
    if (!file.name.toLocaleLowerCase().endsWith(".json") && file.type !== "application/json") {
      setCandidate(null);
      setError(t("promptImportInvalidType"));
      return;
    }
    try {
      const parsed = parseCvFile(await file.text(), locale);
      const suggestedTitle = `${parsed.data.name.trim() || t("untitledCv")} · ${parsed.locale.toUpperCase()}`;
      setCandidate(parsed);
      setTitle(parsed.title.trim() && parsed.title !== parsed.data.name ? parsed.title : suggestedTitle);
    } catch (reason) {
      setCandidate(null);
      const code = reason instanceof Error ? reason.message : "invalid_resume";
      setError(t(code === "file_too_large" ? "importTooLarge" : code === "unsupported_version" ? "importUnsupportedVersion" : "promptImportInvalid"));
    }
  };

  const saveCv = async () => {
    if (!candidate) return;
    try {
      setSaving(true);
      setError("");
      const next = { ...candidate, title: title.trim().slice(0, 100) || candidate.title };
      await putStoredCv(next);
      setSavedCv(next);
      setCandidate(null);
    } catch {
      setError(t("cvSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="prompt-json-import" aria-labelledby={`${inputId}-title`}>
      <div className="prompt-json-import-heading">
        <div><strong id={`${inputId}-title`}>{t("promptImportTitle")}</strong><p>{t("promptImportHelp")}</p></div>
      </div>
      {savedCv ? (
        <div className="prompt-json-import-success">
          <CheckCircleRoundedIcon />
          <div><strong>{t("promptImportSuccess")}</strong><span>{savedCv.title}</span></div>
          <div>
            <Button component="a" href={`/${locale}/mis-cvs`} variant="outlined">{t("viewMyCvs")}</Button>
            <Button component="a" href={`/${locale}?cv=${encodeURIComponent(savedCv.id)}#generator`} variant="contained">{t("openImportedCv")}</Button>
          </div>
        </div>
      ) : candidate ? (
        <div className="prompt-json-import-candidate">
          <div className="prompt-json-import-file"><DescriptionRoundedIcon /><div><strong>{candidate.data.name || t("untitledCv")}</strong><span>{candidate.data.headline || candidate.locale.toUpperCase()}</span></div></div>
          <TextField size="small" fullWidth label={t("promptImportName")} value={title} inputProps={{ maxLength: 100 }} onChange={(event) => setTitle(event.target.value)} />
          <div className="prompt-json-import-actions">
            <Button disabled={saving} onClick={() => setCandidate(null)}>{t("chooseAnotherFile")}</Button>
            <Button variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={() => void saveCv()}>{saving ? t("savingCv") : t("saveToMyCvs")}</Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`prompt-json-dropzone${dragging ? " dragging" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void readFile(event.dataTransfer.files[0]); }}
        >
          <UploadFileRoundedIcon />
          <span><strong>{dragging ? t("promptImportDropActive") : t("promptImportDropTitle")}</strong><small>{t("promptImportDropHelp")}</small></span>
          <Button component="span" variant="outlined">{t("chooseJsonFile")}</Button>
          <input id={inputId} hidden type="file" accept="application/json,.json" onChange={(event) => { void readFile(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
      )}
      {error ? <Alert severity="error" onClose={() => setError("")}>{error}</Alert> : null}
    </section>
  );
}
