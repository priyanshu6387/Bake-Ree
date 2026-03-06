"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { HiMail } from "react-icons/hi";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/forgot-password",
        { email }
      );

      setMessage(
        response.data.message ||
          "If an account exists with that email, a password reset link has been sent."
      );
      toast.success("Reset link sent");
      setEmail(""); // Clear email for security
    } catch (error: unknown) {
      const errorMessage =
        (axios.isAxiosError(error) ? error.response?.data?.error : null) ||
        "Something went wrong. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#f3f2ec] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#afa5f7] rounded-[2rem] p-8 shadow-lg">
        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#2a2927]">
            Forgot Password?
          </h1>
          <p className="mt-2 text-sm text-[#2a2927]">
            No worries! Enter your email address and we will send you a link to
            reset your password.
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{message}</p>
            <p className="mt-2 text-xs text-green-700">
              Please check your email (and spam folder) for the reset link. The
              link will expire in 1 hour.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-[#2a2927]">
          <div>
            <label className="block mb-2 text-sm font-medium">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent border-b border-[#2a2927] py-2 px-1 pl-8 focus:outline-none"
                disabled={loading}
              />
              <HiMail className="absolute left-0 top-3 text-[#2a2927]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2a2927] text-white py-3 rounded-full font-medium hover:bg-white hover:text-[#2a2927] hover:border hover:border-[#2a2927] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#2a2927] underline hover:text-black"
          >
            ← Back to Login
          </Link>
        </div>

        {/* Don't have an account */}
        <div className="mt-4 text-center">
          <p className="text-sm text-[#2a2927]">
            Do not have an account?{" "}
            <Link
              href="/registration"
              className="font-medium underline hover:text-black"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
