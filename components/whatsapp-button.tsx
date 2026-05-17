"use client"

import Link from "next/link"
import { MessageCircle } from "lucide-react"

export function WhatsAppButton() {
  return (
    <Link
      href="https://wa.me/918103631364"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[999] group"
    >
      <div className="flex items-center gap-3">
        
        {/* Text Bubble */}
        <div className="hidden sm:flex items-center bg-background border border-border px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-sm font-bold whitespace-nowrap">
            Chat with us
          </span>
        </div>

        {/* WhatsApp Circle */}
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
      </div>
    </Link>
  )
}