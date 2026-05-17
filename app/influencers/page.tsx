import Image from "next/image"
import Link from "next/link"
import { Instagram } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const influencers = [
  {
    name: "ANAYA",
    username: "@anaya.jpg",
    image: "/images/influencers/anaya.jpg",
    followers: "48K",
    code: "ANAYA10",
  },
  {
    name: "LUCIFER",
    username: "@ig.lucifer.__",
    image: "/images/influencers/lucifer.jpg",
    followers: "22K",
    code: "LUCIFER10",
  },
  {
    name: "ZOE",
    username: "@zoe__thebitch",
    image: "/images/influencers/zoe.jpg",
    followers: "15K",
    code: "ZOE10",
  },
]

export default function InfluencersPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            THE PADDLER COMMUNITY
          </p>

          <h1 className="text-4xl sm:text-5xl font-black mb-6">
            INFLUENCER SHOWCASE
          </h1>

          <p className="text-muted-foreground max-w-2xl mb-14">
            Creators, artists, and personalities representing THE PADDLER culture.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {influencers.map((influencer) => (
              <div
                key={influencer.username}
                className="border border-border bg-secondary/20 overflow-hidden group"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                  <Image
                    src={influencer.image}
                    alt={influencer.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-black">
                        {influencer.name}
                      </h2>

                      <p className="text-sm text-muted-foreground mt-1">
                        {influencer.username}
                      </p>
                    </div>

                    <Instagram className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        FOLLOWERS
                      </p>

                      <p className="font-black">
                        {influencer.followers}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        COUPON
                      </p>

                      <p className="font-black">
                        {influencer.code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 border border-border bg-secondary/20 p-8 text-center">
            <h2 className="text-3xl font-black mb-4">
              WANT TO COLLAB WITH THE PADDLER?
            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              We collaborate with creators, streetwear pages, artists, riders,
              and personalities who align with THE PADDLER culture.
            </p>

            <Link
              href="/contact"
              className="inline-flex bg-foreground text-background px-8 py-4 text-sm font-black hover:bg-foreground/90 transition-colors"
            >
              APPLY FOR COLLAB
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}