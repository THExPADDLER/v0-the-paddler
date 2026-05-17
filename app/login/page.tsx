"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log("Email login user:", result.user);
      alert("Login successful");
      router.push("/");
    } catch (error) {
      console.error("EMAIL LOGIN ERROR:", error);
      alert("Login failed. Please check your email and password.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      console.log("Google login user:", result.user);
      alert("Google Login Success");
      router.push("/");
    } catch (error) {
      console.error("GOOGLE ERROR:", error);
      alert("Google Login Failed");
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
          <a href="/signup" className="text-white underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}