const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    // Network-level failure — API is down or unreachable, not a CognoDB issue per se.
    throw new ApiError(
      "Can't reach the SkillPath API. Is the backend server running?",
      0
    );
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    throw new ApiError(
      body?.error || `Request failed with status ${res.status}`,
      res.status
    );
  }
  return body;
}

export const api = {
  health: () => request("/health"),
  stats: () => request("/stats"),

  people: (params = {}) => request(`/people?${new URLSearchParams(params)}`),
  person: (id) => request(`/people/${id}`),

  jobs: (params = {}) => request(`/jobs?${new URLSearchParams(params)}`),
  job: (id) => request(`/jobs/${id}`),
  jobCandidates: (id) => request(`/jobs/${id}/candidates`),

  skills: () => request("/skills"),
  skillGraph: () => request("/skills/graph"),
  skill: (id) => request(`/skills/${id}`),
  skillPath: (from, to) =>
    request(`/skills/path/between?${new URLSearchParams({ from, to })}`),

  courses: () => request("/courses"),

  pathway: (personId, jobId) =>
    request(`/pathway?${new URLSearchParams({ personId, jobId })}`),
};

export { ApiError };
