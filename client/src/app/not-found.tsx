// client/src/app/not-found.tsx

"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <section
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/404.png')" }}
    >
      <div
        className="absolute"
        style={{
          top: "82%", // Adjust this value for exact vertical alignment
          left: "14%", // Center horizontally
          transform: "translate(-50%, -50%)",
        }}
      >
        <Link
          href="/"
          className="inline-block px-8 py-3 text-lg font-semibold bg-[#7f6df2] text-white rounded-full hover:bg-[#6b5fcf] transition shadow-md"
        >
          Go Back Home
        </Link>
      </div>
    </section>
  );
}
