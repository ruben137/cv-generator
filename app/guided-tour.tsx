"use client";

import { CloseRounded, HelpOutlineRounded } from "@mui/icons-material";
import { Button, IconButton, Tooltip } from "@mui/material";
import { EVENTS, Joyride, STATUS, type Step } from "react-joyride";
import { useCallback, useEffect, useMemo, useState } from "react";

export const START_GUIDED_TOUR_EVENT = "cv-simple:start-guided-tour";
const HIDDEN_TOUR_KEY = "cv-simple-guided-tour-hidden";

async function revealExportActions() {
  const preview = document.querySelector<HTMLElement>(".preview-column");
  if (preview) preview.style.position = "static";

  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

  document.querySelector('[data-tour="export"]')?.scrollIntoView({
    behavior: "auto",
    block: "center",
  });

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function restoreStickyPreview() {
  document.querySelector<HTMLElement>(".preview-column")?.style.removeProperty("position");
}

export function GuidedTour({ locale, onPrepare }: { locale: string; onPrepare?: () => void }) {
  const english = locale === "en";
  const [ready] = useState(() => typeof window !== "undefined");
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  const [hidden, setHidden] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(HIDDEN_TOUR_KEY) === "1",
  );
  const [run, setRun] = useState(false);
  const copy = english
    ? { trigger: "Guided tour", hide: "Don't show this help button again", back: "Back", close: "Close", last: "Finish", next: "Next", nextWithProgress: "Next ({current} of {total})", skip: "Skip tour" }
    : { trigger: "Tutorial guiado", hide: "No volver a mostrar este botón de ayuda", back: "Atrás", close: "Cerrar", last: "Finalizar", next: "Siguiente", nextWithProgress: "Siguiente ({current} de {total})", skip: "Omitir tutorial" };

  const steps = useMemo<Step[]>(() => english
    ? [
        mobile
          ? { target: ".mobile-navigation-trigger", title: "Everything within reach", content: "Open this menu to access templates, tools, guides, and your locally saved resumes.", placement: "bottom-end" }
          : { target: ".main-nav", title: "Everything within reach", content: "Use the navigation to open templates, tools, guides, and your locally saved resumes.", placement: "bottom" },
        { target: '[data-tour="hero"]', title: "Start with the generator", content: "Create a one-page resume for free, without an account and without sending your information to a server.", placement: "bottom" },
        { target: '[data-tour="professional-examples"]', title: "Professional examples", content: "Start from sample content for a profession and replace it with your real experience.", placement: "bottom" },
        { target: '[data-tour="editor-status"]', title: "Keep the page under control", content: "The editor shows how much of the page you are using while your changes are saved automatically in this browser.", placement: "bottom" },
        { target: '[data-tour="editor-section"] .MuiAccordionSummary-root', title: "Edit and reorder", content: "Complete each section, rename it, and drag sections or list items into the order you prefer.", placement: "right" },
        { target: '[data-tour="preview"]', title: "Real-time preview", content: "See how the document changes while you edit its content, template, typography, and colors.", placement: "left" },
        { target: '[data-tour="export"]', title: "Download your resume", content: "Download the finished document in PDF or DOCX. There are no download limits.", placement: "top", before: revealExportActions, skipScroll: true },
      ]
    : [
        mobile
          ? { target: ".mobile-navigation-trigger", title: "Todo a tu alcance", content: "Abre este menú para acceder a plantillas, herramientas, guías y los CV guardados localmente.", placement: "bottom-end" }
          : { target: ".main-nav", title: "Todo a tu alcance", content: "Usa la navegación para abrir plantillas, herramientas, guías y los CV guardados localmente.", placement: "bottom" },
        { target: '[data-tour="hero"]', title: "Empieza con el generador", content: "Crea gratuitamente un CV de una página, sin cuenta y sin enviar tu información a un servidor.", placement: "bottom" },
        { target: '[data-tour="professional-examples"]', title: "Ejemplos profesionales", content: "Puedes comenzar con contenido de ejemplo para una profesión y sustituirlo por tu experiencia real.", placement: "bottom" },
        { target: '[data-tour="editor-status"]', title: "Controla el espacio", content: "El editor indica cuánto espacio utilizas y guarda automáticamente los cambios en este navegador.", placement: "bottom" },
        { target: '[data-tour="editor-section"] .MuiAccordionSummary-root', title: "Edita y reordena", content: "Completa cada sección, cambia sus títulos y arrastra las secciones o elementos al orden que prefieras.", placement: "right" },
        { target: '[data-tour="preview"]', title: "Previsualización en tiempo real", content: "Observa el resultado mientras cambias el contenido, el template, la tipografía y los colores.", placement: "left" },
        { target: '[data-tour="export"]', title: "Descarga tu CV", content: "Descarga el documento terminado en PDF o DOCX. No hay límites de descarga.", placement: "top", before: revealExportActions, skipScroll: true },
      ], [english, mobile]);

  const startTour = useCallback(() => {
    restoreStickyPreview();
    setRun(false);
    onPrepare?.();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
        setRun(true);
      });
    });
  }, [onPrepare]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const updateViewport = () => setMobile(media.matches);
    media.addEventListener("change", updateViewport);
    window.addEventListener(START_GUIDED_TOUR_EVENT, startTour);
    return () => {
      media.removeEventListener("change", updateViewport);
      window.removeEventListener(START_GUIDED_TOUR_EVENT, startTour);
    };
  }, [startTour]);

  const hideTrigger = () => {
    restoreStickyPreview();
    window.localStorage.setItem(HIDDEN_TOUR_KEY, "1");
    setHidden(true);
    setRun(false);
  };

  return <>
    <Joyride
      run={run}
      steps={steps}
      continuous
      scrollToFirstStep
      locale={copy}
      options={{ buttons: ["back", "close", "primary", "skip"], closeButtonAction: "skip", dismissKeyAction: "close", overlayClickAction: false, primaryColor: "#173B63", scrollDuration: 220, scrollOffset: 120, showProgress: true, skipBeacon: true, spotlightPadding: 8, targetWaitTimeout: 3000, zIndex: 1700 }}
      styles={{ tooltip: { borderRadius: 16, boxShadow: "0 18px 55px rgba(14, 41, 72, .24)" }, tooltipTitle: { color: "#173B63" } }}
      onEvent={({ index, status, type }) => {
        if (type === EVENTS.STEP_BEFORE && index === steps.length - 1) {
          void revealExportActions();
        } else if (type === EVENTS.STEP_BEFORE) {
          restoreStickyPreview();
        }
        if (type === EVENTS.TOUR_END || status === STATUS.SKIPPED) {
          restoreStickyPreview();
          setRun(false);
        }
      }}
    />
    {ready && !hidden && !run ? <div className="guided-tour-trigger">
      <Button type="button" variant="contained" startIcon={<HelpOutlineRounded />} onClick={startTour}>{copy.trigger}</Button>
      <Tooltip title={copy.hide} placement="left">
        <IconButton type="button" aria-label={copy.hide} onClick={hideTrigger}><CloseRounded fontSize="small" /></IconButton>
      </Tooltip>
    </div> : null}
  </>;
}
