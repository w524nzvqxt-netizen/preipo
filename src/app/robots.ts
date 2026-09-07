import type { MetadataRoute } from "next";

// robots.txt: закрываем админку/приватное, указываем sitemap и host
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/agent", "/agent/", "/privacy", "/lab"],
    },
    sitemap: "https://pre-ipo.pro/sitemap.xml",
    host: "https://pre-ipo.pro",
  };
}
