import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Newsletter } from "@/components/newsletter"

export const metadata = {
  title: "About | THE PADDLER",
  description: "The story behind THE PADDLER - not just clothing, a statement.",
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px]">
          <Image
            src="/images/about-hero.jpg"
            alt="THE PADDLER brand story"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
                OUR STORY
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Born from the streets. Built for those who move different.
              </p>
            </div>
          </div>
        </section>

        {/* Origin Story */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="text-accent text-sm font-medium tracking-wider uppercase">
                  The Beginning
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 mb-6">
                  WHY PADDLER?
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    PADDLER is not just a brand. It&apos;s a mindset. Built for individuals 
                    who don&apos;t follow trends — they create them.
                  </p>
                  <p>
                    Every piece reflects movement, identity, and raw street energy. Our design 
                    philosophy merges industrial durability with avant-garde silhouettes.
                  </p>
                  <p>
                    We started in 2024 with a simple belief: clothing should be a statement, 
                    not just fabric. Each drop is limited because exclusivity matters. Each 
                    design is intentional because details define legends.
                  </p>
                </div>
              </div>
              <div className="relative aspect-[4/5] bg-secondary">
                <Image
                  src="/images/founder.jpg"
                  alt="The creative vision behind PADDLER"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 sm:py-24 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                WHAT WE STAND FOR
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 border border-neutral-600 flex items-center justify-center">
                  <span className="text-2xl font-bold">01</span>
                </div>
                <h3 className="text-xl font-bold mb-3">AUTHENTICITY</h3>
                <p className="text-neutral-400">
                  Every piece is born from real street culture. No fakes, no copies, just raw originality.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 border border-neutral-600 flex items-center justify-center">
                  <span className="text-2xl font-bold">02</span>
                </div>
                <h3 className="text-xl font-bold mb-3">QUALITY</h3>
                <p className="text-neutral-400">
                  Premium materials, precise construction. Built to last through every session, every street.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 border border-neutral-600 flex items-center justify-center">
                  <span className="text-2xl font-bold">03</span>
                </div>
                <h3 className="text-xl font-bold mb-3">EXCLUSIVITY</h3>
                <p className="text-neutral-400">
                  Limited drops only. Once it&apos;s gone, it&apos;s gone. No restocks, no regrets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Craftsmanship */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative aspect-square bg-secondary order-2 lg:order-1">
                <Image
                  src="/images/values.jpg"
                  alt="PADDLER craftsmanship and attention to detail"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-accent text-sm font-medium tracking-wider uppercase">
                  Craftsmanship
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 mb-6">
                  BUILT DIFFERENT
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Every stitch, every seam, every detail is intentional. We work with 
                    premium heavyweight cotton, technical fabrics, and industrial-grade 
                    materials.
                  </p>
                  <p>
                    Our designs go through multiple iterations before they hit the streets. 
                    We test, we refine, we perfect. Because when you wear PADDLER, you&apos;re 
                    not just wearing clothes — you&apos;re wearing a statement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-secondary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              JOIN THE MOVEMENT
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Follow us on Instagram for behind-the-scenes content, early drop announcements, 
              and the culture that drives everything we create.
            </p>
            <a
              href="https://instagram.com/thepaddler.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-medium tracking-wider hover:bg-foreground/90 transition-colors"
            >
              @thepaddler.in
            </a>
          </div>
        </section>

        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
