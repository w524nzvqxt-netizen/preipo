import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE = "https://pre-ipo.pro";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projects: { id: string; updatedAt: Date }[] = [];
  let kb: { id: string; updatedAt: Date }[] = [];
  try {
    [projects, kb] = await Promise.all([
      prisma.project.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
      prisma.kbCompany.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
    ]);
  } catch {
    // при недоступности БД отдаём хотя бы статические маршруты
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    ...["/base", "/exits", "/portfolio", "/academy", "/news"].map((p) => ({
      url: `${SITE}${p}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE}/project/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const baseRoutes: MetadataRoute.Sitemap = kb.map((c) => ({
    url: `${SITE}/base/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes, ...baseRoutes];
}
