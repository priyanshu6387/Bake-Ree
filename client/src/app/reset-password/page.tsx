"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { HiEye, HiEyeOff, HiLockClosed } from "react-icons/hi";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get token from URL query parameter
    const tokenParam = searchParams?.get("token") ?? null;
    if (!tokenParam) {
      setError("Invalid reset link. Please request a new password reset.");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      toast.error("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      toast.error("Invalid reset token");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/reset-password",
        {
          token,
          newPassword: password,
        }
      );

      setMessage(response.data.message || "Password reset successfully!");
      toast.success("Password reset successfully!");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        (axios.isAxiosError(error) ? error.response?.data?.error : null) ||
        "Failed to reset password. The link may have expired. Please request a new one.";
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
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-[#2a2927]">
            Enter your new password below
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{message}</p>
            <p className="mt-2 text-xs text-green-700">
              Redirecting to login page...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
            {error.includes("expired") && (
              <Link
                href="/forgot-password"
                className="mt-2 inline-block text-sm text-red-700 underline"
              >
                Request a new reset link
              </Link>
            )}
          </div>
        )}

        {/* Form */}
        {token && (
          <form onSubmit={handleSubmit} className="space-y-4 text-[#2a2927]">
            <div className="relative">
              <label className="block mb-2 text-sm font-medium">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full bg-transparent border-b border-[#2a2927] py-2 px-1 pl-8 pr-10 focus:outline-none"
                disabled={loading}
              />
              <HiLockClosed className="absolute left-0 top-9 text-[#2a2927]" />
              <div
                className="absolute right-2 top-9 cursor-pointer text-xl text-[#2a2927]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="relative">
              <label className="block mb-2 text-sm font-medium">
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-transparent border-b border-[#2a2927] py-2 px-1 pl-8 pr-10 focus:outline-none"
                disabled={loading}
              />
              <HiLockClosed className="absolute left-0 top-9 text-[#2a2927]" />
              <div
                className="absolute right-2 top-9 cursor-pointer text-xl text-[#2a2927]"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-[#2a2927] text-white py-3 rounded-full font-medium hover:bg-white hover:text-[#2a2927] hover:border hover:border-[#2a2927] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#2a2927] underline hover:text-black"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </section>
  );
}
