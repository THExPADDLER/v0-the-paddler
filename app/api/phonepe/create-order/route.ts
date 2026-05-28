import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "PhonePe checkout is disabled. Please use Razorpay.",
    },
    { status: 410 }
  )
}
