"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const demoOrders = [
  {
    id: "#TP1024",
    productName: "SKULL ART TEE",
    image: "/images/products/black-tee-3.jpg",
    price: 1399,
    size: "L",
    status: "In Transit",
    orderedDate: "15 May 2026",
    estimatedDelivery: "20 May 2026",
  },
]

export default function OrdersPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              CUSTOMER DASHBOARD
            </p>

            <h1 className="text-3xl font-black">
              MY ORDERS
            </h1>
          </div>

          {/* Empty State */}
          {demoOrders.length === 0 ? (
            <div className="border border-border bg-secondary/20 py-24 text-center">
              <Package className="w-14 h-14 mx-auto text-muted-foreground mb-6" />

              <h2 className="text-2xl font-bold mb-3">
                NO ORDERS YET
              </h2>

              <p className="text-muted-foreground mb-8">
                Your future drops will appear here.
              </p>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3 text-sm font-bold hover:bg-foreground/90 transition-colors"
              >
                SHOP NOW
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {demoOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-border bg-secondary/20 overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        ORDER ID
                      </p>

                      <p className="font-bold">
                        {order.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        ORDERED ON
                      </p>

                      <p className="font-medium">
                        {order.orderedDate}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        STATUS
                      </p>

                      <p className="font-medium text-yellow-400">
                        {order.status}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">

                      {/* Product */}
                      <div className="flex gap-5 flex-1">
                        <div className="relative w-28 h-32 bg-neutral-900 overflow-hidden flex-shrink-0">
                          <Image
                            src={order.image}
                            alt={order.productName}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <h2 className="font-black text-lg">
                            {order.productName}
                          </h2>

                          <p className="text-sm text-muted-foreground mt-1">
                            Size: {order.size}
                          </p>

                          <p className="font-bold mt-4">
                            ₹{order.price}
                          </p>

                          <p className="text-sm text-muted-foreground mt-4">
                            Estimated Delivery:
                          </p>

                          <p className="font-medium">
                            {order.estimatedDelivery}
                          </p>
                        </div>
                      </div>

                      {/* Tracking */}
                      <div className="lg:w-[420px]">
                        <h3 className="font-bold mb-6">
                          TRACK ORDER
                        </h3>

                        <div className="space-y-6">

                          {/* Processing */}
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <div className="w-px h-10 bg-border mt-2" />
                            </div>

                            <div>
                              <p className="font-medium">
                                Processing
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Your order has been confirmed
                              </p>
                            </div>
                          </div>

                          {/* Shipped */}
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <Truck className="w-5 h-5 text-green-500" />
                              <div className="w-px h-10 bg-border mt-2" />
                            </div>

                            <div>
                              <p className="font-medium">
                                Shipped
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Package dispatched from warehouse
                              </p>
                            </div>
                          </div>

                          {/* Transit */}
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <Clock3 className="w-5 h-5 text-yellow-400" />
                              <div className="w-px h-10 bg-border mt-2" />
                            </div>

                            <div>
                              <p className="font-medium text-yellow-400">
                                In Transit
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Your order is on the way
                              </p>
                            </div>
                          </div>

                          {/* Delivered */}
                          <div className="flex gap-4 opacity-40">
                            <div className="flex flex-col items-center">
                              <Package className="w-5 h-5" />
                            </div>

                            <div>
                              <p className="font-medium">
                                Delivered
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Awaiting delivery completion
                              </p>
                            </div>
                          </div>

                        </div>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-3 mt-8">
                          <button className="px-5 py-3 bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors">
                            TRACK PACKAGE
                          </button>

                          <button className="px-5 py-3 border border-border text-sm font-bold hover:bg-secondary transition-colors">
                            DOWNLOAD INVOICE
                          </button>

                          <button className="px-5 py-3 border border-border text-sm font-bold hover:bg-secondary transition-colors flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" />
                            RETURN
                          </button>
                        </div>

                        {/* Refund Info */}
                        <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
                          Refunds are initiated once the courier pickup is confirmed.
                          Return requests are accepted within 3 days of delivery.
                        </p>

                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}