"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BrandLogo } from "../brand-logo";
import { listStoredCvs, type StoredCv } from "../cv-library";
import { createImprovementTarget, saveImprovementPlan, type ImprovementTarget } from "../improvement-plan";
import type { CvData } from "../types";
import { reviewResumeQuality, type ResumeQualityReview } from "./engine";
import { consumeResumeReviewTransfer } from "./transfer";

export function ResumeReviewClient() {
  const t = useTranslations("ResumeReview");
  const locale = useLocale() === "en" ? "en" : "es";
  const [selectedCv, setSelectedCv] = useState<CvData | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [improvementTarget, setImprovementTarget] = useState<ImprovementTarget | null>(null);
  const [storedCvs, setStoredCvs] = useState<StoredCv[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<ResumeQualityReview | null>(null);

  useEffect(() => {
    let active = true;
    const transferred = consumeResumeReviewTransfer(window.localStorage);
    if (transferred) {
      queueMicrotask(() => {
        if (!active) return;
        setSelectedCv(transferred.cv);
        setImprovementTarget(transferred.target);
        setSelectedName(transferred.cv.name || t("currentCv"));
        setReview(reviewResumeQuality(transferred.cv));
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }
    void listStoredCvs()
      .then((items) => {
        if (!active) return;
        setStoredCvs(items);
        setSelectorOpen(true);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!review) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("quality-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [review]);

  const selectCv = (stored: StoredCv) => {
    setSelectedCv(stored.data);
    setImprovementTarget(createImprovementTarget(stored.data, stored.id));
    setSelectedName(stored.title);
    setReview(null);
    setSelectorOpen(false);
  };
  const analyze = () => {
    if (!selectedCv) return;
    setReview(reviewResumeQuality(selectedCv));
  };
  const sendImprovementsToGenerator = () => {
    if (!review || !improvementTarget) return;
    const suggestions = review.checks.filter((check) => check.status !== "passed").map((check) => ({
      id: `quality-${check.id}`,
      kind: "review-section" as const,
      section: check.id === "contact" || check.id === "links" ? "contact" as const
        : check.id === "title" ? "headline" as const
        : check.id === "summary" ? "summary" as const
        : check.id === "skills" || check.id === "skillEvidence" ? "skills" as const
        : check.id === "experience" || check.id === "dates" || check.id === "bulletLength" || check.id === "metrics" || check.id === "actionVerbs" || check.id === "repetition" ? "experience" as const
        : "general" as const,
      title: t(`checks.${check.id}.title`),
      detail: t(`checks.${check.id}.description`),
      ...(check.values?.length ? { terms: check.values } : {}),
    }));
    if (!suggestions.length) return;
    saveImprovementPlan(window.localStorage, { source: "quality-review", target: improvementTarget, suggestions });
    window.location.assign(`/${locale}?openEditor=1#generator`);
  };
  return (
    <main className="job-match-page quality-page">
      <header className="job-match-header">
        <BrandLogo />
        <nav aria-label={t("navigationLabel")}>
          <a href={`/${locale}/tools`}>
            <ArrowBackRoundedIcon fontSize="small" />
            {t("backToTools")}
          </a>
        </nav>
      </header>
      <section className="job-match-hero quality-hero">
        <div>
          <span className="job-match-eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <div className="quality-hero-card" aria-hidden="true">
          <FactCheckOutlinedIcon />
          <strong>{t("visualTitle")}</strong>
          <span>{t("visualText")}</span>
        </div>
      </section>
      <section className="quality-input-card">
        <div className="job-match-card-heading">
          <span>01</span>
          <div>
            <h2>{t("inputTitle")}</h2>
            <p>{t("structuredHelp")}</p>
          </div>
        </div>
        {loading ? (
          <p>{t("loadingCvs")}</p>
        ) : selectedCv ? (
          <div className="quality-selected-cv">
            <div>
              <span>{t("selectedCv")}</span>
              <strong>{selectedName}</strong>
              <small>{selectedCv.headline || t("noProfessionalTitle")}</small>
            </div>
            <Button variant="outlined" onClick={() => setSelectorOpen(true)}>
              {t("changeCv")}
            </Button>
          </div>
        ) : (
          <Alert severity="info">{t(storedCvs.length ? "selectCvPrompt" : "noSavedCvs")}</Alert>
        )}
        <div className="quality-source-actions">
          <Button variant="outlined" onClick={() => setSelectorOpen(true)}>
            {t("chooseSavedCv")}
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<FactCheckOutlinedIcon />}
            disabled={!selectedCv}
            onClick={analyze}
          >
            {t("reviewButton")}
          </Button>
        </div>
      </section>
      {review && (
        <section id="quality-results" className="quality-results">
          <div className="quality-summary">
            <div>
              <span>{t("resultEyebrow")}</span>
              <h2>{t("resultTitle")}</h2>
              <p>{t("resultDisclaimer")}</p>
            </div>
            <div className="quality-percentage">
              <strong>{review.percentage}%</strong>
              <small>{t("checksPassed")}</small>
            </div>
          </div>
          <LinearProgress variant="determinate" value={review.percentage} />
          <div className="quality-check-grid">
            {review.checks.map((check) => (
              <article
                key={check.id}
                className={`quality-check ${check.status}`}
              >
                {check.status === "passed" ? (
                  <CheckCircleRoundedIcon />
                ) : check.status === "warning" ? (
                  <WarningAmberRoundedIcon />
                ) : (
                  <InfoOutlinedIcon />
                )}
                <div>
                  <span>{t(`status.${check.status}`)}</span>
                  <h3>{t(`checks.${check.id}.title`)}</h3>
                  <p>{t(`checks.${check.id}.description`)}</p>
                  {(check.id === "metrics" || check.id === "actionVerbs") && typeof check.matched === "number" && typeof check.total === "number" ? (
                    <>
                      <p className="quality-check-evidence">
                        {t(check.id === "metrics" ? "metricsEvidence" : "actionVerbsEvidence", { matched: check.matched, total: check.total })}
                      </p>
                      <div className="quality-check-example">
                        <span className="quality-check-example-label">{t("exampleLabel")}</span>
                        <p>{t(check.id === "metrics" ? "metricsExample" : "actionVerbsExample")}</p>
                      </div>
                    </>
                  ) : null}
                  {check.values?.length ? (
                    <ul>
                      {check.values.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <div className="quality-result-actions">
            {improvementTarget && review.checks.some((check) => check.status !== "passed") && <Button className="job-match-send-improvements" variant="contained" onClick={sendImprovementsToGenerator}>{t("sendToGenerator")}</Button>}
            <Button variant="outlined" onClick={() => setSelectorOpen(true)}>{t("reviewAgain")}</Button>
          </div>
        </section>
      )}
      <Dialog
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        fullWidth
        className="quality-selector-dialog"
      >
        <DialogTitle>
          {t("selectorTitle")}
          <IconButton className="quality-dialog-close" aria-label={t("closeSelector")} onClick={() => setSelectorOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <p className="quality-selector-help">{t("selectorHelp")}</p>
          {storedCvs.length ? (
            <div className="quality-cv-list">
              {storedCvs.map((cv) => (
                <button type="button" key={cv.id} onClick={() => selectCv(cv)}>
                  <div
                    className="quality-cv-thumbnail"
                    style={
                      {
                        "--library-primary": cv.data.primaryColor,
                      } as CSSProperties
                    }
                  >
                    <i />
                    {cv.data.photo ? (
                      <img src={cv.data.photo} alt="" />
                    ) : (
                      <DescriptionRoundedIcon />
                    )}
                  </div>
                  <span>
                    <strong>{cv.title}</strong>
                    <small>
                      {cv.data.headline || t("noProfessionalTitle")}
                    </small>
                    <em>{cv.locale.toUpperCase()}</em>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Alert severity="info" className="saved-cv-tip"><strong>{t("noSavedCvs")}</strong><span>{t("saveCvTip")}</span></Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectorOpen(false)}>{t("cancel")}</Button>
          <Button
            component="a"
            href={`/${locale}?openEditor=1#generator`}
          >
            {t("createCv")}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
