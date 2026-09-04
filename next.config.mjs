/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: process.env.NODE_ENV === "production" ? "/GAL" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
