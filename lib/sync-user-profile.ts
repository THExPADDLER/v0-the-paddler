"use client"

import type { User } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

export const syncUserProfile = async (
  currentUser: User,
  role: "admin" | "customer" = "customer"
) => {
  const userProfile = {
    uid: currentUser.uid,
    name: currentUser.displayName || "Customer",
    email: currentUser.email || "",
    phone: currentUser.phoneNumber || "",
    photoURL: currentUser.photoURL || "",
    providerIds: currentUser.providerData.map((provider) => provider.providerId),
    role,
    lastLoginAt: new Date().toISOString(),
  }

  localStorage.setItem("user", JSON.stringify(userProfile))

  await setDoc(
    doc(db, "users", currentUser.uid),
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
