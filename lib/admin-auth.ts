import { doc, getDoc } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"
import { firebaseApiKey } from "@/lib/firebase-config"

type RequestRole = "admin" | "staff" | "customer"

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string
    email?: string
  }>
}

export type AuthorizedRequest = {
  uid: string
  email: string
  role: RequestRole
}

const readBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization") || ""
  return authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : ""
}

export const requireUserRequest = async (request: Request): Promise<AuthorizedRequest> => {
  const token = readBearerToken(request)

  if (!token) {
    throw new Error("Authorization token is required.")
  }

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token }),
    }
  )
  const lookupData = (await lookupResponse.json()) as FirebaseLookupResponse
  const uid = lookupData.users?.[0]?.localId

  if (!lookupResponse.ok || !uid) {
    throw new Error("Invalid authorization token.")
  }

  const profile = await getDoc(doc(serverDb, "users", uid))
  const savedRole = profile.exists() ? String(profile.data().role || "") : ""
  const role: RequestRole =
    savedRole === "admin" || savedRole === "staff" ? savedRole : "customer"

  return {
    uid,
    email: lookupData.users?.[0]?.email || "",
    role,
  }
}

export const requireAdminRequest = async (request: Request) => {
  const auth = await requireUserRequest(request)

  if (auth.role !== "admin") {
    throw new Error("Admin access is required.")
  }

  return auth
}

export const requireStaffRequest = async (request: Request) => {
  const auth = await requireUserRequest(request)

  if (auth.role !== "admin" && auth.role !== "staff") {
    throw new Error("Admin or staff access is required.")
  }

  return auth
}

export const assertOrderAccess = (
  auth: AuthorizedRequest,
  order: Record<string, unknown>,
  action = "access this order"
) => {
  if (auth.role === "admin" || auth.role === "staff") return

  if (String(order.userId || "") !== auth.uid) {
    throw new Error(`You are not allowed to ${action}.`)
  }
}
