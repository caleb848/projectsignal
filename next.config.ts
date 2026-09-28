import type { NextConfig } from "next";

/*
 * Fully static export, so the site can be hosted on GitHub Pages (or any
 * static host). PAGES_BASE_PATH is set by scripts/deploy-pages.sh when the
 * site is served from a sub-path such as /projectsignal.
 */
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.PAGES_BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
