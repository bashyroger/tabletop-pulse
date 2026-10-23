import type { NextConfig } from "next";

// Cap Rust Tokio/Rayon thread pools (@next/swc) on shared 64-core container hosts (Hostinger)
process.env.TOKIO_WORKER_THREADS ||= "4";
process.env.RAYON_NUM_THREADS ||= "4";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Cap build worker processes so shared 64-core container hosts (Hostinger)
    // do not spawn 63 workers x 64 Tokio threads and hit cgroup pids.max (os error 11).
    cpus: 4,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
