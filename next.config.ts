import path from "node:path";
import type { NextConfig } from "next";

// Decor swatches/textures live on the CRM host (catalog imageUrl = "/decoruri/egger/W1000ST9.jpg").
// Proxying them makes them same-origin: plain <img>/CSS backgrounds work and three.js
// can use them as textures without CORS.
const crm = process.env.CRM_API_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return crm ? [{ source: "/decoruri/:path*", destination: `${crm}/decoruri/:path*` }] : [];
  },
};

export default nextConfig;
