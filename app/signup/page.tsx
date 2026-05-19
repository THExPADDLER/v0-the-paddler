"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
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
        console.error("GOOGLE SIGNUP REDIRECT ERROR:", error);
        alert(getGoogleAuthMessage(error));
      });
  }, [router]);

  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    return redirect && redirect.startsWith("/") ? redirect : "/";
  };

  const getGoogleAuthMessage = (error: any) => {
    if (error?.code === "auth/unauthorized-domain") {
      return "Google signup is not enabled for this website domain yet. Add this Vercel domain in Firebase Authorized domains.";
    }

    if (error?.code === "auth/popup-blocked") {
      return "Popup was blocked. Opening Google signup in the same tab.";
    }

    if (error?.code === "auth/popup-closed-by-user") {
      return "Google signup was closed before completion.";
    }

    return error?.message || "Google Signup Failed";
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`,
      });

      console.log("Signup user:", result.user);
      console.log("Gender:", gender);

      alert("Signup successful");

      setTimeout(() => {
        router.push(getRedirectPath());
      }, 800);
    } catch (error: any) {
      console.error("SIGNUP ERROR:", error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login.");
      } else {
        alert("Signup failed. Check console error.");
      }
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      console.log("Google signup user:", result.user);

      alert("Google Signup Success");

      setTimeout(() => {
        router.push(getRedirectPath());
      }, 800);
    } catch (error: any) {
      console.error("GOOGLE SIGNUP ERROR:", error);

      if (
        error?.code === "auth/popup-blocked" ||
        error?.code === "auth/cancelled-popup-request" ||
        /mobile|android|iphone|ipad/i.test(navigator.userAgent)
      ) {
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
        <p className="text-center text-white/60 mb-8">Create your account</p>

        <form onSubmit={handleEmailSignup} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-2 text-sm text-white/70">First Name</label>
              <input
                type="text"
                placeholder="First name"
                className="w-full px-4 py-3 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-white/70">Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                className="w-full px-4 py-3 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-3 text-sm text-white/70">Gender</label>

            <div className="grid grid-cols-3 gap-3">
              {["Male", "Female", "Other"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGender(item)}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm transition ${
                    gender === item
                      ? "border-white bg-white text-black"
                      : "border-white/30 bg-black text-white hover:border-white"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      gender === item ? "border-black" : "border-white/60"
                    }`}
                  >
                    {gender === item && (
                      <span className="h-2 w-2 rounded-full bg-black"></span>
                    )}
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </div>

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
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-3 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-white/80 transition"
          >
            Sign Up
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-white/20 flex-1"></div>
          <span className="text-white/50 text-sm">OR</span>
          <div className="h-px bg-white/20 flex-1"></div>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full border border-white/30 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition"
        >
          Continue with Google
        </button>

        <p className="text-center text-white/60 text-sm mt-6">
          Already have an account?{" "}
          <a
            href={`/login${redirectQuery}`}
            className="text-white underline"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
