"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "./brand-logo";
import { DesktopNavigation } from "./desktop-navigation";
import { MobileNavigationMenu } from "./mobile-navigation-menu";

type SiteHeaderProps = {
  locale: string;
  active?: "generator" | "templates" | "tools" | "cvs" | "applications";
  actions?: ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  onLocaleChange?: (locale: "es" | "en") => void;
};

export function SiteHeader({ locale, active, actions, onSave, saveLabel, saveDisabled, onLocaleChange }: SiteHeaderProps) {
  const desktopActive = active === "applications" ? "tools" : active;
  return (
    <header className="topbar site-header">
      <div className="topbar-inner site-header-inner">
        <div className="site-header-brand-slot"><BrandLogo /></div>
        <DesktopNavigation locale={locale} active={desktopActive} />
        <div className="site-header-actions">{actions}</div>
        <MobileNavigationMenu
          locale={locale}
          active={active}
          onSave={onSave}
          saveLabel={saveLabel}
          saveDisabled={saveDisabled}
          onLocaleChange={onLocaleChange}
        />
      </div>
    </header>
  );
}
