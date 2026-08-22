import { uploadFetch } from "./client";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic file upload - returns { fileId, filename, url }.
// auth.js's uploadResume() does the same underlying call for the resume
// field specifically; use this one for anything else (e.g. daily-wage
// proof-of-work uploads).
export function uploadFile(file, token) {
  const formData = new FormData();
  formData.append("file", file);
  return uploadFetch(AUTH_URL, "/api/uploads", formData, { headers: authHeaders(token) });
}