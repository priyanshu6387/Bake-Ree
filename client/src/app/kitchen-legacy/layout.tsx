"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isKitchenStaff, isAdmin } from "../../utils/auth";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const redirectPath = pathname ?? "/";
  const [checking, setChecking] = useState(true);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (isDev) {
      setChecking(false);
      return;
    }

    const checkAccess = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login?redirect=" + encodeURIComponent(redirectPath));
        return;
      }

      // Check if user is kitchen staff or admin
      if (!isKitchenStaff() && !isAdmin()) {
        try {
          const response = await fetch("http://localhost:5000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            if (
              user.role !== "kitchen_staff" &&
              user.role !== "admin" &&
              !user.isAdmin
            ) {
              router.push("/dashboard");
              return;
            }
          } else {
            router.push("/login?redirect=" + encodeURIComponent(redirectPath));
            return;
          }
        } catch (error) {
          console.error("Error checking kitchen access:", error);
          router.push("/login?redirect=" + encodeURIComponent(redirectPath));
          return;
        }
      }

      setChecking(false);
    };

    checkAccess();
  }, [router, redirectPath, isDev]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f3f2ec] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a2927] mx-auto mb-4"></div>
          <p className="text-xl text-[#2a2927]">Checking access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
