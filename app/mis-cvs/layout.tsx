import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis CVs",
  robots: { index: false, follow: false, noarchive: true },
};

export default function MyCvsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
