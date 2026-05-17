"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const faqs = [
  {
    question: "How long does delivery take?",
    answer:
      "Most orders are delivered within 3-7 business days depending on your location.",
  },
  {
    question: "Do you offer Cash On Delivery?",
    answer:
      "Currently, we do not offer Cash On Delivery. Orders can be placed using prepaid payment methods only.",
  },
  {
    question: "Do prepaid orders get any discount?",
    answer:
      "Yes, prepaid orders may get special offers such as 5% OFF during selected drops or campaigns.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 3-day return policy from the date of delivery.",
  },
  {
    question: "When will I receive my refund?",
    answer:
      "Refunds are initiated through Razorpay once the return pickup is confirmed successfully by the courier partner.",
  },
  {
    question: "How can I track my order?",
    answer:
      "You can track your order anytime from the My Orders page in your account.",
  },
  {
    question: "How do I know my size?",
    answer:
      "Every product page includes size information and fit details to help you choose the correct fit.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "Orders can only be cancelled before they are shipped from our warehouse.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can contact us through WhatsApp, Instagram, or Email support from the Contact Us page.",
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
              HELP CENTER
            </p>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              FREQUENTLY ASKED QUESTIONS
            </h1>

            <p className="text-muted-foreground mt-4 leading-relaxed max-w-2xl">
              Everything you need to know about orders, delivery, prepaid
              payments, refunds, returns, and support.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index

              return (
                <div
                  key={index}
                  className="border border-border bg-secondary/20"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-6 text-left"
                  >
                    <h2 className="font-black text-lg">
                      {faq.question}
                    </h2>

                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-16 border border-border bg-secondary/20 p-8 text-center">
            <h2 className="text-2xl font-black mb-4">
              STILL NEED HELP?
            </h2>

            <p className="text-muted-foreground mb-6">
              Our support team is always ready to help you.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-foreground text-background px-8 py-4 text-sm font-black hover:bg-foreground/90 transition-colors"
            >
              CONTACT SUPPORT
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}