import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/utils/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
