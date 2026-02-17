"use client";

import { useEffect, useState, useCallback, use } from "react";
import { getPoll } from "../../lib/api";
import { getFingerprint } from "../../lib/fingerprint";
import {
  hasVotedLocally,
  markVotedLocally,
  getLocalVoteOption,
} from "../../lib/storage";
import { usePollSocket } from "../../hooks/usePollSocket";
import PollOptions from "../../components/PollOptions";
import ShareLink from "../../components/ShareLink";
import Spinner from "../../components/Spinner";
import ErrorCard from "../../components/ErrorCard";

export default function PollPage({ params }) {
  const { id: pollId } = use(params);

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState(null);

  const { results, connected, submitVote, setResults } =
    usePollSocket(pollId);

  const fetchPoll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPoll(pollId);
      setPoll(data);
      setResults({
        pollId: data.poll._id,
        question: data.poll.question,
        totalVotes: data.poll.totalVotes,
        expiresAt: data.poll.expiresAt,
        options: data.options.map((o) => ({
          _id: o._id,
          text: o.text,
          voteCount: o.voteCount,
          pollId: o.pollId,
        })),
      });
    } catch (err) {
      setError(err.message || "Failed to load poll.");
    } finally {
      setLoading(false);
    }
  }, [pollId, setResults]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  useEffect(() => {
    if (hasVotedLocally(pollId)) {
      setHasVoted(true);
      setVotedOptionId(getLocalVoteOption(pollId));
    }
  }, [pollId]);

  const handleVote = async (optionId) => {
    if (hasVoted || voteLoading) return;
    setVoteLoading(true);
    setVoteError(null);

    try {
      const fingerprint = await getFingerprint();
      const response = await submitVote(optionId, fingerprint);

      if (response.status === "error") {
        setVoteError(response.message || "Vote failed.");
        if (response.statusCode === 403) {
          setHasVoted(true);
          markVotedLocally(pollId, optionId);
        }
        return;
      }

      setHasVoted(true);
      setVotedOptionId(optionId);
      markVotedLocally(pollId, optionId);
    } catch {
      setVoteError("Network error. Please try again.");
    } finally {
      setVoteLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorCard message={error} onRetry={fetchPoll} />;
  if (!poll || !results) return <ErrorCard message="Poll not found." />;

  const isExpired =
    poll.poll.expiresAt && new Date(poll.poll.expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {results.question}
        </h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
          <span>
            {results.totalVotes} vote{results.totalVotes !== 1 ? "s" : ""}
          </span>
          {!connected && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Reconnecting...
            </span>
          )}
          {connected && (
            <span className="inline-flex items-center gap-1 text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Live
            </span>
          )}
        </div>
      </div>

      {isExpired && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
          This poll has expired. Voting is closed.
        </div>
      )}

      {voteError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {voteError}
        </div>
      )}

      <PollOptions
        options={results.options}
        totalVotes={results.totalVotes}
        onVote={handleVote}
        hasVoted={hasVoted || !!isExpired}
        votedOptionId={votedOptionId}
        disabled={voteLoading || !!isExpired}
      />

      <ShareLink pollId={pollId} />
    </div>
  );
}
