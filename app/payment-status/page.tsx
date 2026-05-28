"use client"

import Link from "next/link"
import { CreditCard } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PaymentStatusPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="border border-border bg-secondary/20 p-8 text-center sm:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border">
              <CreditCard className="h-9 w-9 text-accent" />
            </div>

            <p className="mb-3 text-xs tracking-[0.35em] text-muted-foreground">
              PAYMENT STATUS
            </p>

            <h1 className="mb-5 text-3xl font-black sm:text-4xl">
              CHECK YOUR ORDER
            </h1>

            <p className="mx-auto max-w-xl leading-relaxed text-muted-foreground">
              Razorpay payments are verified automatically after checkout. Open
              your orders page to see the latest payment, invoice, and shipment
              status.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/orders"
                className="bg-foreground px-8 py-4 text-sm font-black text-background"
              >
                VIEW ORDERS
              </Link>

              <Link
                href="/shop"
                className="border border-border px-8 py-4 text-sm font-black hover:bg-secondary"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
