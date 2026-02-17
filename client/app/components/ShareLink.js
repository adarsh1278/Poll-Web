"use client";

import { useState } from "react";

export default function ShareLink({ pollId }) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/poll/${pollId}`
      : `/poll/${pollId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <input
        readOnly
        value={url}
        className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
      />
      <button
        onClick={copy}
        className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
