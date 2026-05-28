import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const storyStats = [
  ["01", "Built For Movement"],
  ["240", "GSM Heavyweight"],
  ["DROP", "Small Batch Only"],
]

export function BrandStory() {
  return (
    <section id="about" className="brand-story-stage relative overflow-hidden py-20 sm:py-28 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:54px_54px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-white text-black lg:inset-y-0 lg:left-0 lg:h-auto lg:w-1/2" />
      <div className="pointer-events-none absolute hidden lg:block left-[46%] top-0 h-full w-32 -skew-x-12 bg-gradient-to-r from-white via-white/70 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-10 text-[14vw] font-black leading-none text-white/[0.045] animate-[featured-word-drift_8s_ease-in-out_infinite]">
        WHY
      </div>
      <div className="pointer-events-none absolute bottom-[-0.16em] left-4 text-[12vw] font-black leading-none text-black/[0.06] animate-[featured-word-drift_9s_ease-in-out_infinite_1s]">
        MINDSET
      </div>
      <div className="pointer-events-none absolute left-0 right-0 top-8 rotate-[-2deg] border-y border-black/10 bg-black/5 py-2 text-xs font-black tracking-[0.45em] text-black/35 animate-[featured-ticker_19s_linear_infinite] whitespace-nowrap">
        RAW STREET ENERGY / MOVEMENT / IDENTITY / DURABILITY / RAW STREET ENERGY / MOVEMENT / IDENTITY / DURABILITY /
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div className="brand-image-wrap relative">
            <div className="absolute -inset-4 border border-black/10" />
            <div className="absolute -right-6 top-10 z-10 hidden sm:block bg-black px-5 py-4 text-white shadow-2xl">
              <p className="text-3xl font-black">NO</p>
              <p className="text-xs tracking-[0.32em] text-white/55">TRENDS</p>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 shadow-[0_28px_70px_rgba(0,0,0,0.3)]">
              <Image
                src="/images/brand-story.jpg"
                alt="Technical jacket product shot"
                fill
                className="brand-story-image object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
          </div>

          <div className="relative text-white lg:pl-8">
            <p className="mb-5 inline-flex border border-white/15 bg-white/5 px-3 py-2 text-xs tracking-[0.35em] text-white/65 backdrop-blur">
              BRAND PHILOSOPHY
            </p>

            <h2 className="max-w-xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-normal leading-[0.95] mb-7">
              WHY
              <br />
              PADDLER?
            </h2>

            <div className="space-y-5 text-white/68 text-base sm:text-lg leading-relaxed max-w-xl">
              <p>
                PADDLER is not just a brand. It&apos;s a mindset for people who
                do not wait for culture to move. They move first.
              </p>
              <p>
                Every piece is built around movement, identity, and raw street
                energy, with silhouettes made to feel heavy, clean, and loud
                without shouting.
              </p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3 max-w-2xl">
              {storyStats.map(([value, label]) => (
                <div
                  key={label}
                  className="brand-stat border border-white/12 bg-white/[0.04] p-4 backdrop-blur"
                >
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="mt-2 text-[10px] tracking-[0.24em] text-white/45">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="hero-cta mt-9 inline-flex items-center gap-2 bg-white px-7 py-4 text-sm font-black tracking-wide text-black"
            >
              OUR MANIFESTO
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
