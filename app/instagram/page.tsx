"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Instagram, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function InstagramPage() {
  const instagramHandle = "thepaddler.in"
  const instagramUrl = `https://instagram.com/${instagramHandle}`

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-1 mb-6">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <Instagram className="w-10 h-10 text-foreground" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                @{instagramHandle}
              </h1>
              <p className="text-muted-foreground mb-6 max-w-md">
                Street culture. Limited drops. Raw energy. Follow us for exclusive content and early access.
              </p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium tracking-wider hover:bg-foreground/90 transition-colors"
              >
                Follow on Instagram
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Live Instagram Feed Embed */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-accent text-sm font-medium tracking-wider uppercase">
                Live Feed
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
                FROM THE STREETS
              </h2>
            </div>

            {/* Instagram Embed Container */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                {/* Instagram Profile Embed */}
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={`https://www.instagram.com/${instagramHandle}/`}
                  data-instgrm-version="14"
                  style={{
                    background: "#0a0a0a",
                    border: 0,
                    borderRadius: "3px",
                    boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
                    margin: "1px auto",
                    maxWidth: "540px",
                    minWidth: "326px",
                    padding: 0,
                    width: "calc(100% - 2px)",
                  }}
                >
                  <div style={{ padding: "16px" }}>
                    <a
                      href={instagramUrl}
                      style={{
                        background: "#0a0a0a",
                        lineHeight: 0,
                        padding: "0 0",
                        textAlign: "center",
                        textDecoration: "none",
                        width: "100%",
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "#F4F4F4",
                            borderRadius: "50%",
                            flexGrow: 0,
                            height: "40px",
                            marginRight: "14px",
                            width: "40px",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            flexGrow: 1,
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#F4F4F4",
                              borderRadius: "4px",
                              flexGrow: 0,
                              height: "14px",
                              marginBottom: "6px",
                              width: "100px",
                            }}
                          />
                          <div
                            style={{
                              backgroundColor: "#F4F4F4",
                              borderRadius: "4px",
                              flexGrow: 0,
                              height: "14px",
                              width: "60px",
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ padding: "19% 0" }} />
                      <div
                        style={{
                          display: "block",
                          height: "50px",
                          margin: "0 auto 12px",
                          width: "50px",
                        }}
                      >
                        <Instagram className="w-full h-full text-neutral-400" />
                      </div>
                      <div style={{ paddingTop: "8px" }}>
                        <div
                          style={{
                            color: "#ffffff",
                            fontFamily: "Arial,sans-serif",
                            fontSize: "14px",
                            fontStyle: "normal",
                            fontWeight: 550,
                            lineHeight: "18px",
                          }}
                        >
                          View this profile on Instagram
                        </div>
                      </div>
                      <div style={{ padding: "12.5% 0" }} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          marginBottom: "14px",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              backgroundColor: "#F4F4F4",
                              borderRadius: "50%",
                              height: "12.5px",
                              width: "12.5px",
                              transform: "translateX(0px) translateY(7px)",
                            }}
                          />
                          <div
                            style={{
                              backgroundColor: "#F4F4F4",
                              height: "12.5px",
                              transform: "rotate(-45deg) translateX(3px) translateY(1px)",
                              width: "12.5px",
                              flexGrow: 0,
                              marginRight: "14px",
                              marginLeft: "2px",
                            }}
                          />
                          <div
                            style={{
                              backgroundColor: "#F4F4F4",
                              borderRadius: "50%",
                              height: "12.5px",
                              width: "12.5px",
                              transform: "translateX(9px) translateY(-18px)",
                            }}
                          />
                        </div>
                        <div style={{ marginLeft: "8px" }}>
                          <div
                            style={{
                              backgroundColor: "#F4F4F4",
                              borderRadius: "50%",
                              flexGrow: 0,
                              height: "20px",
                              width: "20px",
                            }}
                          />
                          <div
                            style={{
                              width: 0,
                              height: 0,
                              borderTop: "2px solid transparent",
                              borderLeft: "6px solid #f4f4f4",
                              borderBottom: "2px solid transparent",
                              transform: "translateX(16px) translateY(-4px) rotate(30deg)",
                            }}
                          />
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                          <div
                            style={{
                              width: "0px",
                              borderTop: "8px solid #F4F4F4",
                              borderRight: "8px solid transparent",
                              transform: "translateY(16px)",
                            }}
                          />
                          <div
                            style={{
                              backgroundColor: "#F4F4F4",
                              flexGrow: 0,
                              height: "12px",
                              width: "16px",
                              transform: "translateY(-4px)",
                            }}
                          />
                          <div
                            style={{
                              width: 0,
                              height: 0,
                              borderTop: "8px solid #F4F4F4",
                              borderLeft: "8px solid transparent",
                              transform: "translateY(-4px) translateX(8px)",
                            }}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flexGrow: 1,
                          justifyContent: "center",
                          marginBottom: "24px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "#F4F4F4",
                            borderRadius: "4px",
                            flexGrow: 0,
                            height: "14px",
                            marginBottom: "6px",
                            width: "224px",
                          }}
                        />
                        <div
                          style={{
                            backgroundColor: "#F4F4F4",
                            borderRadius: "4px",
                            flexGrow: 0,
                            height: "14px",
                            width: "144px",
                          }}
                        />
                      </div>
                    </a>
                    <p
                      style={{
                        color: "#c9c8cd",
                        fontFamily: "Arial,sans-serif",
                        fontSize: "14px",
                        lineHeight: "17px",
                        marginBottom: 0,
                        marginTop: "8px",
                        overflow: "hidden",
                        padding: "8px 0 7px",
                        textAlign: "center",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <a
                        href={instagramUrl}
                        style={{
                          color: "#c9c8cd",
                          fontFamily: "Arial,sans-serif",
                          fontSize: "14px",
                          fontStyle: "normal",
                          fontWeight: "normal",
                          lineHeight: "17px",
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @{instagramHandle}
                      </a>
                    </p>
                  </div>
                </blockquote>

                {/* Load Instagram Embed Script */}
                <script async src="//www.instagram.com/embed.js" />
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 sm:py-24 bg-secondary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              BE PART OF THE CULTURE
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Tag us @{instagramHandle} to get featured. Show us how you rock PADDLER.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-medium tracking-wider hover:bg-foreground/90 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                Follow @{instagramHandle}
              </a>
              <Link
                href="/#shop"
                className="inline-flex items-center justify-center gap-2 border border-foreground text-foreground px-8 py-4 text-sm font-medium tracking-wider hover:bg-foreground hover:text-background transition-colors"
              >
                Shop the Drop
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
