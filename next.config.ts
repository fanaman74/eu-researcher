import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // pdf-parse loads pdfjs-dist's Node worker dynamically; keep both packages
  // external so Next does not bundle the worker/browser build into this route.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/peer-summary": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  // These pages duplicated the Parliament and Consultations pages; keep old links working.
  async redirects() {
    return [
      { source: "/enel/mep-questions", destination: "/parliament", permanent: true },
      { source: "/enel/active-consultations", destination: "/have-your-say", permanent: true },
    ];
  },
};

export default nextConfig;
