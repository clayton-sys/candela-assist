/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling these packages — use them as-is from node_modules.
  // Required because @upstash/redis uses module-level code that fails during
  // Next.js static build analysis.
  serverExternalPackages: ["@upstash/redis", "@upstash/ratelimit"],
};

export default nextConfig;
