import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "./providers/AuthProvider"
import { MaintenanceGate } from "@/components/maintenance-gate"
import { ScrollAtmosphere } from "@/components/scroll-atmosphere"
import { WhatsAppButton } from "@/components/whatsapp-button"


import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"

import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://thepaddler.in"),
  title: "THE PADDLER | Not Just Clothing. A Statement.",
  description:
    "Built for those who move different. Premium streetwear for individuals who don't follow trends - they create them.",
  keywords: [
    "streetwear",
    "clothing",
    "fashion",
    "urban",
    "street style",
    "premium",
  ],
}

export const viewport = {
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <WishlistProvider>
          <CartProvider>
            <AuthProvider>
              <MaintenanceGate />
              <ScrollAtmosphere />
              {children}
            </AuthProvider>
          </CartProvider>
          <WhatsAppButton/>
        </WishlistProvider>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
