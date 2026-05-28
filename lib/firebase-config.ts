const defaultFirebaseConfig = {
  apiKey: "AIzaSyCQqRihdwwSiF-wJb1PL19HIs4rrGLryEI",
  authDomain: "the-paddler-6969.firebaseapp.com",
  projectId: "the-paddler-6969",
  storageBucket: "the-paddler-6969.firebasestorage.app",
  messagingSenderId: "48199959190",
  appId: "1:48199959190:web:2efb9a6e00d3cd912678b7",
  measurementId: "G-2KS3N6K7C2",
}

const readEnv = (key: string, fallback: string) =>
  process.env[key]?.trim() || fallback

export const firebaseClientConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY", defaultFirebaseConfig.apiKey),
  authDomain: readEnv(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    defaultFirebaseConfig.authDomain
  ),
  projectId: readEnv(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    defaultFirebaseConfig.projectId
  ),
  storageBucket: readEnv(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    defaultFirebaseConfig.storageBucket
  ),
  messagingSenderId: readEnv(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    defaultFirebaseConfig.messagingSenderId
  ),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID", defaultFirebaseConfig.appId),
  measurementId: readEnv(
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
    defaultFirebaseConfig.measurementId
  ),
}

export const firebaseProjectId = firebaseClientConfig.projectId
export const firebaseApiKey = firebaseClientConfig.apiKey
export const defaultFirebaseAuthDomain = defaultFirebaseConfig.authDomain
