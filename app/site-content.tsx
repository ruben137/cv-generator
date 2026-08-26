import type { ElementType, ReactNode } from "react";

type SiteContentProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

export function SiteContent({ as: Component = "main", children, className = "" }: SiteContentProps) {
  return <Component className={`site-content${className ? ` ${className}` : ""}`}>{children}</Component>;
}
