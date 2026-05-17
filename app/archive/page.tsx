import Image from "next/image"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const archiveDrops = [
  {
    title: "VOID DROP 01",
    date: "SPRING 2026",
    image: "/images/products/black-tee-2.jpg",
    status: "SOLD OUT",
  },
  {
    title: "SKULL SERIES",
    date: "LIMITED RELEASE",
    image: "/images/products/black-tee-3.jpg",
    status: "ARCHIVED",
  },
  {
    title: "FOREST VINTAGE",
    date: "GREEN DROP",
    image: "/images/products/green-tee-1.jpg",
    status: "SOLD OUT",
  },
]

export default function ArchivePage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            PAST DROPS
          </p>

          <h1 className="text-4xl sm:text-5xl font-black mb-6">
            ARCHIVE
          </h1>

          <p className="text-muted-foreground max-w-2xl mb-14">
            Previous drops, sold-out pieces, and limited releases from THE PADDLER.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {archiveDrops.map((drop) => (
              <div key={drop.title} className="border border-border bg-secondary/20">
                <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
                  <Image
                    src={drop.image}
                    alt={drop.title}
                    fill
                    className="object-cover opacity-70"
                  />

                  <span className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-xs font-black">
                    {drop.status}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs tracking-[0.25em] text-muted-foreground mb-2">
                    {drop.date}
                  </p>

                  <h2 className="text-xl font-black">
                    {drop.title}
                  </h2>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}