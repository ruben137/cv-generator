"use client";

import {
  AddRounded,
  CheckCircleRounded,
  ColorLensRounded,
  CropRounded,
  DeleteOutlineRounded,
  DragIndicatorRounded,
  EditRounded,
  ExpandMoreRounded,
  FactCheckOutlined,
  TipsAndUpdatesOutlined,
  InsertDriveFileRounded,
  LanguageRounded,
  LockOutlined,
  ManageSearchRounded,
  OpenInNewRounded,
  PictureAsPdfRounded,
  RestartAltRounded,
  SaveRounded,
  ContentCopyRounded,
  AutoAwesomeRounded,
  UploadRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  MenuItem,
  Slider,
  Stack,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import { type CSSProperties, type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { exportDocx, exportPdf, type ExportLabels } from "./exporters";
import { defaultDocumentLabels, normalizeCvData } from "./cv-data";
import {
  type CvData,
  getInitialCv,
  mainSectionIds,
  normalizeContentOrder,
  type MainSectionId,
} from "./types";
import { createStoredCv, getStoredCv, putStoredCv } from "./cv-library";
import { BrandLogo } from "./brand-logo";
import { SiteHeader } from "./site-header";
import { getProfessionalPreset, isProfessionalPresetId } from "./professional-presets";
import { writeJobMatchTransfer } from "./job-match/transfer";
import { jobFamilies, type JobFamily } from "./job-match/model";
import { writeResumeReviewTransfer } from "./resume-review/transfer";
import { PromptJsonDropzone } from "./prompt-json-dropzone";
import { createImprovementTarget, getImprovementPlans, removeImprovementPlan, storeImprovementPlans, type ImprovementPlan, type ImprovementSuggestion } from "./improvement-plan";

const theme = createTheme({
  palette: {
    primary: { main: "#173B63", dark: "#0E2948" },
    background: { default: "#F4F6F8", paper: "#FFFFFF" },
    text: { primary: "#17202A", secondary: "#5E6A78" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    h4: { fontWeight: 760 },
    h6: { fontWeight: 720 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiAccordion: { defaultProps: { slotProps: { transition: { unmountOnExit: true } } } },
  },
});

const sectionSx = {
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "none",
  "&:before": { display: "none" },
  "& + &": { mt: 1.5 },
};

const colorPresets = [
  { nameKey: "paletteBlue", primary: "#173B63", accent: "#3C6596" },
  { nameKey: "paletteGreen", primary: "#174C3C", accent: "#4D806F" },
  { nameKey: "paletteWine", primary: "#6B2638", accent: "#A35D6A" },
  { nameKey: "palettePlum", primary: "#4C2E5F", accent: "#806294" },
  { nameKey: "paletteCharcoal", primary: "#263238", accent: "#607D8B" },
] as const;

const STORAGE_KEY = "cv-simple-data";
const NAVIGATION_DRAFT_KEY = "cv-simple-navigation-draft";

const fontOptions = [
  { value: "sans", labelKey: "fontSans", css: "Arial, Helvetica, sans-serif" },
  { value: "humanist", labelKey: "fontHumanist", css: "Calibri, Candara, Arial, sans-serif" },
  { value: "serif", labelKey: "fontSerif", css: "Georgia, 'Times New Roman', serif" },
  { value: "times", labelKey: "fontTimes", css: "'Times New Roman', Times, serif" },
] as const;

const templateOptions = ["classic", "modern", "minimal", "right", "compact", "contrast", "editorial", "harvard"] as const;

function Counter({ value, max }: { value?: string; max: number }) {
  const length = value?.length ?? 0;
  return (
    <Typography component="span" variant="caption" color={length >= max ? "error" : "text.secondary"}>
      {length}/{max}
    </Typography>
  );
}

function SortableEditorSection({ id, order, label, children }: { id: string; order: number; label: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <Box
      ref={setNodeRef}
      className={`sortable-editor-section${isDragging ? " dragging" : ""}`}
      style={{ order, transform: CSS.Transform.toString(transform), transition }}
    >
      <IconButton
        className="accordion-drag-handle"
        {...attributes}
        {...listeners}
        aria-label={label}
        size="small"
      >
        <DragIndicatorRounded fontSize="small" />
      </IconButton>
      {children}
    </Box>
  );
}

function EditableSectionTitle({
  value,
  fallback,
  editLabel,
  onChange,
  suffix,
}: {
  value?: string;
  fallback: string;
  editLabel: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <Stack className="editable-section-title" direction="row" alignItems="center" spacing={0.5}>
      {editing ? (
        <TextField
          autoFocus
          size="small"
          value={value ?? ""}
          placeholder={fallback}
          inputProps={{ maxLength: 50, "aria-label": editLabel }}
          onChange={(event) => onChange(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter" || event.key === "Escape") setEditing(false);
          }}
          onBlur={() => setEditing(false)}
        />
      ) : (
        <Typography fontWeight={750}>{value?.trim() || fallback}{suffix ?? ""}</Typography>
      )}
      {!editing && (
        <IconButton
          className="section-title-edit-button"
          size="small"
          aria-label={editLabel}
          onClick={(event) => {
            event.stopPropagation();
            setEditing(true);
          }}
        >
          <EditRounded fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );
}

function SortableFormItem({ id, label, children, mobileHandleInside = false }: { id: string; label: string; children: ReactNode; mobileHandleInside?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <Box
      className={`sortable-form-item${mobileHandleInside ? " mobile-handle-inside" : ""}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        position: "relative",
        zIndex: isDragging ? 3 : 0,
        display: "flex",
        alignItems: "flex-start",
        gap: 0.75,
        opacity: isDragging ? 0.88 : 1,
      }}
    >
      <IconButton
        className="sortable-form-handle"
        {...attributes}
        {...listeners}
        aria-label={label}
        size="small"
        sx={{ mt: 0.5, flex: "0 0 36px", cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "text.secondary" }}
      >
        <DragIndicatorRounded fontSize="small" />
      </IconButton>
      <Box sx={{ minWidth: 0, flex: 1 }}>{children}</Box>
    </Box>
  );
}

export default function Home() {
  const t = useTranslations("App");
  const jobMatchT = useTranslations("JobMatch");
  const locale = useLocale();
  const templatesPath = locale === "en" ? "/en/templates" : "/es/plantillas";
  const jobMatchPath = locale === "en" ? "/en/job-match" : "/es/analizar-vacante";
  const toolsPath = locale === "en" ? "/en/tools" : "/es/herramientas";
  const resumeReviewPath = locale === "en" ? "/en/resume-review" : "/es/revisar-cv";
  const initialCv = useMemo(() => getInitialCv(locale), [locale]);
  const { control, register, reset, setValue } = useForm<CvData>({
    defaultValues: initialCv,
    mode: "onChange",
  });
  const data = useWatch({ control }) as CvData;
  // Keep controlled inputs responsive while the comparatively expensive CV preview
  // catches up at a lower priority.
  const previewData = useDeferredValue(data);
  const previewPaperRef = useRef<HTMLElement>(null);
  const [editorReady, setEditorReady] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const skills = useFieldArray({ control, name: "skills" });
  const languages = useFieldArray({ control, name: "languages" });
  const experiences = useFieldArray({ control, name: "experiences" });
  const education = useFieldArray({ control, name: "education" });
  const certifications = useFieldArray({ control, name: "certifications" });
  const customSections = useFieldArray({ control, name: "customSections" });
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeSuccess, setNoticeSuccess] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [activeCvId, setActiveCvId] = useState<string | null>(null);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlan[]>([]);
  const [improvementsOpen, setImprovementsOpen] = useState(false);
  const [showFloatingImprovements, setShowFloatingImprovements] = useState(false);
  const [improvementUndo, setImprovementUndo] = useState<{ skills: CvData["skills"]; plans: ImprovementPlan[]; message: "improvementApplied" | "improvementReviewed" | "improvementDismissed" } | null>(null);
  const improvementLoadKeyRef = useRef<string | null>(null);
  const improvementsTriggerRef = useRef<HTMLButtonElement>(null);
  const [cvTitle, setCvTitle] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [translationPromptOpen, setTranslationPromptOpen] = useState(false);
  const [translationTarget, setTranslationTarget] = useState("");
  const [jobMatchDialogOpen, setJobMatchDialogOpen] = useState(false);
  const [selectedJobFamily, setSelectedJobFamily] = useState<JobFamily | "">("");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState<Point>({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [savingCv, setSavingCv] = useState(false);
  const [bulletSortIds, setBulletSortIds] = useState<Record<string, string[]>>({});
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const documentLabels = defaultDocumentLabels[data.documentLocale];
  const exportLabels: ExportLabels = {
    summary: data.sectionTitles.summary?.trim() || documentLabels.summary,
    experience: data.sectionTitles.experience?.trim() || documentLabels.experience,
    skills: data.sectionTitles.skills?.trim() || documentLabels.skills,
    contact: data.sectionTitles.contact?.trim() || documentLabels.contact,
    languages: data.sectionTitles.languages?.trim() || documentLabels.languages,
    education: data.sectionTitles.education?.trim() || documentLabels.education,
    certifications: data.sectionTitles.certifications?.trim() || documentLabels.certifications,
    location: data.sectionTitles.location?.trim() || documentLabels.location,
    phone: data.sectionTitles.phone?.trim() || documentLabels.phone,
    email: data.sectionTitles.email?.trim() || documentLabels.email,
    portfolio: data.sectionTitles.portfolio?.trim() || documentLabels.portfolio,
  };
  const pendingImprovementCount = improvementPlans.reduce((total, plan) => total + plan.suggestions.length, 0);

  useEffect(() => {
    const trigger = improvementsTriggerRef.current;
    if (!trigger || pendingImprovementCount === 0) {
      queueMicrotask(() => setShowFloatingImprovements(false));
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setShowFloatingImprovements(!entry.isIntersecting && entry.boundingClientRect.top < 80);
    }, { rootMargin: "-72px 0px 0px" });
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [pendingImprovementCount]);

  useEffect(() => {
    window.localStorage.removeItem("cv-simple-autosave");
    const searchParams = new URLSearchParams(window.location.search);
    const storedCvId = searchParams.get("cv");
    const professionalPresetId = searchParams.get("preset");
    const forceNew = searchParams.get("new") === "1";
    const requestedDocumentLocale = searchParams.get("documentLocale");
    void (async () => {
      let loaded = false;
      if (forceNew && (requestedDocumentLocale === "es" || requestedDocumentLocale === "en")) {
        reset(getInitialCv(requestedDocumentLocale));
        setActiveCvId(null);
        setCvTitle("");
        window.history.replaceState(null, "", `/${locale}#generator`);
        loaded = true;
      } else if (isProfessionalPresetId(professionalPresetId)) {
        reset(getProfessionalPreset(locale, professionalPresetId));
        setActiveCvId(null);
        setCvTitle("");
        const roleKey = professionalPresetId[0].toUpperCase() + professionalPresetId.slice(1);
        setNotice(t("professionalPresetApplied", { role: t(`professionalPreset${roleKey}`) }));
        setNoticeSuccess(true);
        window.history.replaceState(null, "", `/${locale}#generator`);
        loaded = true;
      } else if (storedCvId) {
        const storedCv = await getStoredCv(storedCvId);
        if (storedCv) {
          reset(normalizeCvData(storedCv.data, storedCv.locale));
          setActiveCvId(storedCv.id);
          setCvTitle(storedCv.title);
          loaded = true;
        }
      }
      if (!loaded) {
        try {
          const navigationDraft = window.sessionStorage.getItem(NAVIGATION_DRAFT_KEY);
          if (navigationDraft) {
            const parsed = JSON.parse(navigationDraft) as { data?: unknown; activeCvId?: string | null; cvTitle?: string };
            reset(normalizeCvData(parsed.data, locale as "es" | "en"));
            setActiveCvId(typeof parsed.activeCvId === "string" ? parsed.activeCvId : null);
            setCvTitle(typeof parsed.cvTitle === "string" ? parsed.cvTitle : "");
            loaded = true;
          }
        } catch {
          // Ignore a malformed temporary draft and fall back to regular local storage.
        } finally {
          window.sessionStorage.removeItem(NAVIGATION_DRAFT_KEY);
        }
      }
      if (!loaded && !forceNew) {
        try {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) reset(normalizeCvData(JSON.parse(saved), locale as "es" | "en"));
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setStorageReady(true);
    })();
  }, [initialCv, locale, reset, t]);

  useEffect(() => {
    if (!storageReady) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        setNotice(t("autoSaveError"));
        setNoticeSuccess(false);
      }
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [data, storageReady, t]);

  useEffect(() => {
    if (!storageReady || !activeCvId) return;
    const timeout = window.setTimeout(() => {
      void (async () => {
        const existing = await getStoredCv(activeCvId);
        if (!existing) return;
        await putStoredCv({
          ...existing,
          locale: data.documentLocale,
          updatedAt: new Date().toISOString(),
          data: structuredClone(data),
        });
      })().catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [activeCvId, data, storageReady]);

  const saveToLibrary = async () => {
    try {
      setSavingCv(true);
      const snapshot = structuredClone(data);
      const existing = activeCvId ? await getStoredCv(activeCvId) : undefined;
      const fallbackTitle = `${data.name.trim() || t("untitledCv")} · ${data.documentLocale.toUpperCase()}`;
      const resolvedTitle = cvTitle.trim() || fallbackTitle;
      const cv = existing
        ? { ...existing, title: resolvedTitle, locale: data.documentLocale, updatedAt: new Date().toISOString(), data: snapshot }
        : createStoredCv(snapshot, data.documentLocale, resolvedTitle);
      await putStoredCv(cv);
      setActiveCvId(cv.id);
      setCvTitle(cv.title);
      setSaveDialogOpen(false);
      window.history.replaceState(null, "", `/?cv=${encodeURIComponent(cv.id)}`);
      setNotice(t(existing ? "cvUpdated" : "cvSaved"));
      setNoticeSuccess(true);
    } catch {
      setNotice(t("cvSaveError"));
      setNoticeSuccess(false);
    } finally {
      setSavingCv(false);
    }
  };

  const activateEditor = () => setEditorReady(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const opensEditorDirectly =
      window.location.hash === "#generator"
      || searchParams.has("cv")
      || searchParams.has("preset")
      || searchParams.has("new")
      || searchParams.get("openEditor") === "1";

    if (opensEditorDirectly || window.scrollY > 240) {
      const activationFrame = window.requestAnimationFrame(() => setEditorReady(true));
      return () => window.cancelAnimationFrame(activationFrame);
    }

    const handleScroll = () => {
      if (window.scrollY <= 240) return;
      setEditorReady(true);
      window.removeEventListener("scroll", handleScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!editorReady) return;
    const searchParams = new URLSearchParams(window.location.search);
    const shouldFocusGenerator = window.location.hash === "#generator" || searchParams.get("openEditor") === "1";
    if (!shouldFocusGenerator) return;

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById("generator")?.scrollIntoView({ block: "start" });
      });
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [editorReady]);

  useEffect(() => {
    if (!storageReady) return;
    const loadKey = activeCvId ?? "current-draft";
    if (improvementLoadKeyRef.current === loadKey) return;
    improvementLoadKeyRef.current = loadKey;
    const frame = window.requestAnimationFrame(() => {
      setImprovementPlans(getImprovementPlans(window.localStorage, createImprovementTarget(data, activeCvId)));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeCvId, data, storageReady]);

  const analyzeCurrentCv = () => {
    if (!selectedJobFamily) return;
    try {
      window.sessionStorage.setItem(NAVIGATION_DRAFT_KEY, JSON.stringify({ data, activeCvId, cvTitle }));
      writeJobMatchTransfer(window.localStorage, data, selectedJobFamily, activeCvId);
      window.location.assign(`${jobMatchPath}?source=editor`);
      setJobMatchDialogOpen(false);
    } catch {
      setNotice(t("jobMatchTransferError"));
      setNoticeSuccess(false);
    }
  };
  const translationPrompt = translationTarget.trim() ? t("translationPromptTemplate", {
    language: translationTarget.trim(),
    json: JSON.stringify({ ...data, photo: undefined }, null, 2),
  }) : "";

  const copyTranslationPrompt = async () => {
    if (!translationPrompt) return;
    await navigator.clipboard.writeText(translationPrompt);
    setNotice(t("translationPromptCopied"));
    setNoticeSuccess(true);
  };

  const focusImprovementSection = (section: ImprovementSuggestion["section"]) => {
    const targetId = section === "headline" ? "improvement-personal" : `improvement-${section}`;
    setImprovementsOpen(false);
    window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const summary = target?.querySelector<HTMLElement>(".MuiAccordionSummary-root");
      const wasCollapsed = summary?.getAttribute("aria-expanded") === "false";
      if (wasCollapsed) summary.click();
      window.setTimeout(() => {
        target.querySelector<HTMLElement>("input, textarea, .MuiAccordionDetails button")?.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, wasCollapsed ? 220 : 0);
    }, 180);
  };

  const addSuggestedSkill = (planId: string, suggestionId: string, term: string) => {
    const normalizedTerm = term.trim().toLocaleLowerCase();
    if (!normalizedTerm || data.skills.some((skill) => skill.name.trim().toLocaleLowerCase() === normalizedTerm)) return;
    if (data.skills.length >= 12) {
      setNotice(t("improvementSkillsLimit"));
      setNoticeSuccess(false);
      return;
    }
    const previousPlans = structuredClone(improvementPlans);
    const previousSkills = structuredClone(data.skills);
    const nextSkills = [...data.skills, { name: term.trim() }];
    const nextDraftTarget = createImprovementTarget({ ...data, skills: nextSkills });
    const nextPlans = improvementPlans.flatMap((plan) => {
      if (plan.id !== planId) return [plan];
      const suggestions = plan.suggestions.flatMap((suggestion) => {
        if (suggestion.id !== suggestionId) return [suggestion];
        const terms = suggestion.terms?.filter((item) => item !== term) ?? [];
        return terms.length ? [{ ...suggestion, terms }] : [];
      });
      return suggestions.length ? [{ ...plan, suggestions }] : [];
    }).map((plan) => plan.target.cvId ? plan : { ...plan, target: nextDraftTarget });
    setValue("skills", nextSkills, { shouldDirty: true });
    setImprovementPlans(nextPlans);
    storeImprovementPlans(window.localStorage, nextPlans);
    setImprovementUndo({ skills: previousSkills, plans: previousPlans, message: "improvementApplied" });
  };

  const removeImprovementSuggestion = (
    planId: string,
    suggestionId: string,
    message: "improvementReviewed" | "improvementDismissed",
  ) => {
    const previousPlans = structuredClone(improvementPlans);
    const nextPlans = improvementPlans.flatMap((plan) => {
      if (plan.id !== planId) return [plan];
      const suggestions = plan.suggestions.filter((suggestion) => suggestion.id !== suggestionId);
      return suggestions.length ? [{ ...plan, suggestions }] : [];
    });
    setImprovementPlans(nextPlans);
    storeImprovementPlans(window.localStorage, nextPlans);
    setImprovementUndo({ skills: structuredClone(data.skills), plans: previousPlans, message });
  };

  const dismissImprovementPlan = (planId: string) => {
    const previousPlans = structuredClone(improvementPlans);
    removeImprovementPlan(window.localStorage, planId);
    setImprovementPlans((current) => current.filter((plan) => plan.id !== planId));
    setImprovementUndo({ skills: structuredClone(data.skills), plans: previousPlans, message: "improvementDismissed" });
  };

  const undoImprovement = () => {
    if (!improvementUndo) return;
    setValue("skills", improvementUndo.skills, { shouldDirty: true });
    setImprovementPlans(improvementUndo.plans);
    storeImprovementPlans(window.localStorage, improvementUndo.plans);
    setImprovementUndo(null);
  };

  const reviewCurrentCv = () => {
    try {
      window.sessionStorage.setItem(NAVIGATION_DRAFT_KEY, JSON.stringify({ data, activeCvId, cvTitle }));
      writeResumeReviewTransfer(window.localStorage, data, activeCvId);
      window.location.assign(`${resumeReviewPath}?source=editor`);
    } catch {
      setNotice(t("resumeReviewTransferError"));
      setNoticeSuccess(false);
    }
  };

  const openSaveDialog = () => {
    if (!activeCvId && !cvTitle) {
      setCvTitle(`${data.name.trim() || t("untitledCv")} · ${data.documentLocale.toUpperCase()}`);
    }
    setSaveDialogOpen(true);
  };

  const sectionLabel = (section: string) => {
    if (mainSectionIds.includes(section as MainSectionId)) {
      const mainSection = section as MainSectionId;
      return data.sectionTitles[mainSection]?.trim() || ({
        summary: documentLabels.summary,
        experience: documentLabels.experience,
        education: documentLabels.education,
        certifications: documentLabels.certifications,
        skills: documentLabels.skills,
      })[mainSection];
    }
    return data.customSections.find((item) => item.id === section)?.title.trim() || t("untitledSection");
  };

  const fullContentOrder = normalizeContentOrder(data.contentOrder, data.sectionOrder, data.customSections);
  const previewContentOrder = normalizeContentOrder(
    previewData.contentOrder,
    previewData.sectionOrder,
    previewData.customSections,
  );
  const previewDocumentLabels = defaultDocumentLabels[previewData.documentLocale];

  const previewSectionLabel = (section: string) => {
    if (mainSectionIds.includes(section as MainSectionId)) {
      const mainSection = section as MainSectionId;
      return previewData.sectionTitles[mainSection]?.trim() || ({
        summary: previewDocumentLabels.summary,
        experience: previewDocumentLabels.experience,
        education: previewDocumentLabels.education,
        certifications: previewDocumentLabels.certifications,
        skills: previewDocumentLabels.skills,
      })[mainSection];
    }
    return previewData.customSections.find((item) => item.id === section)?.title.trim() || t("untitledSection");
  };

  const handleSectionDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const currentOrder = fullContentOrder;
    const oldIndex = currentOrder.indexOf(String(active.id));
    const newIndex = currentOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setValue("contentOrder", arrayMove(currentOrder, oldIndex, newIndex), { shouldDirty: true });
  };

  const moveFieldArrayItem = (ids: string[], move: (from: number, to: number) => void) =>
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex >= 0 && newIndex >= 0) move(oldIndex, newIndex);
    };

  const addCustomSection = () => {
    if (customSections.fields.length >= 3) return;
    const id = `custom-${crypto.randomUUID()}`;
    customSections.append({ id, title: "", type: "text", text: "", items: [] });
    setValue("contentOrder", [...fullContentOrder, id], { shouldDirty: true });
  };

  const removeCustomSection = (index: number) => {
    const id = data.customSections[index]?.id;
    customSections.remove(index);
    if (id) setValue("contentOrder", data.contentOrder.filter((item) => item !== id), { shouldDirty: true });
  };

  const changeLocale = (nextLocale: "es" | "en") => {
    if (nextLocale === locale) return;
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    window.location.assign(`/${nextLocale}${window.location.search}`);
  };

  const runExport = async (type: "pdf" | "docx") => {
    try {
      setExporting(type);
      setNotice("");
      setNoticeSuccess(false);
      if (type === "pdf") await exportPdf(data, exportLabels);
      else await exportDocx(data, exportLabels);
      setNotice(t("fileGenerated", { type: type.toUpperCase() }));
      setNoticeSuccess(true);
    } catch {
      setNotice(t("generationError"));
      setNoticeSuccess(false);
    } finally {
      setExporting(null);
    }
  };

  const onPhoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2_000_000) {
      setNotice(t("imageError"));
      setNoticeSuccess(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropPosition({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setCropZoom(1);
      setPendingPhoto(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const applyPhotoCrop = async () => {
    if (!pendingPhoto || !croppedAreaPixels) return;
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Invalid image"));
      image.src = pendingPhoto;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 700;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    setValue("photo", canvas.toDataURL("image/jpeg", 0.9), { shouldDirty: true });
    setPendingPhoto(null);
  };

  const hasContact = [previewData.phone, previewData.email, previewData.portfolio, previewData.location].some(Boolean);
  const skillItems = previewData.skills.map((skill) => skill.name.trim()).filter(Boolean);
  const customContentLength = data.customSections.reduce(
    (total, section) => total + section.title.length + section.text.length + section.items.reduce((sum, item) => sum + item.text.length, 0),
    0,
  );
  const used = data.experiences.reduce(
    (total, item) => total + item.bullets.join("").length + item.company.length + item.role.length,
    data.summary.length +
      data.skills.reduce((total, skill) => total + skill.name.length, 0) +
      data.education.reduce((total, item) => total + item.institution.length + item.degree.length, 0) +
      data.certifications.reduce((total, item) => total + item.name.length + item.issuer.length, 0) +
      customContentLength,
  );
  const spaceStatus = used > 1750 ? "high" : used > 1200 ? "medium" : "optimal";
  const localizedStatus =
    spaceStatus === "high" ? t("statusHigh") : spaceStatus === "medium" ? t("statusMedium") : t("statusOptimal");

  useEffect(() => {
    const paper = previewPaperRef.current;
    if (!paper) return;

    let frame = 0;
    let iteration = 0;
    const fitContent = () => {
      const paperScale = Number.parseFloat(getComputedStyle(paper).getPropertyValue("--paper-scale")) || 0.74;
      if (iteration === 0) paper.style.setProperty("--scale", String(paperScale));

      frame = requestAnimationFrame(() => {
        const columns = Array.from(paper.querySelectorAll<HTMLElement>(".cv-sidebar, .cv-main"));
        const paperRect = paper.getBoundingClientRect();
        const overflowRatio = Math.max(1, ...columns.map((column) => {
          const columnRect = column.getBoundingClientRect();
          const availableHeight = Math.max(paperRect.bottom - columnRect.top, 1);
          return column.scrollHeight / availableHeight;
        }));
        if (overflowRatio <= 1.002 || iteration >= 3) return;

        const currentScale = Number.parseFloat(getComputedStyle(paper).getPropertyValue("--scale")) || paperScale;
        paper.style.setProperty("--scale", String(Math.max(paperScale * 0.68, currentScale / overflowRatio * 0.99)));
        iteration += 1;
        fitContent();
      });
    };

    fitContent();
    const handleResize = () => {
      cancelAnimationFrame(frame);
      iteration = 0;
      fitContent();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [previewData, editorReady]);
  const renderMainSection = (section: string) => {
    if (!mainSectionIds.includes(section as MainSectionId)) {
      const custom = previewData.customSections.find((item) => item.id === section);
      if (!custom) return null;
      if (custom.type === "text") {
        return custom.text.trim() ? <section className={`cv-section cv-section-${section}`} key={section}><h3>{custom.title || t("untitledSection")}</h3><p>{custom.text}</p></section> : null;
      }
      const items = custom.items.filter((item) => item.text.trim());
      return items.length ? <section className={`cv-section cv-section-${section}`} key={section}><h3>{custom.title || t("untitledSection")}</h3><ul className="cv-skills">{items.map((item) => <li key={item.id}>{item.text}</li>)}</ul></section> : null;
    }
    if (section === "summary") {
      return previewData.summary ? <section className="cv-section cv-section-summary" key={section}><h3>{previewSectionLabel(section)}</h3><p>{previewData.summary}</p></section> : null;
    }
    if (section === "experience") {
      const items = previewData.experiences.filter((item) => item.company || item.role);
      return items.length ? <section className="cv-section cv-section-experience" key={section}><h3>{previewSectionLabel(section)}</h3>{items.map((item, index) => <div className="cv-experience" key={`${item.company}-${index}`}><h4>{item.company}{item.company && item.role ? " — " : ""}<i>{item.role}</i></h4><p className="cv-meta">{[item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</p><ul>{item.bullets.filter(Boolean).map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul></div>)}</section> : null;
    }
    if (section === "education") {
      const items = previewData.education.filter((item) => item.institution || item.degree);
      return items.length ? <section className="cv-section cv-section-education" key={section}><h3>{previewSectionLabel(section)}</h3>{items.map((item, index) => <div className="cv-experience" key={`${item.institution}-${index}`}><h4>{item.institution}{item.institution && item.degree ? " — " : ""}<i>{item.degree}</i></h4><p className="cv-meta">{[item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</p></div>)}</section> : null;
    }
    if (section === "certifications") {
      const items = previewData.certifications.filter((item) => item.name || item.issuer);
      return items.length ? <section className="cv-section cv-section-certifications" key={section}><h3>{previewSectionLabel(section)}</h3>{items.map((item, index) => <div className="cv-experience" key={`${item.name}-${index}`}><h4>{item.name}</h4><p className="cv-meta">{[item.issuer, item.date].filter(Boolean).join(" · ")}</p></div>)}</section> : null;
    }
    return skillItems.length ? <section className="cv-section cv-section-skills" key={section}><h3>{previewSectionLabel(section)}</h3><ul className="cv-skills">{skillItems.map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}</ul></section> : null;
  };

  const faqItems = [1, 2, 3, 4, 5, 6, 7, 8].map((item) => ({
    question: t(`faq${item}Question`),
    answer: t(`faq${item}Answer`),
  }));
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c") }}
      />
      <SiteHeader
        locale={locale}
        active="generator"
        onSave={openSaveDialog}
        saveLabel={savingCv ? t("savingCv") : activeCvId ? t("updateCv") : t("saveCv")}
        saveDisabled={savingCv}
        onLocaleChange={changeLocale}
        actions={<Box className="topbar-actions">
          <Button
              variant="contained"
              className="save-cv-button"
            startIcon={<SaveRounded />}
            onClick={openSaveDialog}
            disabled={savingCv}
            sx={{ whiteSpace: "nowrap" }}
          >
            {savingCv ? t("savingCv") : activeCvId ? t("updateCv") : t("saveCv")}
          </Button>
          <ButtonGroup size="small" aria-label="Language selector">
            <Button
              variant={locale === "es" ? "contained" : "outlined"}
              onClick={() => changeLocale("es")}
              startIcon={locale === "es" ? <LanguageRounded /> : undefined}
            >
              ES
            </Button>
            <Button
              variant={locale === "en" ? "contained" : "outlined"}
              onClick={() => changeLocale("en")}
              startIcon={locale === "en" ? <LanguageRounded /> : undefined}
            >
              EN
            </Button>
          </ButtonGroup>
        </Box>}
      />

      <Container maxWidth={false} disableGutters className="site-content" sx={{ py: { xs: 2, md: 3 } }}>
        <Box className="intro">
          <Box className="hero-copy">
            <Chip className="hero-eyebrow" size="small" label={t("heroEyebrow")} />
            <Typography variant="h3" component="h1">{t("heroTitle")}</Typography>
            <Typography className="hero-description" color="text.secondary">
              {t("heroDescription")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} mt={2.5}>
              <Button variant="contained" size="large" component="a" href="#generator" onClick={activateEditor}>
                {t("heroPrimaryCta")}
              </Button>
              <Button variant="outlined" size="large" component="a" href={templatesPath}>
                {t("heroSecondaryCta")}
              </Button>
            </Stack>
            <Box className="hero-trust-list">
              {[t("heroTrustFree"), t("heroTrustUnlimitedDownloads"), t("heroTrustNoAccount"), t("heroTrustLocal")].map((item) => (
                <span key={item}><CheckCircleRounded fontSize="small" />{item}</span>
              ))}
            </Box>
          </Box>
          <Box className="hero-visual" aria-hidden="true">
            <div className="hero-document">
              <span className="hero-document-sidebar" />
              <span className="hero-document-title" />
              <span className="hero-document-line line-one" />
              <span className="hero-document-line line-two" />
              <span className="hero-document-heading" />
              <span className="hero-document-line line-three" />
              <span className="hero-document-line line-four" />
            </div>
            <div className="hero-format format-pdf">PDF</div>
            <div className="hero-format format-docx">DOCX</div>
            <div className="hero-private"><LockOutlined fontSize="small" />{t("heroPrivateBadge")}</div>
          </Box>
        </Box>

        <Box component="aside" className="professional-presets-cta">
          <span className="professional-preset-icon"><WorkOutlineRounded /></span>
          <Box>
            <Typography fontWeight={800}>{t("professionalPresetsCompactTitle")}</Typography>
            <Typography variant="body2" color="text.secondary">{t("professionalPresetsCompactDescription")}</Typography>
          </Box>
          <Button component="a" href={templatesPath} variant="outlined">{t("exploreProfessionalPresets")}</Button>
        </Box>

        <Box id="generator">
        {editorReady ? <>
        <Stack className="editor-toolbar" direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
          <Typography component="h2" variant="h6" fontWeight={800}>{t("editorHeading")}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {improvementPlans.length > 0 && (
              <Button
                ref={improvementsTriggerRef}
                type="button"
                variant="contained"
                size="small"
                startIcon={<TipsAndUpdatesOutlined />}
                onClick={() => setImprovementsOpen(true)}
              >
                {t("pendingImprovements", { count: pendingImprovementCount })}
              </Button>
            )}
            <Chip
              color={spaceStatus === "high" ? "warning" : "success"}
              variant="outlined"
              icon={<CheckCircleRounded />}
              label={t("pageUsage", { status: localizedStatus })}
            />
            <Tooltip title={t("restoreExample")}>
              <IconButton onClick={() => setRestoreDialogOpen(true)} aria-label={t("restoreExample")}><RestartAltRounded /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {notice && <Alert className="editor-notice" severity={noticeSuccess ? "success" : "info"} sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}

        <Box className="workspace">
          <DndContext id="editor-sections-order" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={fullContentOrder} strategy={verticalListSortingStrategy}>
          <Box className="editor-column">
            <Accordion defaultExpanded sx={sectionSx} id="improvement-personal">
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("personalInfo")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Controller
                    control={control}
                    name="documentLocale"
                    render={({ field }) => (
                      <TextField select label={t("documentLanguage")} helperText={t("documentLanguageHelp")} {...field}>
                        <MenuItem value="es">{t("documentLanguageSpanish")}</MenuItem>
                        <MenuItem value="en">{t("documentLanguageEnglish")}</MenuItem>
                      </TextField>
                    )}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label={t("name")}
                      inputProps={{ maxLength: 50 }}
                      helperText={<Counter value={data.name} max={50} />}
                      {...register("name")}
                    />
                    <TextField
                      label={t("professionalTitle")}
                      inputProps={{ maxLength: 60 }}
                      helperText={<Counter value={data.headline} max={60} />}
                      {...register("headline")}
                    />
                  </Stack>
                  <Box className="photo-control">
                    {data.photo ? <img src={data.photo} alt={t("photoPreview")} /> : <UploadRounded color="primary" />}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography fontWeight={700}>{t("optionalPhoto")}</Typography>
                      <Typography variant="caption" color="text.secondary">{t("photoHelp")}</Typography>
                    </Box>
                    <Button type="button" variant="outlined" startIcon={<UploadRounded />} onClick={() => photoInputRef.current?.click()}>
                      {t("choose")}
                    </Button>
                    <input
                      ref={photoInputRef}
                      hidden
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(event) => {
                        onPhoto(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    {data.photo && (
                      <>
                        <ButtonGroup size="small" aria-label={t("photoShape")}>
                          <Button
                            variant={data.photoShape === "square" ? "contained" : "outlined"}
                            onClick={() => setValue("photoShape", "square", { shouldDirty: true })}
                          >
                            {t("squarePhoto")}
                          </Button>
                          <Button
                            variant={data.photoShape === "round" ? "contained" : "outlined"}
                            onClick={() => setValue("photoShape", "round", { shouldDirty: true })}
                          >
                            {t("roundPhoto")}
                          </Button>
                        </ButtonGroup>
                        <IconButton className="photo-remove-button" aria-label={t("removePhoto")} onClick={() => setValue("photo", undefined)}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion className="custom-sections-panel" sx={{ ...sectionSx, order: 90 }}>
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("customSections")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" mb={2}>{t("customSectionsHelp")}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Box>
                    <Typography fontWeight={700}>{t("customSections")}</Typography>
                    <Typography variant="caption" color="text.secondary">{t("customSectionsLimit", { count: customSections.fields.length })}</Typography>
                  </Box>
                  <Button startIcon={<AddRounded />} disabled={customSections.fields.length >= 3} onClick={addCustomSection}>
                    {t("addCustomSection")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {customSections.fields.map((field, index) => {
              const section = data.customSections[index];
              if (!section) return null;
              const fallbackTitle = t("customSectionNumber", { number: index + 1 });
              return (
                <SortableEditorSection
                  key={field.id}
                  id={section.id}
                  order={10 + fullContentOrder.indexOf(section.id)}
                  label={t("reorderItem", { item: section.title.trim() || fallbackTitle })}
                >
                  <Accordion sx={sectionSx}>
                    <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                      <EditableSectionTitle
                        value={section.title}
                        fallback={fallbackTitle}
                        editLabel={t("editSectionTitle", { title: section.title.trim() || fallbackTitle })}
                        onChange={(value) => setValue(`customSections.${index}.title`, value, { shouldDirty: true })}
                      />
                      <IconButton
                        aria-label={t("removeCustomSection", { number: index + 1 })}
                        onClick={(event) => { event.stopPropagation(); removeCustomSection(index); }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1.5}>
                        <TextField
                          select
                          label={t("sectionType")}
                          value={section.type}
                          onChange={(event) => setValue(`customSections.${index}.type`, event.target.value as "text" | "list", { shouldDirty: true })}
                        >
                          <MenuItem value="text">{t("textSection")}</MenuItem>
                          <MenuItem value="list">{t("listSection")}</MenuItem>
                        </TextField>
                        {section.type === "text" ? (
                          <Box>
                            <Typography component="label" variant="caption" color="text.secondary">{t("sectionContent")}</Typography>
                            <Box
                              component="textarea"
                              aria-label={t("sectionContent")}
                              rows={3}
                              maxLength={500}
                              {...register(`customSections.${index}.text`)}
                              sx={{ display: "block", width: "100%", mt: 0.5, p: 1.5, resize: "vertical", font: "inherit", color: "text.primary", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, outline: 0, "&:focus": { borderColor: "primary.main", boxShadow: "0 0 0 1px", color: "primary.main" } }}
                            />
                            <Counter value={section.text} max={500} />
                          </Box>
                        ) : (
                          <>
                            <DndContext
                              id={`custom-section-items-${index}`}
                              sensors={dndSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={({ active, over }) => {
                                if (!over || active.id === over.id) return;
                                const ids = section.items.map((item) => item.id);
                                const oldIndex = ids.indexOf(String(active.id));
                                const newIndex = ids.indexOf(String(over.id));
                                if (oldIndex >= 0 && newIndex >= 0) setValue(`customSections.${index}.items`, arrayMove(section.items, oldIndex, newIndex), { shouldDirty: true });
                              }}
                            >
                              <SortableContext items={section.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                                <Stack spacing={1}>
                                  {section.items.map((item, itemIndex) => (
                                    <SortableFormItem key={item.id} id={item.id} label={t("reorderItem", { item: t("listItemNumber", { number: itemIndex + 1 }) })}>
                                      <Stack direction="row" spacing={1} alignItems="flex-start">
                                        <TextField label={t("listItemNumber", { number: itemIndex + 1 })} inputProps={{ maxLength: 120 }} helperText={<Counter value={item.text} max={120} />} {...register(`customSections.${index}.items.${itemIndex}.text`)} />
                                        <IconButton aria-label={t("removeListItem", { number: itemIndex + 1 })} onClick={() => setValue(`customSections.${index}.items`, section.items.filter((_, currentIndex) => currentIndex !== itemIndex), { shouldDirty: true })}>
                                          <DeleteOutlineRounded />
                                        </IconButton>
                                      </Stack>
                                    </SortableFormItem>
                                  ))}
                                </Stack>
                              </SortableContext>
                            </DndContext>
                            <Button startIcon={<AddRounded />} disabled={section.items.length >= 8} onClick={() => setValue(`customSections.${index}.items`, [...section.items, { id: crypto.randomUUID(), text: "" }], { shouldDirty: true })} sx={{ alignSelf: "flex-start" }}>
                              {t("addListItem")}
                            </Button>
                          </>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </SortableEditorSection>
              );
            })}

            <Accordion defaultExpanded sx={{ ...sectionSx, scrollMarginTop: "88px" }} id="templates">
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ColorLensRounded color="primary" fontSize="small" />
                  <Typography fontWeight={750}>{t("templateColors")}</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {t("colorsHelp")}
                </Typography>
                <Typography fontWeight={700} mb={1}>{t("chooseTemplate")}</Typography>
                <Box className="template-list">
                  {templateOptions.map((template) => (
                    <button
                      type="button"
                      className={`template-option${data.template === template ? " selected" : ""}`}
                      key={template}
                      aria-pressed={data.template === template}
                      onClick={() => setValue("template", template, { shouldDirty: true })}
                    >
                      <span className={`template-thumbnail template-thumbnail-${template}`} aria-hidden="true">
                        <i /><b /><em />
                      </span>
                      {t(`template${template[0].toUpperCase()}${template.slice(1)}`)}
                    </button>
                  ))}
                </Box>
                <Typography fontWeight={700} mt={2} mb={1}>{t("typography")}</Typography>
                <TextField
                  select
                  label={t("chooseFont")}
                  value={data.fontFamily}
                  onChange={(event) => setValue("fontFamily", event.target.value as CvData["fontFamily"], { shouldDirty: true })}
                  sx={{ mt: 2, maxWidth: 320 }}
                >
                  {fontOptions.map((font) => (
                    <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.css }}>
                      {t(font.labelKey)}
                    </MenuItem>
                  ))}
                </TextField>
                <Divider sx={{ my: 2 }} />
                <Box className="palette-list">
                  {colorPresets.map((preset) => {
                    const paletteName = t(preset.nameKey);
                    const selected =
                      data.primaryColor === preset.primary && data.accentColor === preset.accent;
                    return (
                      <button
                        className={`palette-option${selected ? " selected" : ""}`}
                        type="button"
                        key={preset.nameKey}
                        aria-label={t("usePalette", { name: paletteName })}
                        aria-pressed={selected}
                        onClick={() => {
                          setValue("primaryColor", preset.primary, { shouldDirty: true });
                          setValue("accentColor", preset.accent, { shouldDirty: true });
                        }}
                      >
                        <span style={{ backgroundColor: preset.primary }} />
                        <span style={{ backgroundColor: preset.accent }} />
                        <small>{paletteName}</small>
                      </button>
                    );
                  })}
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
                  <TextField
                    label={t("primaryColor")}
                    type="color"
                    inputProps={{ "aria-label": t("primaryColor") }}
                    {...register("primaryColor")}
                  />
                  <TextField
                    label={t("accentColor")}
                    type="color"
                    inputProps={{ "aria-label": t("accentColor") }}
                    {...register("accentColor")}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={sectionSx} id="improvement-contact">
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <EditableSectionTitle
                  value={data.sectionTitles.contact}
                  fallback={documentLabels.contact}
                  suffix={` (${t("allOptional")})`}
                  editLabel={t("editSectionTitle", { title: data.sectionTitles.contact?.trim() || documentLabels.contact })}
                  onChange={(value) => setValue("sectionTitles.contact", value, { shouldDirty: true })}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Box className="form-grid">
                  <TextField label={data.sectionTitles.phone?.trim() || documentLabels.phone} inputProps={{ maxLength: 25 }} {...register("phone")} />
                  <TextField label={data.sectionTitles.email?.trim() || documentLabels.email} type="email" inputProps={{ maxLength: 100 }} {...register("email")} />
                  <TextField label={data.sectionTitles.portfolio?.trim() || documentLabels.portfolio} inputProps={{ maxLength: 150 }} {...register("portfolio")} />
                  <TextField label={data.sectionTitles.location?.trim() || documentLabels.location} inputProps={{ maxLength: 80 }} {...register("location")} />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={2} mb={1}>{t("editContactLabels")}</Typography>
                <Box className="form-grid compact-label-grid">
                  {(["phone", "email", "portfolio", "location"] as const).map((label) => (
                    <TextField
                      key={label}
                      label={documentLabels[label]}
                      placeholder={documentLabels[label]}
                      inputProps={{ maxLength: 50 }}
                      {...register(`sectionTitles.${label}`)}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            <SortableEditorSection id="summary" order={10 + fullContentOrder.indexOf("summary")} label={t("reorderItem", { item: sectionLabel("summary") })}>
            <Accordion defaultExpanded sx={sectionSx} id="improvement-summary">
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <EditableSectionTitle
                  value={data.sectionTitles.summary}
                  fallback={documentLabels.summary}
                  editLabel={t("editSectionTitle", { title: sectionLabel("summary") })}
                  onChange={(value) => setValue("sectionTitles.summary", value, { shouldDirty: true })}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography component="label" variant="caption" color="text.secondary">
                    {t("aboutYou")}
                  </Typography>
                  <Box
                    component="textarea"
                    aria-label={t("aboutYou")}
                    rows={4}
                    maxLength={600}
                    {...register("summary")}
                    sx={{
                      display: "block", width: "100%", mt: 0.5, p: 1.5,
                      resize: "vertical", font: "inherit", color: "text.primary",
                      bgcolor: "background.paper", border: "1px solid", borderColor: "divider",
                      borderRadius: 1, outline: 0, "&:focus": { borderColor: "primary.main", boxShadow: "0 0 0 1px", color: "primary.main" },
                    }}
                  />
                  <Counter value={data.summary} max={600} />
                </Box>
              </AccordionDetails>
            </Accordion>
            </SortableEditorSection>

            <SortableEditorSection id="skills" order={10 + fullContentOrder.indexOf("skills")} label={t("reorderItem", { item: sectionLabel("skills") })}>
            <Accordion defaultExpanded sx={sectionSx} id="improvement-skills">
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <EditableSectionTitle
                  value={data.sectionTitles.skills}
                  fallback={documentLabels.skills}
                  suffix={` (${skills.fields.length}/12)`}
                  editLabel={t("editSectionTitle", { title: sectionLabel("skills") })}
                  onChange={(value) => setValue("sectionTitles.skills", value, { shouldDirty: true })}
                />
              </AccordionSummary>
              <AccordionDetails>
                <DndContext id="skills-order" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={moveFieldArrayItem(skills.fields.map((field) => field.id), skills.move)}>
                      <SortableContext items={skills.fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                        <Stack spacing={1}>
                          {skills.fields.map((field, index) => (
                            <SortableFormItem key={field.id} id={field.id} label={t("reorderItem", { item: t("skillNumber", { number: index + 1 }) })}>
                              <Stack direction="row" spacing={1} alignItems="flex-start">
                                <TextField
                                  label={t("skillNumber", { number: index + 1 })}
                                  placeholder={t("skillsPlaceholder")}
                                  inputProps={{ maxLength: 100 }}
                                  helperText={<Counter value={data.skills[index]?.name} max={100} />}
                                  {...register(`skills.${index}.name`)}
                                />
                                <IconButton
                                  aria-label={t("removeSkill", { number: index + 1 })}
                                  onClick={() => skills.remove(index)}
                                  sx={{ width: 40, height: 40, flex: "0 0 40px", mt: 0.5 }}
                                >
                                  <DeleteOutlineRounded />
                                </IconButton>
                              </Stack>
                            </SortableFormItem>
                          ))}
                        </Stack>
                      </SortableContext>
                </DndContext>
                <Stack spacing={1} mt={1}>
                  <Button
                    startIcon={<AddRounded />}
                    disabled={skills.fields.length >= 12}
                    onClick={() => skills.append({ name: "" })}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {t("addSkill")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
            </SortableEditorSection>

            <Accordion sx={sectionSx}>
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <EditableSectionTitle
                  value={data.sectionTitles.languages}
                  fallback={documentLabels.languages}
                  suffix={` (${languages.fields.length}/5)`}
                  editLabel={t("editSectionTitle", { title: data.sectionTitles.languages?.trim() || documentLabels.languages })}
                  onChange={(value) => setValue("sectionTitles.languages", value, { shouldDirty: true })}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                <DndContext id="languages-order" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={moveFieldArrayItem(languages.fields.map((field) => field.id), languages.move)}>
                    <SortableContext items={languages.fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                      <Stack spacing={1.5}>
                        {languages.fields.map((field, index) => (
                          <SortableFormItem key={field.id} id={field.id} label={t("reorderItem", { item: `${t("language")} ${index + 1}` })}>
                            <Stack direction="row" spacing={1}>
                              <TextField label={t("language")} inputProps={{ maxLength: 30 }} {...register(`languages.${index}.name`)} />
                              <TextField label={t("level")} inputProps={{ maxLength: 40 }} {...register(`languages.${index}.level`)} />
                              <IconButton aria-label={t("removeLanguage", { number: index + 1 })} onClick={() => languages.remove(index)}>
                                <DeleteOutlineRounded />
                              </IconButton>
                            </Stack>
                          </SortableFormItem>
                        ))}
                      </Stack>
                    </SortableContext>
                  </DndContext>
                  <Button
                    startIcon={<AddRounded />}
                    disabled={languages.fields.length >= 5}
                    onClick={() => languages.append({ name: "", level: "" })}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {t("addLanguage")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <SortableEditorSection id="experience" order={10 + fullContentOrder.indexOf("experience")} label={t("reorderItem", { item: sectionLabel("experience") })}>
            <Accordion defaultExpanded sx={sectionSx} id="improvement-experience">
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <EditableSectionTitle
                  value={data.sectionTitles.experience}
                  fallback={documentLabels.experience}
                  suffix={` (${experiences.fields.length}/4)`}
                  editLabel={t("editSectionTitle", { title: sectionLabel("experience") })}
                  onChange={(value) => setValue("sectionTitles.experience", value, { shouldDirty: true })}
                />
              </AccordionSummary>
              <AccordionDetails>
                <DndContext id="experiences-order" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={moveFieldArrayItem(experiences.fields.map((field) => field.id), experiences.move)}>
                  <SortableContext items={experiences.fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={2}>
                      {experiences.fields.map((field, index) => {
                        const bulletIds = bulletSortIds[field.id] ?? [0, 1, 2, 3].map((bulletIndex) => `bullet-${field.id}-${bulletIndex}`);
                        return (
                        <SortableFormItem mobileHandleInside key={field.id} id={field.id} label={t("reorderItem", { item: t("experienceNumber", { number: index + 1 }) })}>
                          <Box className="experience-form">
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Typography fontWeight={750}>{t("experienceNumber", { number: index + 1 })}</Typography>
                        <IconButton aria-label={t("removeExperience", { number: index + 1 })} onClick={() => experiences.remove(index)}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Stack>
                      <Box className="form-grid">
                        <TextField label={t("company")} inputProps={{ maxLength: 60 }} {...register(`experiences.${index}.company`)} />
                        <TextField label={t("role")} inputProps={{ maxLength: 60 }} {...register(`experiences.${index}.role`)} />
                        <TextField label={t("workLocation")} inputProps={{ maxLength: 70 }} {...register(`experiences.${index}.location`)} />
                        <Stack direction="row" spacing={1}>
                          <TextField label={t("from")} inputProps={{ maxLength: 20 }} {...register(`experiences.${index}.start`)} />
                          <TextField label={t("to")} inputProps={{ maxLength: 20 }} {...register(`experiences.${index}.end`)} />
                        </Stack>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1.5} mb={1}>
                        {t("achievements")}
                      </Typography>
                          <DndContext
                            id={`experience-bullets-${index}`}
                            sensors={dndSensors}
                            collisionDetection={closestCenter}
                            onDragEnd={({ active, over }) => {
                              if (!over || active.id === over.id) return;
                              const oldIndex = bulletIds.indexOf(String(active.id));
                              const newIndex = bulletIds.indexOf(String(over.id));
                              if (oldIndex < 0 || newIndex < 0) return;
                              const currentBullets = [0, 1, 2, 3].map((bulletIndex) => data.experiences[index]?.bullets[bulletIndex] ?? "");
                              setBulletSortIds((current) => ({ ...current, [field.id]: arrayMove(bulletIds, oldIndex, newIndex) }));
                              setValue(`experiences.${index}.bullets`, arrayMove(currentBullets, oldIndex, newIndex), { shouldDirty: true });
                            }}
                          >
                            <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
                              <Stack spacing={1}>
                                {bulletIds.map((bulletId, bulletIndex) => (
                                  <SortableFormItem
                                    key={bulletId}
                                    id={bulletId}
                                    label={t("reorderItem", { item: t("bullet", { number: bulletIndex + 1 }) })}
                                  >
                                    <Controller
                                      control={control}
                                      name={`experiences.${index}.bullets.${bulletIndex}`}
                                      defaultValue=""
                                      render={({ field: bulletField }) => (
                                        <TextField
                                          {...bulletField}
                                          value={bulletField.value ?? ""}
                                          label={t("bullet", { number: bulletIndex + 1 })}
                                          multiline
                                          minRows={1}
                                          inputProps={{ maxLength: 160 }}
                                        />
                                      )}
                                    />
                                  </SortableFormItem>
                                ))}
                              </Stack>
                            </SortableContext>
                          </DndContext>
                          </Box>
                        </SortableFormItem>
                        );
                      })}
                    </Stack>
                  </SortableContext>
                </DndContext>
                <Stack mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddRounded />}
                    disabled={experiences.fields.length >= 4}
                    onClick={() =>
                      experiences.append({ company: "", role: "", location: "", start: "", end: "", bullets: [""] })
                    }
                  >
                    {t("addExperience")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
            </SortableEditorSection>

            <SortableEditorSection id="education" order={10 + fullContentOrder.indexOf("education")} label={t("reorderItem", { item: sectionLabel("education") })}>
            <Accordion sx={sectionSx}>
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <EditableSectionTitle
                  value={data.sectionTitles.education}
                  fallback={documentLabels.education}
                  suffix={` (${education.fields.length}/3)`}
                  editLabel={t("editSectionTitle", { title: sectionLabel("education") })}
                  onChange={(value) => setValue("sectionTitles.education", value, { shouldDirty: true })}
                />
              </AccordionSummary>
              <AccordionDetails>
                <DndContext id="education-order" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={moveFieldArrayItem(education.fields.map((field) => field.id), education.move)}>
                  <SortableContext items={education.fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={2}>
                      {education.fields.map((field, index) => (
                        <SortableFormItem mobileHandleInside key={field.id} id={field.id} label={t("reorderItem", { item: t("educationNumber", { number: index + 1 }) })}>
                          <Box className="experience-form">
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Typography fontWeight={750}>{t("educationNumber", { number: index + 1 })}</Typography>
                        <IconButton aria-label={t("removeEducation", { number: index + 1 })} onClick={() => education.remove(index)}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Stack>
                      <Box className="form-grid">
                        <TextField label={t("institution")} inputProps={{ maxLength: 70 }} {...register(`education.${index}.institution`)} />
                        <TextField label={t("degree")} inputProps={{ maxLength: 80 }} {...register(`education.${index}.degree`)} />
                        <TextField label={t("studyLocation")} inputProps={{ maxLength: 70 }} {...register(`education.${index}.location`)} />
                        <Stack direction="row" spacing={1}>
                          <TextField label={t("from")} inputProps={{ maxLength: 20 }} {...register(`education.${index}.start`)} />
                          <TextField label={t("to")} inputProps={{ maxLength: 20 }} {...register(`education.${index}.end`)} />
                        </Stack>
                      </Box>
                          </Box>
                        </SortableFormItem>
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
                <Stack mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddRounded />}
                    disabled={education.fields.length >= 3}
                    onClick={() => education.append({ institution: "", degree: "", location: "", start: "", end: "" })}
                  >
                    {t("addEducation")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
            </SortableEditorSection>

            <SortableEditorSection id="certifications" order={10 + fullContentOrder.indexOf("certifications")} label={t("reorderItem", { item: sectionLabel("certifications") })}>
            <Accordion sx={sectionSx}>
              <AccordionSummary component="div" expandIcon={<ExpandMoreRounded />}>
                <EditableSectionTitle
                  value={data.sectionTitles.certifications}
                  fallback={documentLabels.certifications}
                  suffix={` (${certifications.fields.length}/4)`}
                  editLabel={t("editSectionTitle", { title: sectionLabel("certifications") })}
                  onChange={(value) => setValue("sectionTitles.certifications", value, { shouldDirty: true })}
                />
              </AccordionSummary>
              <AccordionDetails>
                <DndContext id="certifications-order" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={moveFieldArrayItem(certifications.fields.map((field) => field.id), certifications.move)}>
                  <SortableContext items={certifications.fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={2}>
                      {certifications.fields.map((field, index) => (
                        <SortableFormItem mobileHandleInside key={field.id} id={field.id} label={t("reorderItem", { item: t("certificationNumber", { number: index + 1 }) })}>
                          <Box className="experience-form">
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Typography fontWeight={750}>{t("certificationNumber", { number: index + 1 })}</Typography>
                        <IconButton aria-label={t("removeCertification", { number: index + 1 })} onClick={() => certifications.remove(index)}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Stack>
                      <Box className="form-grid">
                        <TextField label={t("certificationName")} inputProps={{ maxLength: 80 }} {...register(`certifications.${index}.name`)} />
                        <TextField label={t("issuer")} inputProps={{ maxLength: 70 }} {...register(`certifications.${index}.issuer`)} />
                        <TextField label={t("certificationDate")} inputProps={{ maxLength: 20 }} {...register(`certifications.${index}.date`)} />
                      </Box>
                          </Box>
                        </SortableFormItem>
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
                <Stack mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AddRounded />}
                    disabled={certifications.fields.length >= 4}
                    onClick={() => certifications.append({ name: "", issuer: "", date: "" })}
                  >
                    {t("addCertification")}
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
            </SortableEditorSection>

            <Alert icon={<LockOutlined />} severity="info" sx={{ mt: 2, order: 100 }}>{t("localPrivacyReminder")}</Alert>
          </Box>
          </SortableContext>
          </DndContext>

          <Box className="preview-column">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box>
                <Typography component="h2" variant="h6">{t("preview")}</Typography>
                <Typography variant="caption" color="text.secondary">{t("a4OnePage")}</Typography>
              </Box>
              <Chip size="small" label="A4" />
            </Stack>

            <Box className="paper-wrap">
              <article
                ref={previewPaperRef}
                className={`cv-paper template-${previewData.template}`}
                style={{
                  "--cv-primary": previewData.primaryColor,
                  "--cv-accent": previewData.accentColor,
                  "--cv-font": fontOptions.find((font) => font.value === previewData.fontFamily)?.css,
                } as CSSProperties}
              >
                <aside
                  className={`cv-sidebar cv-sidebar-${previewData.template}${previewData.photo ? " has-photo" : ""}`}
                  style={["right", "contrast", "editorial"].includes(previewData.template) ? { backgroundColor: previewData.primaryColor, color: "#fff" } : undefined}
                >
                  <div className="top-accent" />
                  <h2>{previewData.name || "Tu nombre"}</h2>
                  {previewData.headline && <p className="cv-headline">{previewData.headline}</p>}
                  {previewData.photo && <img className={`cv-photo photo-${previewData.photoShape}`} src={previewData.photo} alt="" />}
                  {hasContact && (
                    <section className="cv-contact-section">
                      <h3>{previewData.sectionTitles.contact?.trim() || previewDocumentLabels.contact}</h3>
                      {previewData.location && <p><b>{previewData.sectionTitles.location?.trim() || previewDocumentLabels.location}:</b><br />{previewData.location}</p>}
                      {previewData.phone && <p><b>{previewData.sectionTitles.phone?.trim() || previewDocumentLabels.phone}:</b><br />{previewData.phone}</p>}
                      {previewData.email && <p><b>{previewData.sectionTitles.email?.trim() || previewDocumentLabels.email}:</b><br />{previewData.email}</p>}
                      {previewData.portfolio && <p><b>{previewData.sectionTitles.portfolio?.trim() || previewDocumentLabels.portfolio}:</b><br />{previewData.portfolio}</p>}
                    </section>
                  )}
                  {previewData.languages.some((language) => language.name) && (
                    <section className="cv-language-section">
                      <h3>{previewData.sectionTitles.languages?.trim() || previewDocumentLabels.languages}</h3>
                      {previewData.languages.filter((language) => language.name).map((language, index) => (
                        <p className="compact" key={`${language.name}-${index}`}><b>{language.name}:</b> {language.level}</p>
                      ))}
                    </section>
                  )}
                </aside>
                <main className={`cv-main cv-main-${previewData.template}`}>
                  {previewContentOrder.map(renderMainSection)}
                </main>
                <div className="bottom-accent" />
              </article>
            </Box>

            <Box className="export-panel">
              <Typography fontWeight={780}>{t("downloadTitle")}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                {t("downloadPrivacy")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PictureAsPdfRounded />}
                  disabled={!!exporting}
                  onClick={() => runExport("pdf")}
                >
                  {exporting === "pdf" ? t("generating") : t("downloadPdf")}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<InsertDriveFileRounded />}
                  disabled={!!exporting}
                  onClick={() => runExport("docx")}
                >
                  {exporting === "docx" ? t("generating") : t("downloadDocx")}
                </Button>
              </Stack>
              <Box className="translation-prompt-cta">
                <Box>
                  <Typography fontWeight={750} variant="body2">{t("translationPromptTitle")}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{t("translationPromptHelp")}</Typography>
                </Box>
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<AutoAwesomeRounded />}
                  onClick={() => setTranslationPromptOpen(true)}
                >
                  {t("generateTranslationPrompt")}
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box className="job-match-editor-cta job-match-editor-cta-quality">
                <Box>
                  <Typography fontWeight={750} variant="body2">{t("reviewCurrentCv")}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{t("reviewCurrentCvHelp")}</Typography>
                </Box>
                <Button type="button" onClick={reviewCurrentCv} startIcon={<FactCheckOutlined />} variant="outlined" size="small" sx={{ whiteSpace: "nowrap" }}>
                  {t("openResumeReview")}
                </Button>
              </Box>
              <Box className="job-match-editor-cta job-match-editor-cta-match" sx={{ mt: 1.25 }}>
                <Box>
                  <Typography fontWeight={750} variant="body2">{t("analyzeCurrentCv")}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{t("analyzeCurrentCvHelp")}</Typography>
                </Box>
                <Button
                  type="button"
                  onClick={() => setJobMatchDialogOpen(true)}
                  startIcon={<ManageSearchRounded />}
                  variant="outlined"
                  size="small"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {t("openJobMatch")}
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box className="reconvert-box">
                <Box>
                  <Typography fontWeight={750} variant="body2">{t("editedDocx")}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("editedDocxHelp")}
                  </Typography>
                </Box>
                <Button
                  component="a"
                  href="https://www.ilovepdf.com/word_to_pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewRounded />}
                  variant="text"
                  size="small"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {t("convertDocx")}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                {t("externalNotice")}
              </Typography>
            </Box>
          </Box>
        </Box>
        </> : (
          <Box className="editor-deferred-placeholder" aria-label={t("editorHeading")}>
            <Typography component="h2" variant="h6" fontWeight={800}>{t("editorHeading")}</Typography>
          </Box>
        )}
        </Box>
      </Container>

      <Box component="section" className="landing-section landing-how" id="howItWorks">
        <Container maxWidth="lg">
          <Box className="landing-heading">
            <Typography className="section-eyebrow">{t("howEyebrow")}</Typography>
            <Typography variant="h3" component="h2">{t("howTitle")}</Typography>
            <Typography color="text.secondary">{t("howDescription")}</Typography>
          </Box>
          <Box className="steps-grid">
            {[1, 2, 3].map((step) => (
              <Box className="step-card" key={step}>
                <span className="step-number">0{step}</span>
                <Typography variant="h6" component="h3">{t(`step${step}Title`)}</Typography>
                <Typography color="text.secondary">{t(`step${step}Description`)}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-section landing-benefits">
        <Container maxWidth="lg">
          <Box className="landing-heading">
            <Typography className="section-eyebrow">{t("benefitsEyebrow")}</Typography>
            <Typography variant="h3" component="h2">{t("benefitsTitle")}</Typography>
          </Box>
          <Box className="benefits-grid">
            {(["free", "private", "flexible", "onePage"] as const).map((benefit) => (
              <Box className="benefit-card" key={benefit}>
                <CheckCircleRounded color="primary" />
                <Typography variant="h6" component="h3">{t(`benefit${benefit[0].toUpperCase()}${benefit.slice(1)}Title`)}</Typography>
                <Typography color="text.secondary">{t(`benefit${benefit[0].toUpperCase()}${benefit.slice(1)}Description`)}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-section landing-templates" id="landingTemplates">
        <Container maxWidth="lg">
          <Box className="landing-heading">
            <Typography className="section-eyebrow">{t("landingTemplatesEyebrow")}</Typography>
            <Typography variant="h3" component="h2">{t("landingTemplatesTitle")}</Typography>
            <Typography color="text.secondary">{t("landingTemplatesDescription")}</Typography>
          </Box>
          <Box className="landing-template-grid">
            {templateOptions.map((template) => (
              <button
                type="button"
                className={`landing-template-card${data.template === template ? " selected" : ""}`}
                key={template}
                aria-pressed={data.template === template}
                onClick={() => {
                  setValue("template", template, { shouldDirty: true });
                  document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className={`template-thumbnail template-thumbnail-${template}`} aria-hidden="true"><i /><b /><em /></span>
                <span><strong>{t(`template${template[0].toUpperCase()}${template.slice(1)}`)}</strong><small>{t("useTemplate")}</small></span>
              </button>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-section privacy-section">
        <Container maxWidth="lg" className="privacy-layout">
          <Box className="privacy-icon"><LockOutlined /></Box>
          <Box>
            <Typography className="section-eyebrow">{t("privacyEyebrow")}</Typography>
            <Typography variant="h3" component="h2">{t("privacyTitle")}</Typography>
            <Typography color="text.secondary" mt={1}>{t("privacyDescription")}</Typography>
          </Box>
          <Box className="privacy-points">
            {[t("privacyPointOne"), t("privacyPointTwo"), t("privacyPointThree")].map((item) => <span key={item}><CheckCircleRounded />{item}</span>)}
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-section faq-section">
        <Container maxWidth="md">
          <Box className="landing-heading">
            <Typography className="section-eyebrow">FAQ</Typography>
            <Typography variant="h3" component="h2">{t("faqTitle")}</Typography>
          </Box>
          {faqItems.map(({ question, answer }) => (
            <Accordion key={question} disableGutters elevation={0} className="faq-item">
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{question}</Typography>
              </AccordionSummary>
              <AccordionDetails><Typography color="text.secondary">{answer}</Typography></AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      <Box component="section" className="landing-cta">
        <Container maxWidth="md">
          <Typography variant="h3" component="h2">{t("finalCtaTitle")}</Typography>
          <Typography>{t("finalCtaDescription")}</Typography>
          <Button variant="contained" size="large" component="a" href="#generator" onClick={activateEditor}>{t("heroPrimaryCta")}</Button>
        </Container>
      </Box>

      <Box component="footer" className="site-footer">
        <Container maxWidth="lg" className="footer-layout">
          <BrandLogo />
          <Typography variant="body2" color="text.secondary">{t("footerDescription")}</Typography>
          <Box className="footer-links">
            <a href="#generator" onClick={activateEditor}>{t("generatorNav")}</a>
            <a href={templatesPath}>{t("templatesNav")}</a>
            <a href={locale === "en" ? "/en/guides" : "/es/guias"}>{t("guidesNav")}</a>
            <a href={toolsPath}>{t("toolsNav")}</a>
            <a href="/mis-cvs">{t("myCvs")}</a>
            <a href={locale === "en" ? "/en/about" : "/es/acerca-de"}>{t("aboutLink")}</a>
            <a href={locale === "en" ? "/en/privacy" : "/es/privacidad"}>{t("privacyLink")}</a>
            <a href={locale === "en" ? "/en/terms" : "/es/terminos"}>{t("termsLink")}</a>
            <a href="https://github.com/ruben137/cv-generator" target="_blank" rel="noopener noreferrer">GitHub</a>
          </Box>
          <Typography variant="caption" color="text.secondary">{t("footerLicense")}</Typography>
        </Container>
      </Box>
      <Dialog open={jobMatchDialogOpen} onClose={() => setJobMatchDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("jobMatchAreaTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("jobMatchAreaHelp")}</DialogContentText>
          <TextField
            select
            autoFocus
            fullWidth
            label={t("jobMatchAreaLabel")}
            value={selectedJobFamily}
            onChange={(event) => setSelectedJobFamily(event.target.value as JobFamily)}
          >
            {jobFamilies.map((family) => <MenuItem key={family} value={family}>{jobMatchT(`families.${family}`)}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobMatchDialogOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" onClick={analyzeCurrentCv} disabled={!selectedJobFamily} startIcon={<ManageSearchRounded />}>
            {t("continueToJobMatch")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={translationPromptOpen} onClose={() => setTranslationPromptOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{t("translationPromptDialogTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("translationPromptDialogHelp")}</DialogContentText>
          <TextField
            label={t("translationTargetLanguage")}
            placeholder={t("translationTargetPlaceholder")}
            value={translationTarget}
            onChange={(event) => setTranslationTarget(event.target.value)}
            inputProps={{ maxLength: 60 }}
            sx={{ mb: 2 }}
          />
          <TextField
            multiline
            minRows={10}
            maxRows={18}
            label={t("generatedPrompt")}
            value={translationPrompt}
            placeholder={t("translationPromptPlaceholder")}
            InputProps={{ readOnly: true }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>{t("translationPromptPrivacy")}</Alert>
          <PromptJsonDropzone />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTranslationPromptOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            startIcon={<ContentCopyRounded />}
            disabled={!translationPrompt}
            onClick={() => void copyTranslationPrompt()}
          >
            {t("copyTranslationPrompt")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={saveDialogOpen} onClose={() => !savingCv && setSaveDialogOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={(event) => { event.preventDefault(); void saveToLibrary(); }}>
          <DialogTitle>{activeCvId ? t("nameAndUpdateCv") : t("nameAndSaveCv")}</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>{t("cvNameHelp")}</DialogContentText>
            <TextField
              autoFocus
              label={t("cvName")}
              value={cvTitle}
              onChange={(event) => setCvTitle(event.target.value)}
              inputProps={{ maxLength: 80 }}
              helperText={<Counter value={cvTitle} max={80} />}
              placeholder={t("cvNamePlaceholder")}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSaveDialogOpen(false)} disabled={savingCv}>{t("cancel")}</Button>
            <Button type="submit" variant="contained" startIcon={<SaveRounded />} disabled={savingCv}>
              {savingCv ? t("savingCv") : activeCvId ? t("updateCv") : t("saveCv")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("confirmRestoreTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("confirmRestoreHelp")}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRestoreDialogOpen(false)}>{t("cancel")}</Button>
          <Button
            color="warning"
            variant="contained"
            startIcon={<RestartAltRounded />}
            onClick={() => {
              reset(initialCv);
              setRestoreDialogOpen(false);
              setNotice(t("exampleRestored"));
              setNoticeSuccess(true);
            }}
          >
            {t("restoreExample")}
          </Button>
        </DialogActions>
      </Dialog>
      {pendingImprovementCount > 0 && showFloatingImprovements && !improvementsOpen && (
        <Button
          type="button"
          className="floating-improvements-button"
          variant="contained"
          startIcon={<TipsAndUpdatesOutlined />}
          onClick={() => setImprovementsOpen(true)}
        >
          {t("pendingImprovements", { count: pendingImprovementCount })}
        </Button>
      )}
      <Drawer
        className="improvement-drawer"
        anchor="right"
        open={improvementsOpen}
        onClose={() => setImprovementsOpen(false)}
        ModalProps={{ disableRestoreFocus: true }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 430 }, maxWidth: "100%", p: 3 } }}
      >
        <Stack spacing={0.75} sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={800}>{t("improvementsTitle")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("improvementsHelp")}</Typography>
        </Stack>
        {improvementUndo && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            action={<Button color="inherit" size="small" onClick={undoImprovement}>{t("undoImprovement")}</Button>}
            onClose={() => setImprovementUndo(null)}
          >
            {t(improvementUndo.message)}
          </Alert>
        )}
        <Stack spacing={2}>
          {improvementPlans.map((plan) => (
            <Box key={plan.id} className={`improvement-plan improvement-plan-${plan.source}`}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                <Chip size="small" color={plan.source === "job-match" ? "warning" : "info"} label={t(plan.source === "job-match" ? "improvementSourceJob" : "improvementSourceQuality")} />
                <Typography variant="caption" color="text.secondary">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(plan.createdAt))}</Typography>
              </Stack>
              <Stack component="ul" spacing={1.25} className="improvement-suggestion-list">
                {plan.suggestions.map((suggestion) => (
                  <Box component="li" key={suggestion.id} className="improvement-suggestion">
                    <Typography variant="body2" fontWeight={750}>{suggestion.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{suggestion.detail}</Typography>
                    {suggestion.terms?.length ? (
                      <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
                        {suggestion.terms.map((term) => {
                          const alreadyAdded = data.skills.some((skill) => skill.name.trim().toLocaleLowerCase() === term.trim().toLocaleLowerCase());
                          return suggestion.kind === "add-skill" ? (
                            <Button
                              key={term}
                              type="button"
                              size="small"
                              variant="outlined"
                              startIcon={<AddRounded />}
                              disabled={alreadyAdded || data.skills.length >= 12}
                              onClick={() => addSuggestedSkill(plan.id, suggestion.id, term)}
                            >
                              {alreadyAdded ? t("skillAlreadyAdded", { skill: term }) : t("addSuggestedSkill", { skill: term })}
                            </Button>
                          ) : <Chip key={term} size="small" variant="outlined" label={term} />;
                        })}
                      </Stack>
                    ) : null}
                    {suggestion.kind === "review-section" && (
                      <Stack className="improvement-suggestion-actions" direction="row" useFlexGap flexWrap="wrap" sx={{ mt: 0.65 }}>
                        {suggestion.section !== "general" && (
                          <Button className="improvement-section-button" type="button" size="small" variant="text" onClick={() => focusImprovementSection(suggestion.section)}>
                            {t("openRecommendedSection")}
                          </Button>
                        )}
                        <Button className="improvement-reviewed-button" type="button" size="small" color="inherit" onClick={() => removeImprovementSuggestion(plan.id, suggestion.id, "improvementReviewed")}>
                          {t("markImprovementReviewed")}
                        </Button>
                      </Stack>
                    )}
                    {suggestion.kind === "add-skill" && (
                      <Button type="button" size="small" color="inherit" sx={{ mt: 0.65 }} onClick={() => removeImprovementSuggestion(plan.id, suggestion.id, "improvementDismissed")}>
                        {t("dismissSuggestion")}
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
              <Button
                type="button"
                size="small"
                color="inherit"
                sx={{ mt: 1.5 }}
                onClick={() => dismissImprovementPlan(plan.id)}
              >
                {t("dismissImprovementPlan")}
              </Button>
            </Box>
          ))}
        </Stack>
      </Drawer>
      <Dialog open={Boolean(pendingPhoto)} onClose={() => setPendingPhoto(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t("cropPhotoTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("cropPhotoHelp")}</DialogContentText>
          <Box
            className="photo-crop-stage"
            sx={{
              position: "relative",
              width: "min(320px, 100%)",
              aspectRatio: "1",
              mx: "auto",
              overflow: "hidden",
              bgcolor: "#dfe5ea",
              borderRadius: 3,
            }}
          >
            {pendingPhoto && (
              <Cropper
                image={pendingPhoto}
                crop={cropPosition}
                zoom={cropZoom}
                aspect={1}
                cropShape={data.photoShape === "round" ? "round" : "rect"}
                objectFit="cover"
                showGrid
                onCropChange={setCropPosition}
                onZoomChange={setCropZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                mediaProps={{
                  "aria-label": t("cropPhotoPreview"),
                  onError: () => {
                  setPendingPhoto(null);
                  setNotice(t("imageError"));
                  setNoticeSuccess(false);
                  },
                }}
              />
            )}
          </Box>
          <Box className="photo-crop-zoom">
            <Typography variant="body2" fontWeight={700}>{t("zoom")}</Typography>
            <Slider
              value={cropZoom}
              min={1}
              max={3}
              step={0.01}
              aria-label={t("zoom")}
              onChange={(_, value) => setCropZoom(value as number)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingPhoto(null)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            startIcon={<CropRounded />}
            onClick={() => void applyPhotoCrop()}
            disabled={!croppedAreaPixels}
          >
            {t("applyCrop")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
