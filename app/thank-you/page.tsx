"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Download, PackageCheck, Sparkles, Truck } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

function ThankYouContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  return (
    <>
      <Header />

      <main className="thank-you-stage relative min-h-screen overflow-hidden bg-background px-4 pt-28 pb-20 text-foreground">
        <div className="thank-you-grid absolute inset-0 opacity-70" />
        <div className="thank-you-orb thank-you-orb-a" />
        <div className="thank-you-orb thank-you-orb-b" />
        <div className="thank-you-scan absolute inset-x-0 top-24 h-px bg-white/40" />

        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-12rem)] max-w-5xl flex-col items-center justify-center text-center">
          <div className="thank-you-pulse mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-green-400/70 bg-green-400/10 text-green-300 shadow-[0_0_80px_rgba(34,197,94,0.35)]">
            <CheckCircle2 className="h-14 w-14" />
          </div>

          <p className="thank-you-kicker mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.45em] text-white/70">
            <Sparkles className="h-4 w-4" />
            Payment locked
          </p>

          <h1 className="thank-you-title max-w-4xl text-5xl font-black uppercase leading-[0.88] sm:text-7xl lg:text-8xl">
            Your drop is secured.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            Order confirmed. We are preparing it for dispatch and the tracking
            timeline will keep updating from your dashboard.
          </p>

          {orderId && (
            <p className="mt-5 border border-white/10 bg-black/40 px-5 py-3 text-sm text-muted-foreground">
              Order ID: <span className="font-black text-white">#{orderId}</span>
            </p>
          )}

          <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { title: "Order Placed", icon: CheckCircle2 },
              { title: "Packing Next", icon: PackageCheck },
              { title: "Shipping Soon", icon: Truck },
            ].map((item, index) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="thank-you-step border border-white/10 bg-white/[0.03] p-5 text-left"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <Icon className="mb-4 h-5 w-5 text-green-300" />
                  <p className="font-black uppercase">{item.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Step {index + 1} of 3
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {orderId && (
              <Link
                href={`/invoice/${encodeURIComponent(orderId)}`}
                className="inline-flex items-center gap-2 bg-green-300 px-8 py-4 text-sm font-black uppercase text-black transition hover:bg-green-200"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </Link>
            )}
            <Link
              href="/orders"
              className="bg-foreground px-8 py-4 text-sm font-black uppercase text-background transition hover:bg-foreground/90"
            >
              View Order
            </Link>
            <Link
              href="/shop"
              className="border border-white/15 px-8 py-4 text-sm font-black uppercase transition hover:bg-white/10"
            >
              Keep Shopping
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  )
}
