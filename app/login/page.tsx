"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
} from "firebase/auth";

const GOOGLE_REDIRECT_KEY = "the-paddler-google-login-redirect";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectQuery, setRedirectQuery] = useState("");

  useEffect(() => {
    setRedirectQuery(window.location.search);
  }, []);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          router.push(getRedirectPath());
        }
      })
      .catch((error: any) => {
        console.error("GOOGLE REDIRECT ERROR:", error);
        alert(getGoogleAuthMessage(error));
      });
  }, [router]);

  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (redirect && redirect.startsWith("/")) return redirect;

    const savedRedirect = sessionStorage.getItem(GOOGLE_REDIRECT_KEY);

    return savedRedirect && savedRedirect.startsWith("/") ? savedRedirect : "/";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;

      const redirectPath = getRedirectPath();
      sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
      router.replace(redirectPath);
    });

    return () => unsubscribe();
  }, [router]);

  const getGoogleAuthMessage = (error: any) => {
    if (error?.code === "auth/unauthorized-domain") {
      return "Google login is not enabled for this website domain yet. Add this Vercel domain in Firebase Authorized domains.";
    }

    if (error?.code === "auth/popup-blocked") {
      return "Popup was blocked. Opening Google login in the same tab.";
    }

    if (error?.code === "auth/popup-closed-by-user") {
      return "Google login was closed before completion.";
    }

    return error?.message || "Google Login Failed";
  };

  const isMobileBrowser = () =>
    typeof navigator !== "undefined" &&
    /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      alert("Login successful");
      router.push(getRedirectPath());
    } catch (error) {
      console.error("EMAIL LOGIN ERROR:", error);
      alert("Login failed. Please check your email and password.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const redirectPath = getRedirectPath();

      sessionStorage.setItem(GOOGLE_REDIRECT_KEY, redirectPath);
      await setPersistence(auth, browserLocalPersistence);

      if (isMobileBrowser()) {
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await signInWithPopup(auth, provider);

      alert("Google Login Success");
      sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
      router.push(redirectPath);
    } catch (error: any) {
      console.error("GOOGLE ERROR:", error);

      if (
        error?.code === "auth/popup-blocked" ||
        error?.code === "auth/cancelled-popup-request"
      ) {
        sessionStorage.setItem(GOOGLE_REDIRECT_KEY, getRedirectPath());
        await setPersistence(auth, browserLocalPersistence);
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return;
      }

      alert(getGoogleAuthMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">THE PADDLER</h1>
        <p className="text-center text-white/60 mb-8">
          Login to your account
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm text-white/70">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-white/70">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-white/80 transition"
          >
            Login
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-white/20 flex-1"></div>
          <span className="text-white/50 text-sm">OR</span>
          <div className="h-px bg-white/20 flex-1"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full border border-white/30 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition"
        >
          Continue with Google
        </button>

        <p className="text-center text-white/60 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <a
            href={`/signup${redirectQuery}`}
            className="text-white underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
