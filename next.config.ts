import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // убрать X-Powered-By (best practice)
  compress: true,
  // современные форматы для next/image (меньше вес картинок)
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // 31 день
  },
  // точечный tree-shaking для тяжёлых библиотек анимации/3D — импортируем только
  // реально используемые модули вместо всего пакета целиком
  experimental: {
    optimizePackageImports: ["motion", "gsap", "@react-three/drei"],
  },
  async headers() {
    const security = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" }, // защита от clickjacking
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ];
    return [
      // базовые security-заголовки для всех ответов
      { source: "/:path*", headers: security },
      // длинный кэш для статического медиа-контента (PageSpeed: efficient cache policy)
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      // книги (PDF/HTML) — тоже кэшируем
      {
        source: "/books/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
