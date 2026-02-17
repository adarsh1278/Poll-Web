const STORAGE_KEY = "voted_polls";

export const hasVotedLocally = (pollId) => {
  if (typeof window === "undefined") return false;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return !!data[pollId];
  } catch {
    return false;
  }
};

export const markVotedLocally = (pollId, optionId) => {
  if (typeof window === "undefined") return;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    data[pollId] = optionId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

export const getLocalVoteOption = (pollId) => {
  if (typeof window === "undefined") return null;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data[pollId] || null;
  } catch {
    return null;
  }
};
