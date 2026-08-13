import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: ["/", "/services"], disallow: ["/portal/", "/booking/", "/book/", "/login", "/change-password", "/api/"] } };
}
