import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Posters ship as locally authored SVG files (npm run gen:posters). SVG
    // optimization is opt-in; the sandbox CSP below keeps the optimizer safe.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Add the host of a poster CDN here if posters ever move off-repo,
    // e.g. remotePatterns: [new URL("https://cdn.example.org/posters/**")],
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
