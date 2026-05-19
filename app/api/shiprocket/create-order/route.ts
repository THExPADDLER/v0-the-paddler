import { NextResponse } from "next/server"

import {
  createShiprocketShipment,
  createShiprocketShipmentForOrder,
} from "@/lib/shiprocket"

export async function POST(request: Request) {
  try {
    const { orderId, order } = await request.json()

    if (!orderId && !order?.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "orderId or order is required.",
        },
        { status: 400 }
      )
    }

    const shipment = order
      ? await createShiprocketShipment(order)
      : await createShiprocketShipmentForOrder(orderId)

    return NextResponse.json({
      ok: true,
      orderId: order?.id || orderId,
      shipment,
    })
  } catch (error) {
    console.error("SHIPROCKET CREATE ORDER ROUTE ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create Shiprocket order.",
      },
      { status: 500 }
    )
  }
}
