import { getApps, initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore/lite"

const firebaseServerConfig = {
  apiKey: "AIzaSyCQqRihdwwSiF-wJb1PL19HIs4rrGLryEI",
  authDomain: "the-paddler-6969.firebaseapp.com",
  projectId: "the-paddler-6969",
  storageBucket: "the-paddler-6969.firebasestorage.app",
  messagingSenderId: "48199959190",
  appId: "1:48199959190:web:2efb9a6e00d3cd912678b7",
  measurementId: "G-2KS3N6K7C2",
}

const app =
  getApps().find((item) => item.name === "server-lite") ||
  initializeApp(firebaseServerConfig, "server-lite")

export const serverDb = getFirestore(app)
