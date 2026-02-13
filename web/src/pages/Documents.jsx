import { useEffect, useMemo, useState } from "react";
import { listDocuments, uploadDocument } from "../lib/api";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await listDocuments();
      setDocs(res.documents || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const summary = useMemo(() => {
    const total = docs.reduce((a, d) => a + (d.sizeBytes || 0), 0);
    return { count: docs.length, totalBytes: total };
  }, [docs]);

  async function onUpload(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please choose a .txt file.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Only .txt files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Max 5MB.");
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      setFile(null);
      await refresh();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Documents</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Upload text files, then ask questions.
      </p>

      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Upload</h3>
        <form onSubmit={onUpload} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ maxWidth: 420 }}
            type="file"
            accept="text/plain,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button className="btn" disabled={uploading} type="submit">
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <button className="btn" type="button" disabled={loading} onClick={refresh} style={{ background: "#334155" }}>
            Refresh
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ marginTop: 0 }}>Uploaded ({summary.count})</h3>
          <div className="muted">Total size: {(summary.totalBytes / 1024).toFixed(1)} KB</div>
        </div>

        {loading ? (
          <div className="muted">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="muted">No documents yet. Upload a .txt file above.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {docs.map((d) => (
              <div
                key={d._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {d.mimeType} · {(d.sizeBytes / 1024).toFixed(1)} KB · {new Date(d.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
                  id: {d._id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
