"use client";

import { useRouter } from "next/navigation";

export default function InvalidPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800 text-center">

        {/* Icon */}
        <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔗</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Invalid or Expired Link
        </h1>

        {/* Message */}
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          This health report link is either invalid, expired, or has already been used.
          Each link can only be accessed once.
        </p>

        {/* Info Box */}
        <div className="bg-gray-800 rounded-xl p-4 mb-8 text-left space-y-2">
          <p className="text-gray-400 text-xs flex items-start gap-2">
            <span>⏱️</span> Links expire after <span className="text-white font-semibold">7 days</span>
          </p>
          <p className="text-gray-400 text-xs flex items-start gap-2">
            <span>🔒</span> Each link is <span className="text-white font-semibold">single-use only</span>
          </p>
          <p className="text-gray-400 text-xs flex items-start gap-2">
            <span>🏥</span> Contact your hospital for a <span className="text-white font-semibold">new report link</span>
          </p>
        </div>

        {/* Footer */}
        <p className="text-gray-600 text-xs">
          Powered by APIE — Autonomous Patient Insight Engine
        </p>

      </div>
    </div>
  );
}