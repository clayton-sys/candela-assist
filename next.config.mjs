/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 14 syntax (renamed to serverExternalPackages in Next.js 15).
    // Prevents the bundler from trying to statically analyse these packages
    // at build time — they are required from node_modules at runtime instead.
    serverComponentsExternalPackages: [
      "@upstash/redis",
      "@upstash/ratelimit",
      "@supabase/supabase-js",
      "@supabase/ssr",
    ],
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
