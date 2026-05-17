"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { User, Mail, Phone, Save } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AccountPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    const savedUser = localStorage.getItem("user")

    if (savedUser) {
      const user = JSON.parse(savedUser)
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
    }
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    localStorage.setItem(
      "user",
      JSON.stringify({
        name,
        email,
        phone,
      })
    )

    alert("Profile updated successfully!")
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            CUSTOMER PROFILE
          </p>

          <h1 className="text-3xl font-black mb-10">
            EDIT PROFILE
          </h1>

          <form
            onSubmit={handleSave}
            className="border border-border bg-secondary/20 p-6 sm:p-8 space-y-6"
          >
            <div>
              <label className="text-xs text-muted-foreground tracking-widest">
                FULL NAME
              </label>

              <div className="relative mt-2 flex items-center">
                

                <input
                  type="text"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground tracking-widest">
                EMAIL
              </label>

              <div className="relative mt-2 flex items-center">
               

                <input
                  type="email"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground tracking-widest">
                PHONE
              </label>

              <div className="relative mt-2 flex items-center">
                

                <input
                  type="tel"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white"
                  placeholder="+91 00000 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-foreground text-background py-4 font-black flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              SAVE PROFILE
            </button>
          </form>

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <Link
              href="/orders"
              className="border border-border p-5 hover:bg-secondary transition-colors"
            >
              <h2 className="font-bold">My Orders</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Track and manage your drops.
              </p>
            </Link>

            <Link
              href="/addresses"
              className="border border-border p-5 hover:bg-secondary transition-colors"
            >
              <h2 className="font-bold">Saved Addresses</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage delivery addresses.
              </p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}