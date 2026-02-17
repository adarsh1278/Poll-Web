"use client";

import { useState } from "react";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export default function CreatePollForm({ onSubmit, loading }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState(null);

  const addOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > MIN_OPTIONS) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const validate = () => {
    const trimmedQ = question.trim();
    if (!trimmedQ) return "Question is required.";
    if (trimmedQ.length > 200) return "Question must be 200 characters or less.";

    const trimmedOpts = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (trimmedOpts.length < MIN_OPTIONS) return `At least ${MIN_OPTIONS} options are required.`;
    if (trimmedOpts.some((o) => o.length > 200)) return "Each option must be 200 characters or less.";

    const lower = trimmedOpts.map((o) => o.toLowerCase());
    if (new Set(lower).size !== lower.length) return "Duplicate options are not allowed.";

    if (expiresAt) {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime()) || d <= new Date()) return "Expiration must be in the future.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const trimmedOpts = options.map((o) => o.trim()).filter((o) => o.length > 0);
    await onSubmit(question.trim(), trimmedOpts, expiresAt || null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
          Question
        </label>
        <input
          id="question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          placeholder="What do you want to ask?"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">{question.length}/200</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                maxLength={200}
                placeholder={`Option ${i + 1}`}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="shrink-0 rounded-md p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  aria-label="Remove option"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium cursor-pointer"
          >
            + Add option
          </button>
        )}
      </div>

      <div>
        <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
          Expiration (optional)
        </label>
        <input
          id="expiresAt"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Creating..." : "Create Poll"}
      </button>
    </form>
  );
}
