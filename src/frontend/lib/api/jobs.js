import { apiFetch } from "./client";

const JOB_URL = process.env.NEXT_PUBLIC_JOB_URL;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function listJobs(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(JOB_URL, `/api/jobs${query ? `?${query}` : ""}`, { headers: authHeaders(token) });
}
export function listMyJobs(token) {
  return apiFetch(JOB_URL, "/api/jobs/mine", { headers: authHeaders(token) });
}
export function getJob(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}`, { headers: authHeaders(token) });
}
export function createJob(payload, token) {
  return apiFetch(JOB_URL, "/api/jobs", { method: "POST", headers: authHeaders(token), body: JSON.stringify(payload) });
}
export function updateJob(id, payload, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(payload) });
}
export function acceptJob(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/accept`, { method: "PATCH", headers: authHeaders(token) });
}
export function getSeekerProfile(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/seeker-profile`, { headers: authHeaders(token) });
}
export function acceptCandidate(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/accept-candidate`, { method: "PATCH", headers: authHeaders(token) });
}
export function startWork(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/start-work`, { method: "PATCH", headers: authHeaders(token) });
}
export function reviewCandidate(id, payload, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/review-candidate`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(payload) });
}
export function scheduleMeeting(id, payload, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/schedule-meeting`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(payload) });
}
export function confirmAttendance(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/confirm-attendance`, { method: "PATCH", headers: authHeaders(token) });
}
// confirmReady REMOVED - do not call, route no longer exists.
export function verifyJob(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/verify`, { method: "PATCH", headers: authHeaders(token) });
}
export function approveJob(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/approve`, { method: "PATCH", headers: authHeaders(token) });
}
export function confirmJob(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/confirm`, { method: "PATCH", headers: authHeaders(token) });
}
export function submitProof(id, payload, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/submit-proof`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(payload) });
}
export function payInvoice(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/pay-invoice`, { method: "PATCH", headers: authHeaders(token) });
}


export function verifyPayment(sessionId, token) {
  return apiFetch(JOB_URL, `/api/jobs/verify-payment?sessionId=${sessionId}`, { headers: authHeaders(token) });
}

export function resumePayment(id, token) {
  return apiFetch(JOB_URL, `/api/jobs/${id}/resume-payment`, { method: "PATCH", headers: authHeaders(token) });
}
