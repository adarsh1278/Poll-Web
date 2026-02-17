"use client";

export default function PollOptions({
  options,
  totalVotes,
  onVote,
  hasVoted,
  votedOptionId,
  disabled,
}) {
  const getPercentage = (count) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const pct = getPercentage(option.voteCount);
        const isSelected = votedOptionId === option._id;

        return (
          <button
            key={option._id}
            onClick={() => onVote(option._id)}
            disabled={hasVoted || disabled}
            className={`relative w-full text-left rounded-lg border p-4 transition-all overflow-hidden cursor-pointer ${
              isSelected
                ? "border-indigo-500 bg-indigo-50"
                : hasVoted
                ? "border-gray-200 bg-white cursor-default"
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
            } ${disabled && !hasVoted ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {hasVoted && (
              <div
                className="absolute inset-y-0 left-0 bg-indigo-100/60 transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            )}

            <div className="relative flex items-center justify-between">
              <span className={`text-sm font-medium ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>
                {option.text}
              </span>
              {hasVoted && (
                <span className="text-sm font-semibold text-gray-600 ml-2 tabular-nums">
                  {pct}% ({option.voteCount})
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
