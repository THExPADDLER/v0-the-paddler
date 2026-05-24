import { NextResponse } from "next/server"

import { getServiceablePincode } from "@/lib/serviceable-pincodes"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const pincode = url.searchParams.get("pincode")?.replace(/\D/g, "").slice(0, 6)

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        {
          ok: false,
          message: "Valid 6-digit pincode is required.",
        },
        { status: 400 }
      )
    }

    const match = getServiceablePincode(pincode)

    if (!match) {
      return NextResponse.json({
        ok: true,
        pincode,
        serviceable: false,
        source: "shiprocket-file",
        message: "Delivery is currently not serviceable for this pincode.",
      })
    }

    return NextResponse.json({
      ok: true,
      pincode,
      serviceable: true,
      source: "shiprocket-file",
      city: match.city || null,
      cities: match.cities || [],
      state: match.state || null,
      zone: match.zones?.[0] || null,
      zones: match.zones || [],
      courierName: match.couriers?.[0] || null,
      couriers: match.couriers || [],
      courierCount: match.couriers?.length || 0,
      estimatedDeliveryDays: match.estimatedDeliveryDays,
      rate: null,
      message: match.city
        ? `Delivery available in ${match.city}.`
        : "Delivery is available for this pincode.",
    })
  } catch (error) {
    console.error("SHIPROCKET SERVICEABILITY FILE ROUTE ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to check pincode serviceability.",
      },
      { status: 500 }
    )
  }
}
