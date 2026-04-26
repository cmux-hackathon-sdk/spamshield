import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ['react-map-gl', '@vis.gl/react-mapbox'],
};

export default nextConfig;
