/** @type {import('next').NextConfig} */
const firebaseAuthDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "the-paddler-6969.firebaseapp.com"

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
        destination: `https://${firebaseAuthDomain}/__/auth/:path*`,
      },
    ]
  },
}

export default nextConfig
