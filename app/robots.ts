import type { MetadataRoute } from "next";
import { getSiteUrl } from "./site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/mis-cvs", "/es/mis-cvs", "/en/mis-cvs"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
