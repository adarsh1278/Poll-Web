"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";

export const usePollSocket = (pollId) => {
  const [results, setResults] = useState(null);
  const [connected, setConnected] = useState(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit("join_poll", pollId);
      joinedRef.current = true;
    };

    const onDisconnect = () => {
      setConnected(false);
      joinedRef.current = false;
    };

    const onReconnect = () => {
      socket.emit("join_poll", pollId);
      joinedRef.current = true;
    };

    const onVoteUpdate = (data) => {
      setResults(data);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect", onReconnect);
    socket.on("vote_update", onVoteUpdate);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      if (joinedRef.current) {
        socket.emit("leave_poll", pollId);
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect", onReconnect);
      socket.off("vote_update", onVoteUpdate);
      disconnectSocket();
    };
  }, [pollId]);

  const submitVote = useCallback(
    (optionId, fingerprint) => {
      return new Promise((resolve) => {
        const socket = getSocket();
        socket.emit(
          "submit_vote",
          { pollId, optionId, fingerprint },
          (response) => {
            if (response.status === "success" && response.data) {
              setResults(response.data);
            }
            resolve(response);
          }
        );
      });
    },
    [pollId]
  );

  return { results, connected, submitVote, setResults };
};
