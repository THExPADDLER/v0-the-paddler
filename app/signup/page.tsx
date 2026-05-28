"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  getRedirectResult,
  linkWithCredential,
  onAuthStateChanged,
  PhoneAuthProvider,
  RecaptchaVerifier,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";

const GOOGLE_REDIRECT_KEY = "the-paddler-google-signup-redirect";

export default function SignupPage() {
  const router = useRouter();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const emailSignupInProgressRef = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [phoneVerificationId, setPhoneVerificationId] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (redirect && redirect.startsWith("/")) return redirect;

    const savedRedirect = sessionStorage.getItem(GOOGLE_REDIRECT_KEY);

    return savedRedirect && savedRedirect.startsWith("/") ? savedRedirect : "/";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;
      if (emailSignupInProgressRef.current) return;

      const redirectPath = getRedirectPath();
      sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
      router.replace(redirectPath);
    });

    return () => unsubscribe();
  }, [router]);

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

  const isMobileBrowser = () =>
    typeof navigator !== "undefined" &&
    /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);

  const formatPhoneInput = (value: string) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("91")) {
      digits = digits.slice(2);
    }

    digits = digits.slice(0, 10);

    const firstGroup = digits.slice(0, 5);
    const secondGroup = digits.slice(5, 10);

    if (!firstGroup) return "+91 ";
    return `+91 ${firstGroup}${secondGroup ? ` ${secondGroup}` : ""}`;
  };

  const formatPhoneNumber = (value: string) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("91")) {
      digits = digits.slice(2);
    }

    if (digits.length === 10) return `+91${digits}`;

    return "";
  };

  const getRecaptchaVerifier = () => {
    if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;

    recaptchaVerifierRef.current = new RecaptchaVerifier(
      auth,
      "signup-recaptcha-container",
      {
        size: "invisible",
        "expired-callback": () => {
          setPhoneVerificationId("");
          setPhoneOtp("");
        },
      }
    );

    return recaptchaVerifierRef.current;
  };

  const getSignupErrorMessage = (error: any) => {
    if (error?.code === "auth/email-already-in-use") {
      return "This email is already registered. Please login.";
    }

    if (error?.code === "auth/invalid-phone-number") {
      return "Please enter a valid mobile number.";
    }

    if (error?.code === "auth/invalid-verification-code") {
      return "The OTP is incorrect. Please check and enter it again.";
    }

    if (error?.code === "auth/code-expired") {
      return "The OTP has expired. Please resend OTP.";
    }

    if (
      error?.code === "auth/credential-already-in-use" ||
      error?.code === "auth/account-exists-with-different-credential"
    ) {
      return "This phone number is already linked with another account.";
    }

    if (error?.code === "auth/operation-not-allowed") {
      return "Phone signup is not enabled yet. Enable Phone provider in Firebase Authentication.";
    }

    return error?.message || "Signup failed. Please try again.";
  };

  const handleSendPhoneOtp = async () => {
    const formattedPhone = formatPhoneNumber(phone);

    if (!formattedPhone) {
      alert("Please enter a valid 10 digit mobile number.");
      return;
    }

    try {
      setSendingOtp(true);
      const provider = new PhoneAuthProvider(auth);
      const verifier = getRecaptchaVerifier();
      const verificationId = await provider.verifyPhoneNumber(
        formattedPhone,
        verifier
      );

      setPhone(formatPhoneInput(formattedPhone));
      setPhoneVerificationId(verificationId);
      alert("OTP sent to your mobile number.");
    } catch (error: any) {
      console.warn("PHONE OTP SETUP ERROR:", error?.code || error);
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      alert(getSignupErrorMessage(error));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please re-enter your password.");
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);

    if (!formattedPhone) {
      alert("Please enter a valid 10 digit mobile number.");
      return;
    }

    if (!phoneVerificationId) {
      alert("Please send OTP and verify your phone number before signup.");
      return;
    }

    if (!phoneOtp.trim()) {
      alert("Please enter the OTP sent to your phone number.");
      return;
    }

    emailSignupInProgressRef.current = true;
    setSigningUp(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const phoneCredential = PhoneAuthProvider.credential(
        phoneVerificationId,
        phoneOtp.trim()
      );

      try {
        const linkedResult = await linkWithCredential(
          result.user,
          phoneCredential
        );

        await updateProfile(linkedResult.user, {
          displayName: `${firstName} ${lastName}`,
        });

        await setDoc(
          doc(db, "users", linkedResult.user.uid),
          {
            uid: linkedResult.user.uid,
            name: `${firstName} ${lastName}`,
            email,
            phone: linkedResult.user.phoneNumber || formattedPhone,
            phoneVerified: true,
            gender,
            providerIds: linkedResult.user.providerData.map(
              (provider) => provider.providerId
            ),
            role: "customer",
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdAt: new Date(
              linkedResult.user.metadata.creationTime || Date.now()
            ).toISOString(),
          },
          { merge: true }
        );

      } catch (linkError) {
        await deleteUser(result.user).catch((deleteError) => {
          console.error("SIGNUP CLEANUP DELETE ERROR:", deleteError);
        });
        throw linkError;
      }

      alert("Signup successful");

      setTimeout(() => {
        router.push(getRedirectPath());
      }, 800);
    } catch (error: any) {
      console.error("SIGNUP ERROR:", error);
      alert(getSignupErrorMessage(error));
    } finally {
      emailSignupInProgressRef.current = false;
      setSigningUp(false);
    }
  };

  const handleGoogleSignup = async () => {
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

      alert("Google Signup Success");
      sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);

      setTimeout(() => {
        router.push(redirectPath);
      }, 800);
    } catch (error: any) {
      console.error("GOOGLE SIGNUP ERROR:", error);

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
            <label className="block mb-2 text-sm text-white/70">
              Mobile Number
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="+91 93992 55433"
                maxLength={16}
                className="min-w-0 flex-1 px-4 py-3 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
                value={phone || "+91 "}
                onChange={(e) => {
                  setPhone(formatPhoneInput(e.target.value));
                  setPhoneVerificationId("");
                  setPhoneOtp("");
                }}
                onFocus={() => {
                  if (!phone) setPhone("+91 ");
                  if (!phone.startsWith("+91 ")) {
                    setPhone(formatPhoneInput(phone));
                  }
                }}
                onKeyDown={(e) => {
                  const cursorPosition = e.currentTarget.selectionStart || 0;

                  if (
                    (e.key === "Backspace" || e.key === "Delete") &&
                    cursorPosition <= 4
                  ) {
                    e.preventDefault();
                  }
                }}
                required
              />
              <button
                type="button"
                onClick={handleSendPhoneOtp}
                disabled={sendingOtp || !formatPhoneNumber(phone)}
                className="shrink-0 px-4 py-3 rounded-lg border border-white/30 text-sm font-semibold hover:bg-white hover:text-black transition disabled:opacity-50"
              >
                {sendingOtp ? "Sending..." : phoneVerificationId ? "Resend" : "OTP"}
              </button>
            </div>
            <div id="signup-recaptcha-container" className="hidden"></div>
          </div>

          {phoneVerificationId && (
            <div>
              <label className="block mb-2 text-sm text-white/70">
                Phone OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                className="w-full px-4 py-3 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm text-white/70">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm text-white/70">Re-enter Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-black border border-white/30 text-white outline-none focus:border-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                aria-label={
                  showConfirmPassword ? "Hide re-entered password" : "Show re-entered password"
                }
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={signingUp}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-white/80 transition disabled:opacity-60"
          >
            {signingUp ? "Creating Account..." : "Sign Up"}
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
