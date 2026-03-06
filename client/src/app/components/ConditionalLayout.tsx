"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  clearStoredToken,
  isTokenExpired,
  setSessionExpiredFlag,
} from "@/utils/jwt";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname?.startsWith("/admin");
  const isKitchenPage = pathname?.startsWith("/kitchen");
  const isOpsPage = pathname?.startsWith("/ops");

  // Handle initial page load/refresh - always scroll to top and clear hash
  useEffect(() => {
    // Prevent automatic scroll restoration on page refresh
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // On page load/refresh, clear hash and scroll to top
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
    window.scrollTo(0, 0);
  }, []); // Empty deps = only run on mount

  // Handle pathname changes (navigation to different pages)
  useEffect(() => {
    // On navigation to different page, scroll to top
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const handleExpiredToken = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (isTokenExpired(token)) {
        setSessionExpiredFlag();
        clearStoredToken();
        if (!window.location.pathname.startsWith("/login")) {
          router.push("/login");
        }
      }
    };

    handleExpiredToken();
    const intervalId = window.setInterval(handleExpiredToken, 60000);
    return () => window.clearInterval(intervalId);
  }, [router]);

  // Handle hash changes (when user clicks links with hash)
  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash;
      if (newHash) {
        setTimeout(() => {
          const element = document.querySelector(newHash);
          if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 80;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Handle clicks on hash links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href*='#']") as HTMLAnchorElement;
      
      if (link) {
        try {
          const url = new URL(link.href);
          const hash = url.hash;
          
          if (hash && url.pathname === window.location.pathname) {
            // Same page hash link - handle scroll manually
            setTimeout(() => {
              const element = document.querySelector(hash);
              if (element) {
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - 80;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                });
              }
            }, 100);
          }
        } catch {
          // Handle relative URLs
          const href = link.getAttribute("href");
          if (href && href.startsWith("#")) {
            setTimeout(() => {
              const element = document.querySelector(href);
              if (element) {
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - 80;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                });
              }
            }, 100);
          }
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <>
      {!isAdminPage && !isKitchenPage && !isOpsPage && <Navbar />}
      {children}
      {!isAdminPage && !isKitchenPage && !isOpsPage && <Footer />}
      <Toaster
        position="top-right"
        containerStyle={{ top: 90, right: 20 }}
        toastOptions={{
          className: "app-toast",
          duration: 3500,
          success: {
            className: "app-toast app-toast-success",
          },
          error: {
            className: "app-toast app-toast-error",
          },
        }}
      />
    </>
  );
}
