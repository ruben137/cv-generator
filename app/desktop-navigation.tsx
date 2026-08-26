import Link from "next/link";

type NavigationSection = "generator" | "templates" | "tools" | "cvs";

type DesktopNavigationProps = {
  locale: string;
  active?: NavigationSection;
};

export function DesktopNavigation({ locale, active }: DesktopNavigationProps) {
  const resolvedLocale = locale === "en" ? "en" : "es";
  const labels = resolvedLocale === "en"
    ? { navigation: "Main navigation", generator: "Generator", templates: "Templates", tools: "Tools", cvs: "My resumes" }
    : { navigation: "Navegación principal", generator: "Generador", templates: "Plantillas", tools: "Herramientas", cvs: "Mis CVs" };
  const links: Array<{ id: NavigationSection; label: string; href: string }> = [
    { id: "generator", label: labels.generator, href: `/${resolvedLocale}?openEditor=1#generator` },
    { id: "templates", label: labels.templates, href: resolvedLocale === "en" ? "/en/templates" : "/es/plantillas" },
    { id: "tools", label: labels.tools, href: `/${resolvedLocale}/tools` },
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
