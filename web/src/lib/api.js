const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error || json?.detail || `Request failed: ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

export function getHealth() {
  return request("/health");
}

export function getStatus() {
  return request("/status");
}

export function listDocuments() {
  return request("/documents");
}

export function uploadDocument(file) {
  const fd = new FormData();
  fd.append("file", file);
  return request("/documents", { method: "POST", body: fd });
}

export function askQuestion(question, topK) {
  return request("/qa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, topK }),
  });
}
