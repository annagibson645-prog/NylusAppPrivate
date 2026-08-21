import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gray-matter"],

  // Every route reads public/data through lib/vault-json.ts, and the path it
  // builds is dynamic, so Next's tracer gives up and bundles the entire
  // directory into all 45 route traces. At 292MB of generated JSON that put
  // the functions past Vercel's 250MB limit and the build failed.
  //
  // None of it is needed at *runtime*. Every route is force-static, so these
  // files are read while building and served as plain HTML afterwards.
  // Excluding the directory everywhere is what keeps the traces at a few MB.
  outputFileTracingExcludes: {
    "**": ["./public/data/**"],
  },

  // An outputFileTracingIncludes block used to sit here, adding cards.json,
  // body-*.json, order-*.json and hubnav-*.json back for "/concept/[slug]".
  // It was correct while that route rendered per request. It has been
  // `force-static` with `dynamicParams = false` since — every slug is
  // prerendered at build time and nothing renders on demand — but the includes
  // stayed behind and went on re-adding 226MB to that one trace, which is the
  // number `npm run parse` was reporting as a "function budget" at 91% full.
  //
  // Removed 2026-08-20. The traced total for /concept/[slug] goes from 227.6MB
  // to ~2MB, and the 250MB per-function ceiling stops applying to note count
  // rather than merely receding.
  //
  // If /concept/[slug] ever goes back to rendering on demand, the includes have
  // to come back with it — and so does the ceiling.
};

export default nextConfig;
