import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // These pages duplicated the Parliament and Consultations pages; keep old links working.
  async redirects() {
    return [
      { source: "/enel/mep-questions", destination: "/parliament", permanent: true },
      { source: "/enel/active-consultations", destination: "/have-your-say", permanent: true },
    ];
  },
};

export default nextConfig;
