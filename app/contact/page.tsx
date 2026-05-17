"use client"

import Link from "next/link"
import { MessageCircle, Mail, Instagram, Phone, Send } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ContactPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="mb-14">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              CUSTOMER SUPPORT
            </p>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              CONTACT US
            </h1>

            <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
              Need help with your order, delivery, returns, sizing, or anything else?
              Our team is here to help you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">

            {/* LEFT SIDE */}
            <div className="space-y-6">

              {/* WhatsApp */}
              <div className="border border-border p-6 bg-secondary/20">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 border border-border flex items-center justify-center">
                    <MessageCircle className="w-7 h-7" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black mb-2">
                      WHATSAPP SUPPORT
                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      Fastest way to connect with THE PADDLER support team.
                    </p>

                    <Link
                      href="https://wa.me/918103631364"
                      target="_blank"
                      className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 text-sm font-bold hover:bg-foreground/90 transition-colors"
                    >
                      CHAT NOW
                    </Link>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="border border-border p-6 bg-secondary/20">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 border border-border flex items-center justify-center">
                    <Mail className="w-7 h-7" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black mb-2">
                      EMAIL SUPPORT
                    </h2>

                    <p className="text-muted-foreground text-sm mb-3">
                      support@thepaddler.in
                    </p>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      For returns, refunds, collaborations, or detailed support queries.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instagram */}
              <div className="border border-border p-6 bg-secondary/20">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 border border-border flex items-center justify-center">
                    <Instagram className="w-7 h-7" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black mb-2">
                      INSTAGRAM
                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      Follow us for latest drops, updates, and exclusive launches.
                    </p>

                    <Link
                      href="https://instagram.com/thepaddler.in"
                      target="_blank"
                      className="inline-flex items-center gap-2 border border-foreground px-5 py-3 text-sm font-bold hover:bg-foreground hover:text-background transition-colors"
                    >
                      @THEPADDLER.IN
                    </Link>
                  </div>
                </div>
              </div>

              {/* Call */}
              <div className="border border-border p-6 bg-secondary/20">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 border border-border flex items-center justify-center">
                    <Phone className="w-7 h-7" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black mb-2">
                      CUSTOMER CARE
                    </h2>

                    <p className="text-muted-foreground text-sm">
                      +91 8103631364
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDE FORM */}
            <div className="border border-border p-6 sm:p-8 bg-secondary/20">

              <h2 className="text-2xl font-black mb-8">
                SEND US A MESSAGE
              </h2>

              <form className="flex flex-col">

                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                />

                <input
                  type="text"
                  placeholder="Order ID (Optional)"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                />

                <select
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                >
                  <option>Choose Topic</option>
                  <option>Order Issue</option>
                  <option>Refund Request</option>
                  <option>Return Request</option>
                  <option>Sizing Help</option>
                  <option>Collaboration</option>
                  <option>General Support</option>
                </select>

                <textarea
                  placeholder="Write your message..."
                  className="w-full min-h-40 bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white resize-none mt-4"
                />

                <button
                  type="submit"
                  className="w-full bg-foreground text-background py-4 font-black flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors mt-8"
                >
                  <Send className="w-4 h-4" />
                  SEND MESSAGE
                </button>

              </form>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}