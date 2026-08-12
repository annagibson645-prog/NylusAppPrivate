import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gray-matter"],

  // /concept/[slug] is the one route that reads public/data at request time, so
  // Next traces that whole directory into its serverless function. At 251MB of
  // generated JSON that put the function at 256MB, past Vercel's 250MB limit,
  // and the build failed outright.
  //
  // The route only ever opens cards.json, one body-NNN.json shard, and its
  // order-<domain>.json. Everything below is read by other routes — which are
  // static, so they carry no function of their own — or by nothing at all.
  // Dropping them takes the function to roughly 198MB.
  //
  // Note this is a ceiling, not a cure: the body shards are ~194MB and grow
  // with the vault. Prerendering this route would remove the function (and the
  // limit) entirely — static pages produce no server trace.
  outputFileTracingExcludes: {
    "/concept/\\[slug\\]": [
      "./public/data/graph.json",
      "./public/data/domain-*.json",
      "./public/data/search-index.json",
      "./public/data/highlights*.json",
      "./public/data/sparks.json",
      "./public/data/collisions.json",
      "./public/data/sources.json",
      "./public/data/research.json",
      "./public/data/threads.json",
      "./public/data/hubs.json",
      "./public/data/timeline.json",
      "./public/data/craft.json",
      "./public/data/essays.json",
      "./public/data/stats.json",
    ],
  },
};

export default nextConfig;
