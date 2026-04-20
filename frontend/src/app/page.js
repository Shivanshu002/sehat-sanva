"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in URL params
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Redirect to report page with token
      router.replace(`/report?token=${token}`);
    } else {
      // No token — show invalid link message
      router.replace("/invalid");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Verifying your link...</p>
      </div>
    </div>
  );
}