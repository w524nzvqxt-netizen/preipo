import type { MetadataRoute } from "next";

// robots.txt: закрываем админку и приватные страницы от индексации
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/agent", "/agent/", "/privacy"],
    },
  };
}
