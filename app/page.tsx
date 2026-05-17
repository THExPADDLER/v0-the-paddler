import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { DropBanner } from "@/components/drop-banner"
import { FeaturedProducts } from "@/components/featured-products"
import { BrandStory } from "@/components/brand-story"
import { LimitedDrop } from "@/components/limited-drop"
import { StreetGallery } from "@/components/street-gallery"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main>
      <Header />

      <Hero />

      <DropBanner />

      <FeaturedProducts />

      <BrandStory />

      <LimitedDrop />

      <StreetGallery />

      <Newsletter />

      <Footer />
    </main>
  )
}