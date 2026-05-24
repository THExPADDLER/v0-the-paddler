import serviceabilityData from "@/lib/shiprocket-serviceable-pincodes.json"

export type ServiceablePincode = {
  city: string
  cities?: string[]
  state?: string
  couriers?: string[]
  zones?: string[]
  estimatedDeliveryDays: number
}

export const serviceablePincodes =
  serviceabilityData as Record<string, ServiceablePincode>

export const getFallbackPincode = (pincode: string) => {
  const clean = pincode.replace(/\D/g, "").slice(0, 6)

  return serviceablePincodes[clean] || null
}

export const getServiceablePincode = getFallbackPincode
