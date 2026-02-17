const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const request = async (path, options) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(
      json.message || "Request failed",
      json.statusCode || res.status
    );
  }

  return json.data;
};

export const createPoll = (payload) =>
  request("/polls", { method: "POST", body: JSON.stringify(payload) });

export const getPoll = (id) => request(`/polls/${id}`);

export const getPollResults = (id) => request(`/polls/${id}/results`);

export const submitVote = (payload) =>
  request("/votes", { method: "POST", body: JSON.stringify(payload) });

export { ApiError };
