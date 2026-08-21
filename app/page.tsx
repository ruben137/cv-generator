"use client";

import {
  AddRounded,
  CheckCircleRounded,
  CloudOffRounded,
  ColorLensRounded,
  CropRounded,
  DeleteOutlineRounded,
  DragIndicatorRounded,
  ExpandMoreRounded,
  FolderOpenRounded,
  InsertDriveFileRounded,
  LanguageRounded,
  LockOutlined,
  OpenInNewRounded,
  PictureAsPdfRounded,
  RestartAltRounded,
  SaveRounded,
  UploadRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
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
  FormControlLabel,
  IconButton,
  MenuItem,
  Slider,
  Stack,
  Switch,
  TextField,
  ThemeProvider,
  Toolbar,
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
  sidebarLabelIds,
  type MainSectionId,
} from "./types";
import { createStoredCv, getStoredCv, putStoredCv } from "./cv-library";
import { BrandLogo } from "./brand-logo";
import { getProfessionalPreset, isProfessionalPresetId } from "./professional-presets";

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
const AUTOSAVE_KEY = "cv-simple-autosave";

const fontOptions = [
  { value: "sans", labelKey: "fontSans", css: "Arial, Helvetica, sans-serif" },
  { value: "humanist", labelKey: "fontHumanist", css: "Calibri, Candara, Arial, sans-serif" },
  { value: "serif", labelKey: "fontSerif", css: "Georgia, 'Times New Roman', serif" },
] as const;

const templateOptions = ["classic", "modern", "minimal", "right", "compact", "contrast", "editorial"] as const;

function Counter({ value, max }: { value?: string; max: number }) {
  const length = value?.length ?? 0;
  return (
    <Typography component="span" variant="caption" color={length >= max ? "error" : "text.secondary"}>
      {length}/{max}
    </Typography>
  );
}

function SortableSectionItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <Box
      ref={setNodeRef}
      className={`sortable-section${isDragging ? " dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        position: "relative",
        zIndex: isDragging ? 2 : 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        minHeight: 48,
        px: 1.25,
        py: 0.5,
        border: "1px solid",
        borderColor: isDragging ? "primary.main" : "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: isDragging ? "0 8px 22px rgba(23, 42, 59, 0.16)" : "0 1px 2px rgba(23, 42, 59, 0.04)",
        opacity: isDragging ? 0.92 : 1,
      }}
    >
      <IconButton
        {...attributes}
        {...listeners}
        aria-label={label}
        size="small"
        className="drag-handle"
        sx={{ flex: "0 0 auto", cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "text.secondary" }}
      >
        <DragIndicatorRounded />
      </IconButton>
      <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{label}</Typography>
    </Box>
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
  const locale = useLocale();
  const templatesPath = locale === "en" ? "/en/templates" : "/es/plantillas";
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
  const skills = useFieldArray({ control, name: "skills" });
  const languages = useFieldArray({ control, name: "languages" });
  const experiences = useFieldArray({ control, name: "experiences" });
  const education = useFieldArray({ control, name: "education" });
  const certifications = useFieldArray({ control, name: "certifications" });
  const customSections = useFieldArray({ control, name: "customSections" });
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeSuccess, setNoticeSuccess] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const [activeCvId, setActiveCvId] = useState<string | null>(null);
  const [cvTitle, setCvTitle] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
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

  useEffect(() => {
    const storedAutoSave = window.localStorage.getItem(AUTOSAVE_KEY);
    const enabled = storedAutoSave === null || storedAutoSave === "true";
    if (storedAutoSave === null) window.localStorage.setItem(AUTOSAVE_KEY, "true");
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
      if (!loaded && enabled && !forceNew) {
        try {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) reset(normalizeCvData(JSON.parse(saved), locale as "es" | "en"));
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setAutoSave(enabled);
      setStorageReady(true);
    })();
  }, [initialCv, locale, reset, t]);

  useEffect(() => {
    if (!storageReady || !autoSave) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        window.localStorage.setItem(AUTOSAVE_KEY, "false");
        setAutoSave(false);
        setNotice(t("autoSaveError"));
        setNoticeSuccess(false);
      }
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [autoSave, data, storageReady, t]);

  useEffect(() => {
    if (!storageReady || !autoSave || !activeCvId) return;
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
  }, [activeCvId, autoSave, data, storageReady]);

  const changeAutoSave = (enabled: boolean) => {
    setAutoSave(enabled);
    window.localStorage.setItem(AUTOSAVE_KEY, String(enabled));
    if (enabled) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setNotice(t("autoSaveEnabled"));
        setNoticeSuccess(true);
      } catch {
        setAutoSave(false);
        window.localStorage.setItem(AUTOSAVE_KEY, "false");
        setNotice(t("autoSaveError"));
        setNoticeSuccess(false);
      }
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      setNotice(t("autoSaveDisabled"));
      setNoticeSuccess(true);
    }
  };

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

  const sectionHasContent = (section: string) => {
    if (section === "summary") return Boolean(data.summary.trim());
    if (section === "experience") return data.experiences.some((item) => item.company.trim() || item.role.trim());
    if (section === "education") return data.education.some((item) => item.institution.trim() || item.degree.trim());
    if (section === "certifications") return data.certifications.some((item) => item.name.trim() || item.issuer.trim());
    if (section === "skills") return data.skills.some((item) => item.name.trim());
    const custom = data.customSections.find((item) => item.id === section);
    return Boolean(custom && (custom.type === "text" ? custom.text.trim() : custom.items.some((item) => item.text.trim())));
  };
  const fullContentOrder = normalizeContentOrder(data.contentOrder, data.sectionOrder, data.customSections);
  const visibleSectionOrder = fullContentOrder.filter(sectionHasContent);
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
        const availableHeight = Math.max(paper.clientHeight, 1);
        const overflowRatio = Math.max(1, ...columns.map((column) => column.scrollHeight / availableHeight));
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
  }, [previewData]);
  const contrastHeadingStyle: CSSProperties | undefined = previewData.template === "contrast"
    ? {
        marginTop: "calc(12px * var(--scale))",
        marginBottom: "calc(6px * var(--scale))",
        padding: "0 0 calc(4px * var(--scale))",
        borderBottom: `1px solid ${previewData.primaryColor}`,
        background: "transparent",
        letterSpacing: "normal",
        textTransform: "none",
      }
    : undefined;

  const renderMainSection = (section: string) => {
    if (!mainSectionIds.includes(section as MainSectionId)) {
      const custom = previewData.customSections.find((item) => item.id === section);
      if (!custom) return null;
      if (custom.type === "text") {
        return custom.text.trim() ? <section key={section}><h3 style={contrastHeadingStyle}>{custom.title || t("untitledSection")}</h3><p>{custom.text}</p></section> : null;
      }
      const items = custom.items.filter((item) => item.text.trim());
      return items.length ? <section key={section}><h3 style={contrastHeadingStyle}>{custom.title || t("untitledSection")}</h3><ul className="cv-skills">{items.map((item) => <li key={item.id}>{item.text}</li>)}</ul></section> : null;
    }
    if (section === "summary") {
      return previewData.summary ? <section key={section}><h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3><p>{previewData.summary}</p></section> : null;
    }
    if (section === "experience") {
      const items = previewData.experiences.filter((item) => item.company || item.role);
      return items.length ? <section key={section}><h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>{items.map((item, index) => <div className="cv-experience" key={`${item.company}-${index}`}><h4>{item.company}{item.company && item.role ? " — " : ""}<i>{item.role}</i></h4><p className="cv-meta">{[item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</p><ul>{item.bullets.filter(Boolean).map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul></div>)}</section> : null;
    }
    if (section === "education") {
      const items = previewData.education.filter((item) => item.institution || item.degree);
      return items.length ? <section key={section}><h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>{items.map((item, index) => <div className="cv-experience" key={`${item.institution}-${index}`}><h4>{item.institution}{item.institution && item.degree ? " — " : ""}<i>{item.degree}</i></h4><p className="cv-meta">{[item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</p></div>)}</section> : null;
    }
    if (section === "certifications") {
      const items = previewData.certifications.filter((item) => item.name || item.issuer);
      return items.length ? <section key={section}><h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3>{items.map((item, index) => <div className="cv-experience" key={`${item.name}-${index}`}><h4>{item.name}</h4><p className="cv-meta">{[item.issuer, item.date].filter(Boolean).join(" · ")}</p></div>)}</section> : null;
    }
    return skillItems.length ? <section key={section}><h3 style={contrastHeadingStyle}>{previewSectionLabel(section)}</h3><ul className="cv-skills">{skillItems.map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}</ul></section> : null;
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
      <AppBar position="sticky" color="inherit" elevation={0} className="topbar">
        <Toolbar className="topbar-inner" sx={{ minHeight: 76, gap: { xs: 1, md: 2 }, py: { xs: 1, md: 0 }, flexWrap: { xs: "wrap", md: "nowrap" } }}>
          <BrandLogo />
          <Box component="nav" className="main-nav" aria-label={t("mainNavigation")}>
            <Button component="a" href="#generator" className="main-nav-link active">{t("generatorNav")}</Button>
            <Button component="a" href="#landingTemplates" className="main-nav-link">{t("templatesNav")}</Button>
            <Button component="a" href={templatesPath} className="main-nav-link">{t("professionalExamplesNav")}</Button>
            <Button component="a" href="/mis-cvs" className="main-nav-link">{t("myCvs")}</Button>
          </Box>
          <Box className="topbar-actions">
            <Button
              component="a"
              href="/mis-cvs"
              variant="outlined"
              startIcon={<FolderOpenRounded />}
              sx={{ whiteSpace: "nowrap", display: { md: "none" } }}
            >
              {t("myCvs")}
            </Button>
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
          <Chip className="privacy-chip" icon={<CloudOffRounded />} label={t("noStorage")} variant="outlined" />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, md: 3 } }}>
        <Box className="intro">
          <Box className="hero-copy">
            <Chip className="hero-eyebrow" size="small" label={t("heroEyebrow")} />
            <Typography variant="h3" component="h1">{t("heroTitle")}</Typography>
            <Typography className="hero-description" color="text.secondary">
              {t("heroDescription")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} mt={2.5}>
              <Button variant="contained" size="large" component="a" href="#generator">
                {t("heroPrimaryCta")}
              </Button>
              <Button variant="outlined" size="large" component="a" href={templatesPath}>
                {t("heroSecondaryCta")}
              </Button>
            </Stack>
            <Box className="hero-trust-list">
              {[t("heroTrustFree"), t("heroTrustNoAccount"), t("heroTrustLocal")].map((item) => (
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

        <Stack className="editor-toolbar" direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
          <Typography fontWeight={800}>{t("editorHeading")}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
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

        <Box className="autosave-panel">
          <Box>
            <Typography fontWeight={750}>{t("autoSave")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {autoSave ? t("autoSaveOnHelp") : t("autoSaveOffHelp")}
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={autoSave} onChange={(event) => changeAutoSave(event.target.checked)} />}
            label={autoSave ? t("enabled") : t("disabled")}
            labelPlacement="start"
            sx={{ m: 0, flexShrink: 0 }}
          />
        </Box>

        <Box className="workspace" id="generator">
          <Box className="editor-column">
            <Accordion defaultExpanded sx={sectionSx}>
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
                    <Button component="label" variant="outlined" startIcon={<UploadRounded />}>
                      {t("choose")}
                      <input
                        hidden
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(event) => {
                          onPhoto(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </Button>
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

            <Accordion sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("sectionCustomization")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" mb={2}>{t("sectionCustomizationHelp")}</Typography>
                <Typography fontWeight={700} mb={1}>{t("editSectionTitles")}</Typography>
                <Box className="form-grid">
                  {mainSectionIds.map((section) => (
                    <TextField
                      key={section}
                      label={sectionLabel(section)}
                      placeholder={documentLabels[section]}
                      inputProps={{ maxLength: 50 }}
                      helperText={<Counter value={data.sectionTitles[section]} max={50} />}
                      {...register(`sectionTitles.${section}`)}
                    />
                  ))}
                </Box>

                <Typography fontWeight={700} mt={2} mb={1}>{t("editSidebarLabels")}</Typography>
                <Box className="form-grid">
                  {sidebarLabelIds.map((label) => {
                    const fallback = documentLabels[label];
                    return (
                      <TextField
                        key={label}
                        label={fallback}
                        placeholder={fallback}
                        inputProps={{ maxLength: 50 }}
                        helperText={<Counter value={data.sectionTitles[label]} max={50} />}
                        {...register(`sectionTitles.${label}`)}
                      />
                    );
                  })}
                </Box>

                <Divider sx={{ my: 2 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Box>
                    <Typography fontWeight={700}>{t("customSections")}</Typography>
                    <Typography variant="caption" color="text.secondary">{t("customSectionsLimit", { count: customSections.fields.length })}</Typography>
                  </Box>
                  <Button startIcon={<AddRounded />} disabled={customSections.fields.length >= 3} onClick={addCustomSection}>
                    {t("addCustomSection")}
                  </Button>
                </Stack>

                <Stack spacing={2}>
                  {customSections.fields.map((field, index) => {
                    const section = data.customSections[index];
                    if (!section) return null;
                    return (
                      <Box className="experience-form" key={field.id}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <Typography fontWeight={750}>{section.title.trim() || t("customSectionNumber", { number: index + 1 })}</Typography>
                          <IconButton aria-label={t("removeCustomSection", { number: index + 1 })} onClick={() => removeCustomSection(index)}>
                            <DeleteOutlineRounded />
                          </IconButton>
                        </Stack>
                        <Stack spacing={1.5}>
                          <TextField
                            label={t("sectionTitle")}
                            inputProps={{ maxLength: 50 }}
                            helperText={<Counter value={section.title} max={50} />}
                            {...register(`customSections.${index}.title`)}
                          />
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
                              <Typography component="label" variant="caption" color="text.secondary">
                                {t("sectionContent")}
                              </Typography>
                              <Box
                                component="textarea"
                                aria-label={t("sectionContent")}
                                rows={3}
                                maxLength={500}
                                {...register(`customSections.${index}.text`)}
                                sx={{
                                  display: "block", width: "100%", mt: 0.5, p: 1.5,
                                  resize: "vertical", font: "inherit", color: "text.primary",
                                  bgcolor: "background.paper", border: "1px solid", borderColor: "divider",
                                  borderRadius: 1, outline: 0, "&:focus": { borderColor: "primary.main", boxShadow: "0 0 0 1px", color: "primary.main" },
                                }}
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
                                  if (oldIndex >= 0 && newIndex >= 0) {
                                    setValue(`customSections.${index}.items`, arrayMove(section.items, oldIndex, newIndex), { shouldDirty: true });
                                  }
                                }}
                              >
                                <SortableContext items={section.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                                  <Stack spacing={1}>
                                    {section.items.map((item, itemIndex) => (
                                      <SortableFormItem key={item.id} id={item.id} label={t("reorderItem", { item: t("listItemNumber", { number: itemIndex + 1 }) })}>
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                          <TextField
                                            label={t("listItemNumber", { number: itemIndex + 1 })}
                                            inputProps={{ maxLength: 120 }}
                                            helperText={<Counter value={item.text} max={120} />}
                                            {...register(`customSections.${index}.items.${itemIndex}.text`)}
                                          />
                                          <IconButton
                                            aria-label={t("removeListItem", { number: itemIndex + 1 })}
                                            onClick={() => setValue(`customSections.${index}.items`, section.items.filter((_, currentIndex) => currentIndex !== itemIndex), { shouldDirty: true })}
                                          >
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
                                disabled={section.items.length >= 8}
                                onClick={() => setValue(`customSections.${index}.items`, [...section.items, { id: crypto.randomUUID(), text: "" }], { shouldDirty: true })}
                                sx={{ alignSelf: "flex-start" }}
                              >
                                {t("addListItem")}
                              </Button>
                            </>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("sectionOrder")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {t("sectionOrderHelp")}
                </Typography>
                <DndContext id="section-order" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext items={visibleSectionOrder} strategy={verticalListSortingStrategy}>
                    <Stack spacing={1}>
                      {visibleSectionOrder.map((section) => (
                        <SortableSectionItem key={section} id={section} label={sectionLabel(section)} />
                      ))}
                      {!visibleSectionOrder.length && (
                        <Typography variant="body2" color="text.secondary">{t("noSectionsToOrder")}</Typography>
                      )}
                    </Stack>
                  </SortableContext>
                </DndContext>
              </AccordionDetails>
            </Accordion>

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

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("contact")} <Typography component="span" variant="caption" color="text.secondary">({t("allOptional")})</Typography></Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box className="form-grid">
                  <TextField label={t("phone")} inputProps={{ maxLength: 25 }} {...register("phone")} />
                  <TextField label={t("email")} type="email" inputProps={{ maxLength: 100 }} {...register("email")} />
                  <TextField label={t("portfolio")} inputProps={{ maxLength: 150 }} {...register("portfolio")} />
                  <TextField label={t("location")} inputProps={{ maxLength: 80 }} {...register("location")} />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("cvSummary")}</Typography>
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

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("skills")} ({skills.fields.length}/12)</Typography>
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
                                  inputProps={{ maxLength: 80 }}
                                  helperText={<Counter value={data.skills[index]?.name} max={80} />}
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

            <Accordion sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("languages")} ({languages.fields.length}/5)</Typography>
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

            <Accordion defaultExpanded sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("experience")} ({experiences.fields.length}/4)</Typography>
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

            <Accordion sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("education")} ({education.fields.length}/3)</Typography>
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

            <Accordion sx={sectionSx}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography fontWeight={750}>{t("certifications")} ({certifications.fields.length}/4)</Typography>
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

            <Alert icon={<LockOutlined />} severity="info" sx={{ mt: 2 }}>{t("localPrivacyReminder")}</Alert>
          </Box>

          <Box className="preview-column">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box>
                <Typography variant="h6">{t("preview")}</Typography>
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
                  className={`cv-sidebar cv-sidebar-${previewData.template}`}
                  style={["contrast", "editorial"].includes(previewData.template) ? { backgroundColor: previewData.primaryColor, color: "#fff" } : undefined}
                >
                  <div className="top-accent" />
                  <h2>{previewData.name || "Tu nombre"}</h2>
                  {previewData.headline && <p className="cv-headline">{previewData.headline}</p>}
                  {previewData.photo && <img className={`cv-photo photo-${previewData.photoShape}`} src={previewData.photo} alt="" />}
                  {hasContact && (
                    <section>
                      <h3>{previewData.sectionTitles.contact?.trim() || previewDocumentLabels.contact}</h3>
                      {previewData.location && <p><b>{previewData.sectionTitles.location?.trim() || previewDocumentLabels.location}:</b><br />{previewData.location}</p>}
                      {previewData.phone && <p><b>{previewData.sectionTitles.phone?.trim() || previewDocumentLabels.phone}:</b><br />{previewData.phone}</p>}
                      {previewData.email && <p><b>{previewData.sectionTitles.email?.trim() || previewDocumentLabels.email}:</b><br />{previewData.email}</p>}
                      {previewData.portfolio && <p><b>{previewData.sectionTitles.portfolio?.trim() || previewDocumentLabels.portfolio}:</b><br />{previewData.portfolio}</p>}
                    </section>
                  )}
                  {previewData.languages.some((language) => language.name) && (
                    <section>
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
          <Button variant="contained" size="large" component="a" href="#generator">{t("heroPrimaryCta")}</Button>
        </Container>
      </Box>

      <Box component="footer" className="site-footer">
        <Container maxWidth="lg" className="footer-layout">
          <BrandLogo />
          <Typography variant="body2" color="text.secondary">{t("footerDescription")}</Typography>
          <Box className="footer-links">
            <a href="#generator">{t("generatorNav")}</a>
            <a href={templatesPath}>{t("templatesNav")}</a>
            <a href="/mis-cvs">{t("myCvs")}</a>
            <a href={locale === "en" ? "/en/about" : "/es/acerca-de"}>{t("aboutLink")}</a>
            <a href={locale === "en" ? "/en/privacy" : "/es/privacidad"}>{t("privacyLink")}</a>
            <a href={locale === "en" ? "/en/terms" : "/es/terminos"}>{t("termsLink")}</a>
            <a href="https://github.com/ruben137/cv-generator" target="_blank" rel="noopener noreferrer">GitHub</a>
          </Box>
          <Typography variant="caption" color="text.secondary">{t("footerLicense")}</Typography>
        </Container>
      </Box>
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
