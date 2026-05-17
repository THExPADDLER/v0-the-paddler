"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-end">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt="THE PADDLER Hero"
          fill
          priority
          className="object-cover object-center scale-105"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent" />
      </div>

      

      {/* Bottom Gradient Blur */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />

      {/* Main Content */}
      <div className="relative z-20 w-full pb-16 sm:pb-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl">

            {/* Mini Text */}
            <p className="text-xs sm:text-sm tracking-[0.45em] text-muted-foreground mb-6 animate-pulse">
              THE PADDLER STREETWEAR
            </p>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] text-white">
              NOT JUST
              <br />
              CLOTHING.
              <br />
              <span className="text-white/70">
                A STATEMENT.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-8 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Built for those who move different. Premium oversized streetwear
              inspired by rebellion, underground culture, and individuality.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-10">

              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-sm font-black tracking-wide hover:scale-105 transition-all duration-300"
              >
                SHOP THE DROP
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/archive"
                className="inline-flex items-center border border-white/20 bg-black/30 backdrop-blur px-8 py-4 text-sm font-black tracking-wide hover:bg-white hover:text-black transition-all duration-300"
              >
                VIEW ARCHIVE
              </Link>

            </div>

            {/* Bottom Stats */}
            <div className="flex flex-wrap items-center gap-10 mt-14">

              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  240 GSM
                </p>

                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  HEAVYWEIGHT COTTON
                </p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  LIMITED
                </p>

                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  SMALL BATCH DROPS
                </p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  PREMIUM
                </p>

                <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
                  STREETWEAR FIT
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>

    </section>
  )
}