"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useRouter } from "next/navigation";
import axios from "axios";
import { consumeSessionExpiredFlag } from "@/utils/jwt";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (consumeSessionExpiredFlag()) {
      setSessionMessage("Session logged out. Please login again.");
      toast.error("Session expired. Please login again.");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      const { token } = response.data;

      // ✅ Save token to localStorage
      localStorage.setItem("token", token);

      // ✅ Redirect after login
      toast.success("Logged in successfully");
      router.push("/dashboard"); // Change if needed
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#f3f2ec] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#afa5f7] rounded-[2rem] p-6 shadow-lg">
        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#2a2927]">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-[#2a2927]">Login to your account</p>
        </div>

        {sessionMessage && (
          <div className="mb-4 rounded-xl bg-white/70 px-4 py-3 text-center text-sm text-[#2a2927]">
            {sessionMessage}
          </div>
        )}

        {/* Email Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-[#2a2927]">
          <div>
            <label className="block mb-0.5 text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-[#2a2927] py-1.5 px-1 focus:outline-none"
            />
          </div>

          <div className="relative">
            <label className="block mb-0.5 text-sm font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-[#2a2927] py-1.5 px-1 pr-10 focus:outline-none"
            />
            <div
              className="absolute right-2 top-[1.7rem] cursor-pointer text-xl text-[#2a2927]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </div>
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-[#2a2927] underline hover:text-black"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2a2927] text-white py-2.5 rounded-full hover:bg-white hover:text-[#2a2927] hover:border hover:border-[#2a2927] transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Social Icons Only */}
        <div className="flex justify-center gap-4 my-5">
          {/* Google */}
          <button
            className="bg-white p-3 rounded-full transition-all duration-200 hover:scale-105"
            aria-label="Login with Google"
          >
            <FcGoogle className="text-2xl" />
          </button>

          {/* Apple */}
          <button
            className="bg-white p-3 rounded-full transition-all duration-200 hover:scale-105"
            aria-label="Login with Apple"
          >
            <FaApple className="text-2xl text-black" />
          </button>

          {/* Microsoft */}
          <button
            className="bg-white p-3 rounded-full transition-all duration-200 hover:scale-105"
            aria-label="Login with Microsoft"
          >
            <Image
              src="/icons/microsoft.svg"
              alt="Microsoft"
              width={22}
              height={22}
              className="rounded-sm"
            />
          </button>
        </div>

        {/* Signup Link */}
        <div className="mt-1 text-center text-sm text-[#2a2927]">
          Don’t have an account?{" "}
          <Link href="/registration" className="underline hover:text-black">
            Sign up
          </Link>
        </div>
      </div>
    </section>
  );
}
  
