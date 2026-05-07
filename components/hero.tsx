import Image from "next/image"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-end pb-16 sm:pb-24">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt="Person in streetwear standing in urban environment"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight text-balance">
            NOT JUST CLOTHING.
            <br />
            A STATEMENT.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md">
            Built for those who move different.
          </p>
          <Link
            href="/shop"
            className="inline-block mt-8 px-6 py-3 border border-foreground text-sm font-medium text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            SHOP NOW
          </Link>
        </div>
      </div>
    </section>
  )
}
