import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { initializeFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

import { defaultFirebaseAuthDomain, firebaseClientConfig } from "@/lib/firebase-config"

const getAuthDomain = () => {
  if (typeof window === "undefined") {
    return firebaseClientConfig.authDomain
  }

  const hostname = window.location.hostname

  if (hostname.endsWith(".vercel.app") || hostname === "thepaddler.in" || hostname === "www.thepaddler.in") {
    return hostname
  }

  return firebaseClientConfig.authDomain || defaultFirebaseAuthDomain
}

const firebaseConfig = {
  ...firebaseClientConfig,
  authDomain: getAuthDomain(),
};

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
})
export const storage = getStorage(app)
