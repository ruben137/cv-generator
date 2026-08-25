"use client";

import {
  CloseRounded,
  FolderOpenRounded,
  LanguageRounded,
  MenuRounded,
  SaveRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Drawer,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import type { ReactNode } from "react";
import { BrandLogo } from "./brand-logo";

type MobileNavigationMenuProps = {
  locale: string;
  active?: "generator" | "templates" | "tools" | "cvs" | "applications";
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  onLocaleChange?: (locale: "es" | "en") => void;
};

const copy = {
  es: {
    menu: "Abrir menú",
    close: "Cerrar menú",
    navigation: "Navegación principal",
    generator: "Generador",
    templates: "Plantillas",
    tools: "Herramientas",
    cvs: "Mis CVs",
    applications: "Mis postulaciones",
    language: "Idioma",
  },
  en: {
    menu: "Open menu",
    close: "Close menu",
    navigation: "Main navigation",
    generator: "Generator",
    templates: "Templates",
    tools: "Tools",
    cvs: "My CVs",
    applications: "My applications",
    language: "Language",
  },
} as const;

export function MobileNavigationMenu({
  locale,
  active,
  onSave,
  saveLabel,
  saveDisabled = false,
  onLocaleChange,
}: MobileNavigationMenuProps) {
  const [open, setOpen] = useState(false);
  const resolvedLocale = locale === "en" ? "en" : "es";
  const labels = copy[resolvedLocale];
  const links: Array<{ id: NonNullable<MobileNavigationMenuProps["active"]>; label: string; href: string; icon?: ReactNode }> = [
    { id: "generator", label: labels.generator, href: `/${resolvedLocale}?openEditor=1#generator` },
    { id: "templates", label: labels.templates, href: resolvedLocale === "en" ? "/en/templates" : "/es/plantillas" },
    { id: "tools", label: labels.tools, href: `/${resolvedLocale}/tools` },
    { id: "cvs", label: labels.cvs, href: "/mis-cvs", icon: <FolderOpenRounded fontSize="small" /> },
    { id: "applications", label: labels.applications, href: resolvedLocale === "en" ? "/en/applications" : "/es/mis-postulaciones", icon: <WorkOutlineRounded fontSize="small" /> },
  ];

  const close = () => setOpen(false);

  return (
    <>
      <IconButton
        className="mobile-navigation-trigger"
        aria-label={labels.menu}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuRounded />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        className="mobile-navigation-drawer"
        PaperProps={{ role: "dialog", "aria-label": labels.navigation }}
      >
        <Box className="mobile-navigation-panel">
          <Box className="mobile-navigation-heading">
            <BrandLogo compact />
            <IconButton aria-label={labels.close} onClick={close}>
              <CloseRounded />
            </IconButton>
          </Box>
          <Box component="nav" aria-label={labels.navigation} className="mobile-navigation-links">
            {links.map((link) => (
              <Button
                key={link.id}
                component="a"
                href={link.href}
                startIcon={link.icon}
                className={active === link.id ? "active" : ""}
                onClick={close}
              >
                {link.label}
              </Button>
            ))}
          </Box>
          {(onSave || onLocaleChange) ? (
            <Box className="mobile-navigation-actions">
              <Divider />
              {onSave ? (
                <Button
                  variant="contained"
                  startIcon={<SaveRounded />}
                  disabled={saveDisabled}
                  onClick={() => {
                    close();
                    onSave();
                  }}
                >
                  {saveLabel}
                </Button>
              ) : null}
              {onLocaleChange ? (
                <Box className="mobile-language-control">
                  <span><LanguageRounded fontSize="small" />{labels.language}</span>
                  <ButtonGroup size="small" aria-label={labels.language}>
                    <Button variant={resolvedLocale === "es" ? "contained" : "outlined"} onClick={() => onLocaleChange("es")}>ES</Button>
                    <Button variant={resolvedLocale === "en" ? "contained" : "outlined"} onClick={() => onLocaleChange("en")}>EN</Button>
                  </ButtonGroup>
                </Box>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Drawer>
    </>
  );
}
