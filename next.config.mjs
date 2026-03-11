/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 14 syntax (renamed to serverExternalPackages in Next.js 15).
    // Prevents the bundler from trying to statically analyse these packages
    // at build time — they are required from node_modules at runtime instead.
    serverComponentsExternalPackages: ["@upstash/redis", "@upstash/ratelimit"],
  },
};

export default nextConfig;
