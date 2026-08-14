import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gray-matter"],

  // Every route reads public/data through lib/vault-json.ts, and the path it
  // builds is dynamic, so Next's tracer gives up and bundles the entire
  // directory into all 45 route traces. At 252MB of generated JSON that put
  // the functions at ~256MB against Vercel's 250MB limit and the build failed.
  //
  // Almost none of that is needed at *runtime*: every route except
  // /concept/[slug] is force-static, so it reads these files while building and
  // is served as plain HTML afterwards. Excluding the directory everywhere and
  // adding back only what the one dynamic route opens (cards.json, its
  // body-NNN.json shard, its order-<domain>.json) is what keeps the functions
  // small.
  //
  // If /concept/[slug] is ever prerendered too, both of these can go: fully
  // static pages produce no server trace at all.
  outputFileTracingExcludes: {
    "**": ["./public/data/**"],
  },
  outputFileTracingIncludes: {
    "/concept/\\[slug\\]": [
      "./public/data/cards.json",
      "./public/data/body-*.json",
      "./public/data/order-*.json",
      "./public/data/hubnav-*.json",
    ],
  },
};

export default nextConfig;
