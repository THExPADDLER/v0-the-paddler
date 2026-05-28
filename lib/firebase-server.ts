import { getApps, initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore/lite"

import { firebaseClientConfig } from "@/lib/firebase-config"

const app =
  getApps().find((item) => item.name === "server-lite") ||
  initializeApp(firebaseClientConfig, "server-lite")

export const serverDb = getFirestore(app)
