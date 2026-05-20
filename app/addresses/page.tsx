"use client"

import { useEffect, useState } from "react"
import { MapPin, Trash2, Plus, Save } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useAuth } from "@/app/providers/AuthProvider"

type Address = {
  id: number
  fullName: string
  phone: string
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  type: string
}

const pincodeData: Record<string, { city: string; state: string }> = {
  "450331": { city: "Burhanpur", state: "Madhya Pradesh" },
  "450001": { city: "Khandwa", state: "Madhya Pradesh" },
  "462001": { city: "Bhopal", state: "Madhya Pradesh" },
  "452001": { city: "Indore", state: "Madhya Pradesh" },
  "456001": { city: "Ujjain", state: "Madhya Pradesh" },
  "400001": { city: "Mumbai", state: "Maharashtra" },
  "110001": { city: "New Delhi", state: "Delhi" },
  "560001": { city: "Bengaluru", state: "Karnataka" },
}

export default function AddressesPage() {
  const { user, loading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [landmark, setLandmark] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")
  const [type, setType] = useState("Home")
  const [pincodeMessage, setPincodeMessage] = useState("")
  const [pincodeServiceable, setPincodeServiceable] = useState<boolean | null>(
    null
  )
  const [checkingPincode, setCheckingPincode] = useState(false)
  const addressStorageKey = user ? `the-paddler-addresses-${user.uid}` : null

  useEffect(() => {
    if (loading || !addressStorageKey) return

    const saved = localStorage.getItem(addressStorageKey)
    const legacySaved = localStorage.getItem("the-paddler-addresses")

    if (saved) {
      setAddresses(JSON.parse(saved))
      return
    }

    if (legacySaved) {
      const parsed = JSON.parse(legacySaved)
      setAddresses(parsed)
      localStorage.setItem(addressStorageKey, legacySaved)
      localStorage.removeItem("the-paddler-addresses")
    }
  }, [addressStorageKey, loading])

  const saveAddresses = (updated: Address[]) => {
    if (!addressStorageKey) return

    setAddresses(updated)

    localStorage.setItem(
      addressStorageKey,
      JSON.stringify(updated)
    )
  }

  const handlePincodeChange = async (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 6)
    setPincode(cleanValue)
    setPincodeServiceable(null)

    if (cleanValue.length < 6) {
      setCity("")
      setState("")
      setPincodeMessage("")
      return
    }

    const matched = pincodeData[cleanValue]

    if (matched) {
      setCity(matched.city)
      setState(matched.state)
    } else {
      setCity("")
      setState("")
    }

    setCheckingPincode(true)
    setPincodeMessage("Checking live delivery availability...")

    try {
      const response = await fetch(
        `/api/shiprocket/serviceability?pincode=${encodeURIComponent(
          cleanValue
        )}`,
        { cache: "no-store" }
      )
      const data = await response.json()

      if (response.ok && data?.serviceable) {
        setPincodeServiceable(true)
        setPincodeMessage(
          `Delivery available${
            data.courierName ? ` via ${data.courierName}` : ""
          }${data.etd ? `. ETA: ${data.etd}` : "."}`
        )
        return
      }

      if (response.ok && data?.serviceable === false) {
        setPincodeServiceable(false)
        setPincodeMessage("Delivery is currently not serviceable for this pincode.")
        return
      }

      setPincodeMessage(
        "Enter city/state manually. Courier availability will be confirmed before dispatch."
      )
    } catch (error) {
      console.error("ADDRESS PINCODE SERVICEABILITY ERROR:", error)
      setPincodeMessage(
        "Enter city/state manually. Courier availability will be confirmed before dispatch."
      )
    } finally {
      setCheckingPincode(false)
    }
  }

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault()

    if (pincode.length !== 6 || !city.trim() || !state.trim()) {
      alert("Please enter a valid pincode, city, and state.")
      return
    }

    if (pincodeServiceable === false) {
      alert("This pincode is not serviceable right now.")
      return
    }

    const newAddress: Address = {
      id: Date.now(),
      fullName,
      phone,
      address,
      landmark,
      city,
      state,
      pincode,
      type,
    }

    saveAddresses([...addresses, newAddress])

    setFullName("")
    setPhone("")
    setAddress("")
    setLandmark("")
    setCity("")
    setState("")
    setPincode("")
    setType("Home")
    setPincodeMessage("")
    setPincodeServiceable(null)

    alert("Address saved successfully!")
  }

  const deleteAddress = (id: number) => {
    const updated = addresses.filter((item) => item.id !== id)
    saveAddresses(updated)
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <p className="text-xs tracking-[0.35em] text-muted-foreground mb-3">
            CUSTOMER ADDRESS BOOK
          </p>

          <h1 className="text-3xl font-black mb-10">
            SAVED ADDRESSES
          </h1>

          <div className="grid lg:grid-cols-2 gap-10">

            <form
              onSubmit={handleAddAddress}
              className="border border-border bg-secondary/20 p-6 sm:p-8"
            >
              <h2 className="font-black text-2xl flex items-center gap-2 mb-6">
                <Plus className="w-6 h-6" />
                ADD NEW ADDRESS
              </h2>

              <div className="flex flex-col">

                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <textarea
                  placeholder="House no., building, street, area"
                  className="w-full min-h-32 bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white resize-none mt-4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Landmark e.g. near temple, school, mall"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Pincode"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  required
                />

                {pincodeMessage && (
                  <p
                    className={`text-xs mt-2 ${
                      pincodeServiceable === true
                        ? "text-green-400"
                        : pincodeServiceable === false
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {checkingPincode ? "Checking live delivery availability..." : pincodeMessage}
                  </p>
                )}

                <input
                  type="text"
                  placeholder="City"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="State"
                  className="w-full bg-background border border-border px-4 py-4 outline-none focus:border-foreground text-white mt-4"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />

              </div>

              <div className="mt-8">
                <p className="text-xs tracking-[0.3em] text-muted-foreground mb-4">
                  ADDRESS TYPE
                </p>

                <div className="flex gap-3 flex-wrap">
                  {["Home", "Work", "Other"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setType(item)}
                      className={`px-5 py-3 border text-sm font-bold transition-all ${
                        type === item
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-foreground text-background py-4 font-black flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors mt-8"
              >
                <Save className="w-4 h-4" />
                SAVE ADDRESS
              </button>
            </form>

            <div className="space-y-6">

              {addresses.length === 0 ? (
                <div className="border border-border bg-secondary/20 p-10 text-center">

                  <MapPin className="w-14 h-14 mx-auto text-muted-foreground mb-5" />

                  <h2 className="font-black text-2xl mb-3">
                    NO SAVED ADDRESSES
                  </h2>

                  <p className="text-muted-foreground">
                    Add your delivery address to make checkout faster.
                  </p>

                </div>
              ) : (
                addresses.map((item) => (
                  <div
                    key={item.id}
                    className="border border-border bg-secondary/20 p-6"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <span className="inline-block mb-4 px-3 py-1 text-xs font-bold bg-foreground text-background">
                          {item.type}
                        </span>

                        <h3 className="font-black text-lg">
                          {item.fullName}
                        </h3>

                        <p className="text-sm text-muted-foreground mt-2">
                          {item.phone}
                        </p>

                        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                          {item.address}, {item.city}, {item.state} - {item.pincode}
                        </p>

                        {item.landmark && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Landmark: {item.landmark}
                          </p>
                        )}

                      </div>

                      <button
                        onClick={() => deleteAddress(item.id)}
                        className="p-2 hover:bg-secondary text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                    </div>
                  </div>
                ))
              )}

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
