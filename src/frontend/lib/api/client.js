export async function apiFetch(baseUrl, path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message = data?.message || data?.error || "Request failed";
    const fieldErrors = data?.details?.fieldErrors || data?.details;
    if (fieldErrors && typeof fieldErrors === "object") {
      const parts = Object.entries(fieldErrors)
        .filter(([, msgs]) => Array.isArray(msgs) && msgs.length)
        .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`);
      if (parts.length) message = parts.join(" | ");
    }
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.code;
    error.details = data?.details;
    throw error;
  }
  return data;
}

export async function uploadFetch(baseUrl, path, formData, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    method: options.method || "POST",
    body: formData,
    headers: { ...options.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || data?.error || "Upload failed";
    const error = new Error(message);
    error.status = res.status;
    error.details = data?.details;
    throw error;
  }
  return data;
}