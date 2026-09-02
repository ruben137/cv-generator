import Link from "next/link";

type NavigationSection = "generator" | "templates" | "guides" | "tools" | "cvs";

type DesktopNavigationProps = {
  locale: string;
  active?: NavigationSection;
};

export function DesktopNavigation({ locale, active }: DesktopNavigationProps) {
  const resolvedLocale = locale === "en" ? "en" : "es";
  const labels = resolvedLocale === "en"
    ? { navigation: "Main navigation", templates: "Templates", guides: "Guides", tools: "Tools", cvs: "My resumes" }
    : { navigation: "Navegación principal", templates: "Plantillas", guides: "Guías", tools: "Herramientas", cvs: "Mis CVs" };
  const links: Array<{ id: NavigationSection; label: string; href: string }> = [
    { id: "templates", label: labels.templates, href: resolvedLocale === "en" ? "/en/templates" : "/es/plantillas" },
    { id: "tools", label: labels.tools, href: resolvedLocale === "en" ? "/en/tools" : "/es/herramientas" },
    { id: "guides", label: labels.guides, href: resolvedLocale === "en" ? "/en/guides" : "/es/guias" },
    { id: "cvs", label: labels.cvs, href: "/mis-cvs" },
  ];

  return (
    <nav className="main-nav" aria-label={labels.navigation}>
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={`main-nav-link${active === link.id ? " active" : ""}`}
          aria-current={active === link.id ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
