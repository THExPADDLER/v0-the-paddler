/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://the-paddler-6969.firebaseapp.com/__/auth/:path*",
      },
    ]
  },
}

export default nextConfig
