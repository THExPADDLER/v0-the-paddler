"use client"

import type { User } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

export type UserRole = "admin" | "staff" | "influencer" | "customer"

const ADMIN_EMAILS = ["vp982761@gmail.com", "thexpaddler@gmail.com"]

export const syncUserProfile = async (
  currentUser: User,
  role?: UserRole
) => {
  const userRef = doc(db, "users", currentUser.uid)
  const existingSnap = await getDoc(userRef)
  const existingRole = existingSnap.exists()
    ? (existingSnap.data().role as UserRole | undefined)
    : undefined
  const email = currentUser.email || ""
  const resolvedRole =
    role || existingRole || (ADMIN_EMAILS.includes(email) ? "admin" : "customer")
  const userProfile = {
    uid: currentUser.uid,
    name: currentUser.displayName || "Customer",
    email,
    phone: currentUser.phoneNumber || "",
    photoURL: currentUser.photoURL || "",
    providerIds: currentUser.providerData.map((provider) => provider.providerId),
    role: resolvedRole,
    lastLoginAt: new Date().toISOString(),
  }

  localStorage.setItem("user", JSON.stringify(userProfile))

  await setDoc(
    userRef,
    {
      ...userProfile,
      createdAt: new Date(
        currentUser.metadata.creationTime || Date.now()
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )

  return userProfile
}
