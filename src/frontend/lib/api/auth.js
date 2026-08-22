import { apiFetch, uploadFetch } from "./client";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;

export function register(payload) {
  return apiFetch(AUTH_URL, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function login(payload) {
  return apiFetch(AUTH_URL, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function completeProfile(payload, token) {
  return apiFetch(AUTH_URL, "/api/auth/complete-profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}
export function getMe(token) {
  return apiFetch(AUTH_URL, "/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export function updateProfile(payload, token) {
  return apiFetch(AUTH_URL, "/api/auth/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}
export function uploadResume(file, token) {
  const formData = new FormData();
  formData.append("file", file);
  return uploadFetch(AUTH_URL, "/api/uploads", formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}