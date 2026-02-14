import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.isbndb.com",
      },
      {
        protocol: "https",
        hostname: "www.goodneighbours.org.za",
      }
    ],
  },
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "https://bt-catalog.azurewebsites.net/api/:path*",
      },
    ];
  },
};

export default nextConfig;
