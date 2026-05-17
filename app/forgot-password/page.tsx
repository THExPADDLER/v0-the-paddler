"use client"

import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Demo OTP sent: 123456")
    setStep(2)
  }

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault()

    if (otp !== "123456") {
      alert("Invalid OTP. Use 123456 for demo.")
      return
    }

    setStep(3)
  }

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Password changed successfully. Please login again.")
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-black text-white px-6">
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-lg font-bold tracking-wider">
          THE PADDLER
        </Link>
      </div>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md border border-neutral-800 p-8">
          <h1 className="text-3xl font-bold mb-2">RESET PASSWORD</h1>

          <p className="text-sm text-neutral-400 mb-8">
            Step {step} of 3
          </p>

          {step === 1 && (
            <form onSubmit={sendOtp} className="space-y-4">
              <input
                type="text"
                placeholder="Registered email or phone number"
                className="w-full bg-black border border-neutral-700 p-3 outline-none"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />

              <button className="w-full bg-white text-black py-3 font-bold">
                SEND OTP
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full bg-black border border-neutral-700 p-3 outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <button className="w-full bg-white text-black py-3 font-bold">
                VERIFY OTP
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={changePassword} className="space-y-4">
              <input
                type="password"
                placeholder="New password"
                className="w-full bg-black border border-neutral-700 p-3 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <button className="w-full bg-white text-black py-3 font-bold">
                CHANGE PASSWORD
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="inline-block mt-6 text-sm text-neutral-400 hover:text-white"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}