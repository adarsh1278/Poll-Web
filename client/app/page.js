"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreatePollForm from "./components/CreatePollForm";
import ShareLink from "./components/ShareLink";
import { createPoll } from "./lib/api";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdPollId, setCreatedPollId] = useState(null);
  const [error, setError] = useState(null);

  const handleCreate = async (question, options, expiresAt) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { question, options };
      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }
      const data = await createPoll(payload);
      setCreatedPollId(data.pollId);
    } catch (err) {
      setError(err.message || "Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Poll</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {createdPollId ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">Poll created successfully!</p>
          </div>
          <ShareLink pollId={createdPollId} />
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/poll/${createdPollId}`)}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Go to Poll
            </button>
            <button
              onClick={() => {
                setCreatedPollId(null);
                setError(null);
              }}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        <CreatePollForm onSubmit={handleCreate} loading={loading} />
      )}
    </div>
  );
}
