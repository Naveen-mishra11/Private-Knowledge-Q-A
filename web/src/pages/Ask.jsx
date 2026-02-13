import { useMemo, useState } from "react";
import { askQuestion } from "../lib/api";

function scoreLabel(s) {
  if (typeof s !== "number") return "";
  return s.toFixed(3);
}

export default function Ask() {
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canAsk = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  async function onAsk(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!question.trim()) {
      setError("Please type a question.");
      return;
    }
    setLoading(true);
    try {
      const res = await askQuestion(question.trim(), topK);
      setResult(res);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Ask</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Ask a question. You’ll get an answer plus citations (document + excerpt).
      </p>

      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <form onSubmit={onAsk} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="input"
            placeholder="e.g., What does my resume say about my location?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label className="muted" style={{ fontSize: 12 }}>
              Top K:
              <input
                className="input"
                style={{ width: 90, marginLeft: 8 }}
                type="number"
                min={1}
                max={10}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value || 4))}
              />
            </label>
            <button className="btn" disabled={!canAsk} type="submit">
              {loading ? "Asking…" : "Ask"}
            </button>
          </div>
        </form>
      </div>

      {result ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Answer</h3>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{result.answer}</div>

          <h3 style={{ marginTop: 18 }}>Citations</h3>
          {result.citations?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.citations.map((c) => (
                <details key={c.chunk_id} className="card" style={{ padding: 12 }}>
                  <summary style={{ cursor: "pointer" }}>
                    <strong>{c.doc_name}</strong> · chunk {c.chunk_index} · score {scoreLabel(c.score)}
                  </summary>
                  <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                    docId: {c.doc_id}
                  </div>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.25)",
                    }}
                  >
                    {c.text}
                  </pre>
                </details>
              ))}
            </div>
          ) : (
            <div className="muted">No citations returned.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
